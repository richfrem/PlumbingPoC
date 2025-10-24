
import os
import re
from PIL import Image, ImageDraw
import pytesseract

# Optional: Use spaCy for names and addresses if available
try:
    import spacy
    nlp = spacy.load("en_core_web_sm")
    SPACY_ENABLED = True
except Exception:
    SPACY_ENABLED = False

# Regex patterns for PII
EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
PHONE_REGEX = re.compile(r"(\+?\d{1,2}[\s-]?)?(\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}")
POSTAL_REGEX = re.compile(r"\b[ABCEGHJ-NPRSTVXYabceghj-nprstvxy]\d[ABCEGHJ-NPRSTV-Zabceghj-nprstv-z][ -]?\d[ABCEGHJ-NPRSTV-Zabceghj-nprstv-z]\d\b")
# Address regex: matches street number, street, city, province/state (simple, not perfect)
ADDRESS_REGEX = re.compile(r"\b\d{1,5}\s+([A-Za-z0-9'.#\-]+\s+){1,5}(Ave|Avenue|St|Street|Rd|Road|Blvd|Boulevard|Dr|Drive|Way|Lane|Ln|Court|Ct|Circle|Cres|Crescent|Pl|Place|Terrace|Terr|Trail|Trl|Parkway|Pkwy|Highway|Hwy|#\d+|Unit|Suite|Apt|Apartment)?[\s,]+[A-Za-z .'-]+,[\s]*[A-Z]{2,3}\b", re.IGNORECASE)
# Add a simple name list for your case
NAME_LIST = ["richard fremmerlid"]

def is_pii(word):
    w = word.lower().strip()
    if EMAIL_REGEX.fullmatch(word):
        return True
    if PHONE_REGEX.fullmatch(word):
        return True
    if POSTAL_REGEX.fullmatch(word):
        return True
    if ADDRESS_REGEX.search(word):
        return True
    for name in NAME_LIST:
        if name in w:
            return True
    return False


def redact_text(img, text, boxes):
    draw = ImageDraw.Draw(img)
    for i, word in enumerate(text):
        if not word.strip():
            continue
        # Redact by regex
        if is_pii(word):
            x, y, w, h = boxes[i]
            draw.rectangle([x, y, x + w, y + h], fill="black")
        # Redact by spaCy NER (names, addresses)
        elif SPACY_ENABLED:
            doc = nlp(word)
            for ent in doc.ents:
                if ent.label_ in ["PERSON", "GPE", "ORG", "LOC"]:
                    x, y, w, h = boxes[i]
                    draw.rectangle([x, y, x + w, y + h], fill="black")
    return img

SCREENSHOTS_DIR = "docs/screenshots/"

def process_image(path):
    img = Image.open(path)
    data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
    words = data['text']
    boxes = list(zip(data['left'], data['top'], data['width'], data['height']))
    img = redact_text(img, words, boxes)
    img.save(path)

for fname in os.listdir(SCREENSHOTS_DIR):
    if fname.lower().endswith(('.png', '.jpg', '.jpeg')):
        in_path = os.path.join(SCREENSHOTS_DIR, fname)
        process_image(in_path)
        print(f"Redacted: {fname}")
print("Redaction complete. docs/screenshots/ images have been overwritten.")
