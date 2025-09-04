# FILE: api/index.py

from fastapi import FastAPI, UploadFile, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool
import shutil
import os
import asyncio
import traceback # <-- Import traceback to get detailed errors

# --- THIS IS THE CRITICAL PART ---
# We will try to import your AI utility function. If it fails (e.g., due to a
# missing API key in the environment), we will catch the error.
try:
    from app.utils import extract_text_from_pdf, analyze_resume_with_ai
    AI_FUNCTION_AVAILABLE = True
except Exception as e:
    # If the import fails, we store the error and disable the AI function.
    AI_FUNCTION_AVAILABLE = False
    IMPORT_ERROR_TRACEBACK = traceback.format_exc()
# --- END OF CRITICAL PART ---


# FastAPI app
app = FastAPI(title="AI Resume Analyzer")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "/tmp"

@app.get("/")
async def root():
    return {"message": "Backend is running!"}


@app.post("/api/analyze_resume")
async def analyze_resume(file: UploadFile, job_desc: str = Form(...)):
    # --- NEW ERROR CHECKING ---
    # If the AI function failed to load, return a detailed error immediately.
    if not AI_FUNCTION_AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "AI function failed to load on the server.",
                "reason": "This is likely due to a missing environment variable (e.g., API_KEY).",
                "traceback": IMPORT_ERROR_TRACEBACK
            }
        )
    # --- END OF NEW ERROR CHECKING ---

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    try:
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        
        resume_text = await run_in_threadpool(extract_text_from_pdf, file_path)
        
        try:
            result = await asyncio.wait_for(
                run_in_threadpool(analyze_resume_with_ai, resume_text, job_desc),
                timeout=30
            )
        except asyncio.TimeoutError:
            raise HTTPException(status_code=408, detail="AI analysis timed out.")

    except Exception as e:
        # Catch any other unexpected errors during processing
        raise HTTPException(
            status_code=500,
            detail={"error": "An unexpected error occurred during analysis.", "details": str(e)}
        )
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

    return result