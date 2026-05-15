from PyPDF2 import PdfReader
import io
from typing import Optional

class PDFParser:
    @staticmethod
    async def extract_text(file_content: bytes) -> Optional[str]:
        try:
            pdf = PdfReader(io.BytesIO(file_content))
            full_text = ""
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    full_text += text + " "
            return full_text.strip() if full_text.strip() else None
        except Exception as e:
            print(f"Ошибка парсинга PDF: {e}")
            return None