from io import BytesIO

from PIL import Image
import cv2
import numpy as np
import json
import ctranslate2
import time
import tesserocr
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from paddleocr import PaddleOCR, PaddleOCRVL
from transformers import AutoTokenizer, M2M100Tokenizer, pipeline

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

#A more conherent model for different languages
ocr6_model = PaddleOCR(device="cpu", text_detection_model_name="PP-OCRv6_small_det", text_recognition_model_name="PP-OCRv6_small_rec", cpu_threads=16, enable_mkldnn=False)

#API to connect from the API
app = FastAPI()
#Models name
model_deep_name =  "google/madlad400-3b-mt"
model_scanner_name = "facebook/m2m100_1.2B"
model_subtitle_name = "facebook/m2m100_418M"


#A tokenizer to split the text into different tokens
tokenizer_deep = AutoTokenizer.from_pretrained(model_deep_name)
tokenizer_scanner = M2M100Tokenizer.from_pretrained(model_scanner_name)
tokenizer_subtitle = M2M100Tokenizer.from_pretrained(model_subtitle_name)
language_model = pipeline("text-generation","Qwen/Qwen3-0.6B")


#Translator for loading the M2M100 Model
model_translator = ctranslate2.Translator("./m2m100_418", device="cpu", compute_type="int8")
#The model with the pretrained data
model_scanner = ctranslate2.Translator("./m2m100-1.2b-ct2", device="cpu", compute_type="int8")
#Deep Model
model_deep = ctranslate2.Translator(".//madlad400-3b-ct2-int8", device="cpu", compute_type="int8")

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
def translationAI(text, source, target, tokenizer, model, beam_size):
    #Sets the source
    tokenizer.src_lang = source
    ##Convert the sentence into tokens
    #1) With tokenizer.encode() to ids
    #2) Turns those ids into tokens that CTranslate2 expects
    source_tokens = tokenizer.convert_ids_to_tokens(tokenizer.encode(text))
    #Tells the M2M100 model what language to decode
    target_prefix = [tokenizer.lang_code_to_token[target]]
    #Does the translation with the source tokens, target language, and to use fast greedy decoding
    results = model.translate_batch([source_tokens], target_prefix=[target_prefix], beam_size=beam_size)
    #Gets the tokens
    output_tokens = results[0].hypotheses[0][1:]
    #Convert the tokens back to an id
    output_ids = tokenizer.convert_tokens_to_ids(output_tokens)
    #Decodes the ids
    return tokenizer.decode(output_ids, skip_special_tokens=True)

#Translates Google madlab model
def deep_translationAI(text, target, tokenizer, model, beam_size):
    #Our target token
    target_token = f"<2{target}>"
    
    #Source ids
    source_ids = tokenizer.encode(text, add_special_tokens=False)
    #Convert the text into tokens
    source_tokens = tokenizer.convert_ids_to_tokens(source_ids)
    
    #Insert the target token before the input text
    source_tokens.insert(0, target_token)
    
    #Translate
    results = model.translate_batch([source_tokens], 
                                    beam_size=beam_size, 
                                    max_decoding_length=256,
                                    repetition_penalty=1.1,
                                    no_repeat_ngram_size=3)

    #Output tokens
    output_tokens = results[0].hypotheses[0]
    
    #Output ids
    output_ids = tokenizer.convert_tokens_to_ids(output_tokens)
    
    #Returns the decode version
    return tokenizer.decode(output_ids, skip_special_tokens=True)


#Translation options
def translation_results(text, setting, lang_1, lang_2):
    #Checks if the length of the text is greater than 0
    if len(text) > 0:
        print("This text is larger than 0")
        print(setting)
        #Settings option
        match(setting):
            #Fast settings
            case "fast":
                return translationAI(text, lang_1, lang_2, tokenizer_subtitle, model_translator, 2)
            #Consice settings
            case "concise":
                return translationAI(text, lang_1, lang_2, tokenizer_scanner, model_scanner, 4)
            #Deep settings
            case "deep":
                return deep_translationAI(text, lang_2, tokenizer_deep, model_deep, 1)
            #Error check
            case "_":
                return "N/A"
    #Returns empty if not found
    return ""
    
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
    print("Word Give: ", sentence)
    #Returns the sentence
    return sentence
    
def fix_language(text):
    prompt = [{"role":"system", 
              "content": f"""You are an OCR correction and cleanup tool.
                            Your task is to clean the OCR text while preserving the original source material.

                            Rules:
                            1. Return only the cleaned text. Do not explain your changes.
                            2. Preserve the original language, meaning, wording, punctuation, names, numbers, and line order.
                            3. Correct only obvious OCR errors, such as:
                            - duplicated words or lines
                            - broken characters
                            - random symbols
                            - incomplete fragments caused by OCR
                            - obvious spacing errors
                            4. Remove text only when it is clearly:
                            - meaningless OCR gibberish
                            - a duplicated OCR segment
                            - an isolated random character or symbol
                            - a watermark, page number, button, filename, or interface text that is not part of the source
                            5. Do not remove unusual words, slang, names, abbreviations, dialects, or sentences merely because they seem unfamiliar.
                            6. Never invent missing words. If uncertain, keep the original text.
                            7. Preserve line breaks and paragraph structure.
                            8. Do not translate, summarize, define, or add commentary.

                            Return only the cleaned source text."""
                },
                {
                    "role":"user",
                    "content": f"""
                    Clean the OCR text below.

                    <ocr_text>
                    {text}
                    </ocr_text>

                    Return only the cleaned source text.
                    """
                }]
    fixed_language = language_model(prompt, 
                                    max_new_tokens=40,  
                                    do_sample=False)
    return fixed_language[0]["generated_text"][-1]["content"]

async def setImage(image : UploadFile = File(...)):
    #Reads uploaded image bytes
    image_bytes = await image.read()
    #Converts the bytes into a num array
    np_buffer = np.frombuffer(image_bytes, np.uint8)
    #Decode into an actual image
    img = cv2.imdecode(np_buffer, cv2.IMREAD_COLOR)
    return img

@app.post("/determine")
async def determine(image: UploadFile = File(...), lan1: str = Form(...), lan2: str = Form(...), quality: str = Form(...)):
    print("Starting...")
    startTime = time.perf_counter()
    #Json
    user_lan = lang() 
    #Language 1
    lang_1 = user_lan[lan1]
    #Language 2
    lang_2 = user_lan[lan2]
    
    #Sets the image
    img = await setImage(image)
    end_time = time.perf_counter()
    print("Setting languages and images: " (end_time - startTime))
    
    startTime2 = time.perf_counter()
    #The results predict the image to find out what it is saying
    text = getPredictedLanguage(lang_1, img, False)
    fixed_text = fix_language(text)
    end_time2 = time.perf_counter()
    print("TEXT: ", (end_time2 - startTime2))
    
    startTime3 = time.perf_counter()
    #Returns the results
    results = translation_results(fixed_text, quality, lang_1, lang_2)
    #How long it recorded
    end_time3 = time.perf_counter()
    print("Translation: ", (end_time3 - startTime3))
    
    #Test code
    #idea = input("This is what it sees: ")
    print("TIME: ", (end_time - startTime))
    return {"language_scanned": text, "results": results}