import fitz  # PyMuPDF

pdf_path = "C:\\Users\\viren\\Downloads\\Unit-4.pdf"

with fitz.open(pdf_path) as pdf:
    full_text = ""
    for i, page in enumerate(pdf):
        page_text = page.get_text()
        print(f"Page {i+1} length: {len(page_text)}")  # Check if text exists
        full_text += page_text

print("Total text length:", len(full_text))
print("Preview (first 500 chars):\n", full_text[:500])
