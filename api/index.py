# FILE: api/index.py

from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool
import shutil
import os
import asyncio

# Import your utils
from app.utils import extract_text_from_pdf, analyze_resume_with_ai

# FastAPI app
app = FastAPI(title="AI Resume Analyzer")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- THIS IS THE FIX ---
# Use the Vercel-writable temporary directory instead of a local 'uploads' folder.
UPLOAD_DIR = "/tmp" 
# --- END OF FIX ---

# ✅ Root route for testing frontend connection
@app.get("/")
async def root():
    return {"message": "Hello World from FastAPI 🚀 - Backend is running!"}

# ✅ Resume analysis route
@app.post("/analyze_resume")
async def analyze_resume(file: UploadFile, job_desc: str = Form(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    try:
        # Save PDF temporarily
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        # Extract text in background thread
        resume_text = await run_in_threadpool(extract_text_from_pdf, file_path)

        # Call AI analysis with timeout
        try:
            result = await asyncio.wait_for(
                run_in_threadpool(analyze_resume_with_ai, resume_text, job_desc),
                timeout=30  # 30s max wait
            )
        except asyncio.TimeoutError:
            return {
                "error": "AI analysis took too long. Please try a smaller resume or try again later."
            }

    finally:
        # Always delete uploaded PDF after processing
        if os.path.exists(file_path):
            os.remove(file_path)

    return result