from fastapi import FastAPI, UploadFile, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
import shutil
import os
import asyncio
import traceback  # This module is key to catching the error report

# --- THIS IS THE FINAL FIX ---
# The import path is now absolute from the project root, which is how Render runs the code.
from api.app.utils import extract_text_from_pdf, analyze_resume_with_ai
# --- END OF FINAL FIX ---

# Initialize the FastAPI application
app = FastAPI(title="AI Resume Analyzer")

# Standard CORS configuration to allow your frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Use the temporary directory that is writable on cloud platforms like Render
UPLOAD_DIR = "/tmp"

@app.get("/")
async def root():
    """A simple route to confirm the server is running."""
    return {"message": "Backend is running and accessible!"}


@app.post("/analyze_resume")
async def analyze_resume(file: UploadFile, job_desc: str = Form(...)):
    """
    This is the main analysis endpoint with full error catching.
    """
    try:
        # --- Main Logic ---
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

        file_path = os.path.join(UPLOAD_DIR, file.filename)

        try:
            # Save the uploaded PDF to the temporary directory
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            # Run the synchronous file-processing functions in a separate thread
            # to avoid blocking the server's main event loop.
            resume_text = await asyncio.to_thread(extract_text_from_pdf, file_path)
            result = await asyncio.to_thread(analyze_resume_with_ai, resume_text, job_desc)

            # Check if your `utils.py` file caught an error and returned it
            if isinstance(result, dict) and "error" in result:
                 return JSONResponse(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    content={"detail": "The AI model or utility function returned an error.", "ai_error": result}
                )

            # If everything is successful, return the final analysis
            return result

        finally:
            # This 'finally' block ensures the temporary file is always deleted,
            # even if an error occurs.
            if os.path.exists(file_path):
                os.remove(file_path)

    except Exception as e:
        # If ANY unhandled error happens, this will catch it and send a detailed report.
        error_traceback = traceback.format_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error_message": f"A critical unhandled server error occurred: {str(e)}",
                "traceback": error_traceback
            }
        )