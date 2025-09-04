# app/routes.py
from fastapi import APIRouter, UploadFile, Form
from fastapi.responses import JSONResponse
import shutil, os
from app.utils import extract_text_from_pdf, analyze_resume_with_ai

router = APIRouter()

@router.post("/analyze_resume")
async def analyze_resume(file: UploadFile, job_desc: str = Form(...)):
    try:
        # Save file temporarily
        file_path = f"temp_{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Extract resume text
        resume_text = extract_text_from_pdf(file_path)

        # Call OpenAI
        analysis = analyze_resume_with_ai(resume_text, job_desc)

        # Cleanup
        os.remove(file_path)

        return {"analysis": analysis}

    except Exception as e:
        import traceback
        print("❌ ERROR in analyze_resume:", str(e))
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )
