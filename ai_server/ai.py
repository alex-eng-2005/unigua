from io import BytesIO
from PIL import Image
import cv2
from fastapi.responses import StreamingResponse
import numpy as np
import json
import ctranslate2
import tesserocr
import fitz
from fastapi import FastAPI, File, Form, UploadFile
from paddleocr import PaddleOCR
from transformers import  M2M100Tokenizer, pipeline 
import numpy as np
from scipy.io.wavfile import write
from faster_whisper import WhisperModel
from gtts import gTTS
from pydub import AudioSegment
import soundfile as sf
from docx import Document

"""
--------------------------------------------------------------------
This section contains all the languages and their encoding
--------------------------------------------------------------------
"""
#Reads the ocrSupportedModel
with open("./ocrSupport.json", "r", encoding="utf-8") as f:
    ocrSupported = json.load(f)
#Reads the tesSupported
with open("./tesSupport.json", "r", encoding="utf-8") as f:
    tesSupported = json.load(f)
    
#Languages supported by paddleocr6
ocr6Supported = {
    "zh", "ja", "en", "ko",

    # Latin
    "af", "az", "bs", "ca", "cs", "cy", "da", "de",
    "es", "et", "fi", "fr", "ga", "gl", "hr", "hu",
    "id", "is", "it", "lb", "lt", "lv", "ms", "nl",
    "no", "oc", "pl", "pt", "ro", "sk", "sl", "sq",
    "sv", "sw", "tl", "tr", "uz", "vi",

    # Cyrillic
    "ba", "be", "bg", "kk", "mk", "mn", "ru", "uk",

    # Arabic
    "ar", "fa", "ps", "sd", "ur", "ug", "ku",

    # Devanagari
    "hi", "mr", "ne",

    # Other scripts
    "el", "th", "ta", "te"
}

#Vision Models
ocr_supported_models = {}
for language, model in ocrSupported.items():
    if model not in ocr_supported_models:
        ocr_supported_models[model] = PaddleOCR(device="cpu", text_detection_model_name="PP-OCRv5_server_det", text_recognition_model_name=model, cpu_threads=16, enable_mkldnn=False)

#Vision Model for tesserect
tes_supported_models = {}
for language, lan in tesSupported.items():
    if lan not in tes_supported_models:
        tes_supported_models[lan] = tesserocr.PyTessBaseAPI(lang=lan, path="./tessdata")

"""
--------------------------------------------------------------------
This section contains all the ai models and API that are used
* PaddleOCR
* Whisper
* m2m100_1.2
* m2m100_418M
* Qwen
* API
--------------------------------------------------------------------
"""

#A more conherent model for different languages
ocr6_model = PaddleOCR(device="cpu", text_detection_model_name="PP-OCRv6_small_det", text_recognition_model_name="PP-OCRv6_small_rec", cpu_threads=16, enable_mkldnn=False)
#Audio Model
audio_model = WhisperModel("small", device="cpu", compute_type="int8")
#Models name
model_scanner_name = "facebook/m2m100_1.2B"
model_subtitle_name = "facebook/m2m100_418M"
#Model for text generation
grammar_model = pipeline("text-generation", "Qwen/Qwen3-2B")
#A tokenizer to split the text into different tokens
tokenizer_scanner = M2M100Tokenizer.from_pretrained(model_scanner_name)
tokenizer_subtitle = M2M100Tokenizer.from_pretrained(model_subtitle_name)

#Translator for loading the M2M100 Model
model_translator = ctranslate2.Translator("./m2m100_418", device="cpu", compute_type="int8")
#The model with the pretrained data
model_scanner = ctranslate2.Translator("./m2m100-1.2b-ct2", device="cpu", compute_type="int8")
#API to connect from the API
app = FastAPI()


"""
--------------------------------------------------------------------
This section is all of the ai models translating the language and getting
the encodings
--------------------------------------------------------------------
"""
#Reads the translated json
def lang():
    with open("./translated.json", "r", encoding="utf-8") as file:
        j = json.load(file)
    return j

#Translates the data
def translatesInfo(results):
    text_results = []
    #Finds the min score
    for r in results:
        #We have both the texts and scores
        texts = r["rec_texts"]
        scores = r["rec_scores"]
        
        #Loops both the text and the scores together
        for text, score in zip(texts, scores):
            #Checks if the score of probaility is greater than 0.80
            if(score >= 0.80):
                #Appends it to an list
                text_results.append(text)
    #A sentence loops around
    sentence = " ".join(text_results)
    #Returns the sentence
    return sentence
    
def fix_grammar(text, target_language):
    prompt = prompt = [
        {
            "role": "system",
            "content": f"""You are a professional translator.

            Translate the user's text into {target_language}.

            Rules:
            - Output only the translation in {target_language}.
            - Do not output English unless English is the target language.
            - Preserve the original meaning, tone, names, numbers, and formatting.
            - Make the translation natural and grammatically correct.
            - Do not explain your reasoning.
            - Do not use <think> tags.
            - Return only the translated text."""
        },
        {
            "role": "user",
            "content": text
        }
    ]
    grammar_language = grammar_model(prompt, 
                                     max_new_tokens=128,  
                                    do_sample=False)
    #Generated language
    generated_language = grammar_language[0]["generated_text"]
    
    #Checks if it is a instance of a list
    if isinstance(generated_language, list):
        final_langauge = generated_language[-1]["content"]
    else:
        final_langauge = generated_language
    #Returns the language itself
    return final_langauge.strip()

#Checks what should be translated
def getPredictedLanguage(lan, img, isFast=True):
    #Checks if we want a medium or strong consise look
    if not isFast:
        #Checks if the language is supported by ocr6
        if lan in ocr6Supported:
            return ocr6(img)
    if lan in ocrSupported:
        return ocrMobile(lan, img)
    else:
        return tesser(lan, img)
     
#Checks for oc6 support
def ocr6(img):
    resultImg = ocr6_model.predict(img)
    text = translatesInfo(resultImg)
    return text

#Predict for ocrMobile
def ocrMobile(lan, img):
    model_name = ocrSupported[lan]
    ocr_model = ocr_supported_models[model_name]
    resultsImg = ocr_model.predict(img)
    text = translatesInfo(resultsImg)
    return text

#Predicts for teserect
def tesser(lan, img):
    model_name = tesSupported[lan]
    ocr_model = tes_supported_models[model_name]
    pil_image = Image.fromarray(img)
    ocr_model.SetImage(pil_image)
    text = ocr_model.GetUTF8Text()
    return text


#Translator to describe the langauge
def translationAI(text, source, target, tokenizer, model, beam_size, repetition_penalty):
    #Sets the source
    tokenizer.src_lang = source
    ##Convert the sentence into tokens
    #1) With tokenizer.encode() to ids
    #2) Turns those ids into tokens that CTranslate2 expects
    source_tokens = tokenizer.convert_ids_to_tokens(tokenizer.encode(text))
    #Tells the M2M100 model what language to decode
    target_prefix = [tokenizer.lang_code_to_token[target]]
    #Does the translation with the source tokens, target language, and to use fast greedy decoding
    results = model.translate_batch([source_tokens], target_prefix=[target_prefix], beam_size=beam_size, repetition_penalty=repetition_penalty)
    #Gets the tokens
    output_tokens = results[0].hypotheses[0][1:]
    #Convert the tokens back to an id
    output_ids = tokenizer.convert_tokens_to_ids(output_tokens)
    #Decodes the ids
    return tokenizer.decode(output_ids, skip_special_tokens=True)


#Translation options
def translation_results(text, setting, lang_1, lang_2, lan2):
    #Checks if the length of the text is greater than 0
    if len(text) > 0:
        #Settings option
        match(setting):
            #Fast settings
            case "Fast":
                return translationAI(text, lang_1, lang_2, tokenizer_subtitle, model_translator, 4, 1)
            #Consice settings
            case "Concise":
                return translationAI(text, lang_1, lang_2, tokenizer_scanner, model_scanner, 4, 1)
            #Deep settings
            case "Deep":
                new_translation = translationAI(text, lang_1, lang_2, tokenizer_scanner, model_scanner, 4, 1)
                return fix_grammar(new_translation, lan2)
    
"""
--------------------------------------------------------------------
This section is decoding the documents into text, and then 
translating the text
--------------------------------------------------------------------
"""
#Translated pdf
def translate_pdf(pdf, lang_1, lang_2):
     #For each page in the pdf
        for page in pdf:
            replacements = []
            #Blocks
            blocks = page.get_text("dict")["blocks"]
            for block in blocks:
                if "lines" not in block:
                    continue
                #Line
                for line in block["lines"]:
                    #Span
                    spans = line["spans"]
                    if not spans:
                        continue
                    #Checks for the original
                    original = "".join(s["text"] for s in spans)
                    
                    #Checks if there is not a original strip
                    if not original.strip():
                        continue
                    
                    #Translates the text
                    translated = translationAI(original, lang_1, lang_2, tokenizer_scanner, model_scanner, 8, 1.1)
                    #Rectangle
                    rect = fitz.Rect(line["bbox"])
                    #font size
                    font_size = spans[0]["size"]
                    #Color
                    color_value = spans[0]["color"]
                    if isinstance(color_value, tuple):
                        rgb = tuple(value / 255 if value > 1 else value for value in color_value)
                    else:
                        rgb = (
                            ((color_value >> 16) & 255) / 255,
                            ((color_value >> 8) & 255) / 255,
                            (color_value & 255) / 255
                        )
                                
                    replacements.append({
                        "rect": rect,
                        "text": translated,
                        "size": font_size,
                        "color": rgb
                    })
                    
            #Remove the original text
            for item in replacements:
                page.add_redact_annot(
                    item["rect"],
                    fill=False,
                    cross_out=False
                )
                
            #Replacements
            if replacements:
                page.apply_redactions(
                    images=0,
                    graphics=0,
                    text=0
                )
            #Insert translated text
            for item in replacements:
                rect = item["rect"]
                
                #Allow extra vertical space
                target = fitz.Rect(
                    rect.x0,
                    rect.y0,
                    rect.x1,
                    rect.y1 + 45
                )
                
                #Results insert
                result = page.insert_textbox(
                    target,
                    item["text"],
                    fontsize=item["size"],
                    fontname="helv",
                    color=item["color"]
                )
    
                if result < 0:
                    print("Text did not fit:", item["text"])
                    
        #Saves the doc as an output stream
        output_stream = BytesIO()
        pdf.save(output_stream)
        output_stream.seek(0)
        
        return output_stream
    

async def setImage(image : UploadFile = File(...)):
    #Reads uploaded image bytes
    image_bytes = await image.read()
    #Converts the bytes into a num array
    np_buffer = np.frombuffer(image_bytes, np.uint8)
    #Decode into an actual image
    img = cv2.imdecode(np_buffer, cv2.IMREAD_COLOR)
    return img

#array_to_wav_and_text
def array_to_wav_and_text(audio_array, lan, sample_rate=16000):
    #Converts the input into a NumPy Array
    audio_array = np.asarray(audio_array)
    
    #Convert the int16 audio to a float audio
    if audio_array.dtype == np.int16:
        audio_array = audio_array.astype(np.float32) / 32768
    
    #Make sure it is float32
    audio_array = audio_array.astype(np.float32)

    #Transcribe
    segments, info = audio_model.transcribe(audio_array, language=lan, task="transcribe")
    
    #Combine the text
    text = " ".join(segment.text for segment in segments).strip()
    
    return text

#From text to audio
def text_to_audio_stream(text, lang):
    #Convert text to mp3 in memory
    mp3_buffer = BytesIO()
    
    gTTS(text=text, lang=lang).write_to_fp(mp3_buffer)
    mp3_buffer.seek(0)
    
    #Read the audio
    audio = AudioSegment.from_file(mp3_buffer, format="mp3")
    
    #Convert to mono 16 khz 16-but
    audio = audio.set_channels(1)
    audio = audio.set_frame_rate(16000)
    audio = audio.set_channels(2)
    
    # Convert to stream
    wav_stream = BytesIO()
    audio.export(wav_stream, format="wav")
    wav_stream.seek(0)
    
    return wav_stream
    
"""
--------------------------------------------------------------------
This section is where the translation and conversion is worked on
--------------------------------------------------------------------
"""
@app.post("/pdfTranslation")
async def pdfTranslation(file_data: UploadFile = File(...), lan1 : str = Form(...), lan2 : str = Form(...)):
    #Json
    user_lan = lang() 
    #Language 1
    lang_1 = user_lan[lan1]
    #Language 2
    lang_2 = user_lan[lan2]
    #Bytes
    pdf_bytes = await file_data.read()
    #Gets the fitz
    pdf = fitz.open(stream=pdf_bytes, filetype="pdf")
    
    output_stream = translate_pdf(pdf, lang_1, lang_2)
    
    #Returns the pdf back to the api
    return StreamingResponse(
        output_stream,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=translated.pdf"
        }
    )
                    
@app.post("/docxTranslation")
async def docxTranslation(file_data: UploadFile = File(...), lan1 : str = Form(...), lan2 : str = Form(...)):
    #Json
    user_lan = lang() 
    #Language 1
    lang_1 = user_lan[lan1]
    #Language 2
    lang_2 = user_lan[lan2]
    #Bytes
    file_bytes = await file_data.read()
    #Transforms 
    doc_stream = BytesIO(file_bytes)
    #File
    doc = Document(doc_stream)
    
    #Edits the paragraph with the translated version
    for paragraph in doc.paragraphs:
        paragraph.text = translationAI(paragraph.text, lang_1, lang_2, tokenizer_scanner, model_scanner, 8, 1.1)
        
    #Saves the doc as an output stream
    output_stream = BytesIO()
    doc.save(output_stream)
    output_stream.seek(0)
    
    #Returns the doc back to the api
    return StreamingResponse(
        output_stream,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": "attachment; filename=translated.docx"
        }
    )

@app.post("/imgTranslation")
async def imgTranslation(file_data : UploadFile = Form(...), lan1 : str = Form(...), lan2 : str = Form(...), type_of_image : str = Form(...)):
    #Json
    user_lan = lang() 
    #Language 1
    lang_1 = user_lan[lan1]
    #Language 2
    lang_2 = user_lan[lan2]
    
    #Sets the image
    img = await setImage(file_data)
    
    #The results predict the image to find out what it is saying
    text = getPredictedLanguage(lang_1, img, False)
    
    #Results
    results = translation_results(text, "Concise", lang_1, lang_2, lan2)
  
    #Translation
    if type_of_image == "png":
        results = "PNG: " + str(results)
    else:
        results = "JPG: " + str(results)
    #Test code
    return {"language_scanned": text, "results": results}

@app.post("/wavTranslation")
async def wavTranslation(file_data : UploadFile = Form(...), lan1 : str = Form(...), lan2 : str = Form(...)):
     #Json
    user_lan = lang() 
    #Language 1
    lang_1 = user_lan[lan1]
    #Language 2
    lang_2 = user_lan[lan2]
    #Reads the bytes
    file_bytes = await file_data.read()
    #Transforms 
    audio_array, sample_rate = sf.read(BytesIO(file_bytes), dtype="float32")
    #Audio wav file to text
    text = array_to_wav_and_text(audio_array, lang_1)
    
    #Translated
    translated_text = translationAI(text, lang_1, lang_2, tokenizer_scanner, model_scanner, 8, 1.1)

    #Wav stream
    wav_stream = text_to_audio_stream(translated_text, lang_2)
    
    return StreamingResponse(wav_stream, media_type="audio/wav", headers={
        "Content-Disposition": "inline; filename=translated.wav"
    })
@app.post("/getTextResult")
async def getTextResult(text : str = Form(...), lan1 : str = Form(...), lan2 : str = Form(...)):
    #Json
    user_lan = lang() 
    #Language 1
    lang_1 = user_lan[lan1]
    #Language 2
    lang_2 = user_lan[lan2]
    #Results from translation
    results = translationAI(text, lang_1, lang_2, tokenizer_subtitle, model_translator, 8, 1.1)
    #Returns the translation
    return {"results": results}

@app.post("/scannerTranslation")
async def scannerTranslation(image: UploadFile = File(...), lan1: str = Form(...), lan2: str = Form(...), quality: str = Form(...), grammar: str = Form(...)):
    #First, we set the transition function
    want_grammar = True if grammar == "true" else False
    #Json
    user_lan = lang() 
    #Language 1
    lang_1 = user_lan[lan1]
    #Language 2
    lang_2 = user_lan[lan2]
    
    #Sets the image
    img = await setImage(image)
    
    #The results predict the image to find out what it is saying
    text = getPredictedLanguage(lang_1, img, False)
    
    #Checks if the grammar needs to be made before the translation
    if want_grammar:
        text = fix_grammar(text, lang_1)
        print(text)
    #Results
    results = translation_results(text, quality, lang_1, lang_2, lan2)
    
    #Test code
    return {"language_scanned": text, "results": results}