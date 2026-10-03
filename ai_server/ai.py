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
from transformers import AutoTokenizer, M2M100Tokenizer

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
ocr6_model = PaddleOCR(device="cpu", text_detection_model_name="PP-OCRv6_medium_det", text_recognition_model_name="PP-OCRv6_medium_rec", cpu_threads=16, enable_mkldnn=False)

#API to connect from the API
app = FastAPI()
#Models name
model_deep_name = "facebook/m2m100_1.2B"
model_scanner_name = "facebook/m2m100_1.2B"
model_subtitle_name = "facebook/m2m100_418M"

#A tokenizer to split the text into different tokens
tokenizer_deep = AutoTokenizer.from_pretrained(model_deep_name)
tokenizer_scanner = M2M100Tokenizer.from_pretrained(model_scanner_name)
tokenizer_subtitle = M2M100Tokenizer.from_pretrained(model_subtitle_name)

#The model with the pretrained data
model_scanner = ctranslate2.Translator("./m2m100-1.2b-ct2", device="cpu", compute_type="int8")
#Translator for loading the M2M100 Model
model_translator = ctranslate2.Translator("./m2m100_418", device="cpu", compute_type="int8")

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
    return tokenizer.decode(output_ids, skip_special_token=True)


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
                return translationAI(text, lang_1, lang_2, tokenizer_subtitle, model_translator, 4)
            #Consice settings
            case "concise":
                return translationAI(text, lang_1, lang_2, tokenizer_scanner, model_translator, 4)
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
    
@app.post("/determine")
async def determine(image: UploadFile = File(...), lan1: str = Form(...), lan2: str = Form(...), quality: str = Form(...)):
    print("Starting...")
    print(quality)
    startTime = time.perf_counter()
    #Json
    user_lan = lang() 
    #Language 1
    lang_1 = user_lan[lan1]
    #Language 2
    lang_2 = user_lan[lan2]
    #Reads uploaded image bytes
    image_bytes = await image.read()
    #Converts the bytes into a num array
    np_buffer = np.frombuffer(image_bytes, np.uint8)
    #Decode into an actual image
    img = cv2.imdecode(np_buffer, cv2.IMREAD_COLOR)
    #The results predict the image to find out what it is saying
    text = getPredictedLanguage(lang_1, img, False)
    
    #Returns the results
    results = translation_results(text, quality, lang_1, lang_2)
    print("THE RESULTS: ", results)
    #How long it recorded
    end_time = time.perf_counter()
    
    return {"language_scanned": text, "results": results}