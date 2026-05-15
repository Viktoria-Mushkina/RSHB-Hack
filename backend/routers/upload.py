from fastapi import APIRouter, File, HTTPException, UploadFile

from services.upload_service import process_pdf_upload

router = APIRouter(tags=["upload"])

@router.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename or not file.filename.endswith(".pdf"):
        raise HTTPException(400, "Нужен PDF файл")

    try:
        contents = await file.read()
        return await process_pdf_upload(contents, file.filename)
    except Exception as e:
        raise HTTPException(500, f"Ошибка: {str(e)}") from e
