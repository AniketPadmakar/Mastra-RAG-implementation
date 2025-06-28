# pdf_parser.py

import os
import json
import datetime
from PyPDF2 import PdfReader

PDF_DIR = "../data/letters"
OUTPUT_FILE = "../output/parsed-pdfs.json"

def extract_year_from_filename(filename):
    try:
        year = int(filename.replace(".pdf", ""))
        if 1865 <= year <= datetime.datetime.now().year:
            return year
        else:
            raise ValueError
    except ValueError:
        raise Exception(f"Invalid filename: {filename}. Expected format: YYYY.pdf")

def clean_text(text):
    return ' '.join(text.replace('\n', ' ').split())

def parse_pdf(file_path):
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    
    stat = os.stat(file_path)
    return {
        "text": clean_text(text),
        "metadata": {
            "source": os.path.basename(file_path),
            "year": extract_year_from_filename(os.path.basename(file_path)),
            "pages": len(reader.pages),
            "fileSizeMB": round(stat.st_size / (1024 * 1024), 2),
            "extractedAt": datetime.datetime.now().isoformat()
        }
    }

def main():
    if not os.path.exists(PDF_DIR):
        raise Exception(f"PDF directory not found: {PDF_DIR}")

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    results = []
    for filename in sorted(os.listdir(PDF_DIR)):
        if filename.endswith(".pdf"):
            file_path = os.path.join(PDF_DIR, filename)
            try:
                print(f"✅ Parsing {filename}...")
                parsed = parse_pdf(file_path)
                results.append(parsed)
            except Exception as e:
                print(f"⚠️ Failed to parse {filename}: {e}")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print(f"\n🎉 Parsed {len(results)} files. Output saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
