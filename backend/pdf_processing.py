import fitz
import re
from typing import List
from collections import Counter



# Cleaning 
def clean_text(text: str) -> str:
   
    text = re.sub(r'\[\d+(?:[\-,–]\d+)*(?:,\s*\d+)*\]', '', text)
    text = re.sub(r'^\s*\d+(\.\d+)*\s+', '', text, flags=re.MULTILINE)

    # Remove figure/table captions 
    text = re.sub(
        r'^\s*(Figure|Fig\.?|Table)\s*\d+.*$',
        '',
        text,
        flags=re.IGNORECASE | re.MULTILINE
    )
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^\x20-\x7E]', '', text)

    return text.strip()


def remove_page_numbers(text: str) -> str:
    text = re.sub(r'^\s*\d+\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'Page\s*\d+(\s*of\s*\d+)?', '', text, flags=re.IGNORECASE)
    return text


def remove_headers_footers(pages: List[str]) -> List[str]:
    first_lines = []
    last_lines = []

    for page in pages:
        lines = page.strip().split("\n")
        if len(lines) > 2:
            first_lines.append(lines[0].strip())
            last_lines.append(lines[-1].strip())

    first_line_counts = Counter(first_lines)
    last_line_counts = Counter(last_lines)

    cleaned_pages = []

    for page in pages:
        lines = page.strip().split("\n")

        if len(lines) > 2:
            if first_line_counts[lines[0].strip()] > 1:
                lines = lines[1:]
            if last_line_counts[lines[-1].strip()] > 1:
                lines = lines[:-1]

        cleaned_pages.append("\n".join(lines))

    return cleaned_pages



# PDF Extraction
def extract_text_from_pdf(file) -> str:
    doc = fitz.open(stream=file.read(), filetype="pdf")
    pages = [page.get_text("text") for page in doc]
    doc.close()

    pages = remove_headers_footers(pages)
    combined_text = "\n".join(pages)
    combined_text = remove_page_numbers(combined_text)

    return combined_text

# Remove sentence based chunking 
# Paragraph Builder
def rebuild_paragraphs(text: str) -> List[str]:

    raw_paragraphs = re.split(
        r'\n\s*\n|(?=\n?\d+(?:\.\d+)+\s+)',
        text
    )

    paragraphs = []

    for para in raw_paragraphs:
        if not para:
            continue

        para = clean_text(para.replace("\n", " "))

        if len(para.split()) >= 25:
            paragraphs.append(para)

    return paragraphs

# Paragraph-Based Chunking
def paragraph_based_chunking(
    paragraphs: List[str],
    max_words: int = 180,
    overlap: int = 30
) -> List[str]:

    chunks = []

    for para in paragraphs:
        words = para.split()

        if len(words) <= max_words:
            chunks.append(para)
        else:
            start = 0
            while start < len(words):
                end = start + max_words
                chunk_words = words[start:end]

                if len(chunk_words) < 30:
                    break  

                chunk = " ".join(chunk_words)
                chunks.append(chunk)

                start += max_words - overlap

    return chunks