# FILE: api/app/utils.py

import fitz  # PyMuPDF
import os
import google.generativeai as genai
import json
import re

# --- THIS IS THE CORRECT WAY TO CONFIGURE THE LIBRARY ---
# It reads the key from the environment. Vercel provides this variable.
# This code will crash if the key is not set in Vercel settings.
try:
    genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
except KeyError:
    # This provides a clear error if the API key is missing on the server
    raise RuntimeError("GOOGLE_API_KEY environment variable not set.")
# --- END OF FIX ---


# This function is correct, no changes needed.
def extract_text_from_pdf(file_path: str) -> str:
    """Extracts text from a PDF file."""
    text = ""
    with fitz.open(file_path) as pdf:
        for page in pdf:
            text += page.get_text()
    return text.strip()


# ✅ This function is completely rewritten to work correctly.
def analyze_resume_with_ai(resume_text: str, job_desc: str) -> dict:
    # --- MODEL INITIALIZATION AND PROMPT ---
    model = genai.GenerativeModel('gemini-1.5-flash-latest')
    prompt = f"""
    You are a career advisor. Compare this resume with the job description.

    Resume:
    {resume_text}

    Job Description:
    {job_desc}

    Return the output STRICTLY in JSON format like this:
    {{
      "match_percentage": 65,
      "strengths": ["Skill 1", "Skill 2"],
      "weaknesses": ["Weakness 1", "Weakness 2"]
    }}
    """
    # --- END OF MODEL INITIALIZATION ---

    try:
        # --- CORRECT API CALL ---
        response = model.generate_content(prompt)
        content = response.text
        # --- END OF CORRECT API CALL ---

        # Extract JSON inside ```json ... ``` if present
        json_match = re.search(r"```json\s*(\{.*?\})\s*```", content, re.DOTALL)
        if json_match:
            content = json_match.group(1)

        # Parse JSON
        return json.loads(content)

    except json.JSONDecodeError:
        # This happens if the AI gives a malformed response
        return {"error": "Failed to parse AI response as JSON.", "raw_response": content}
    except Exception as e:
        # This catches any other errors from the Gemini API call itself
        return {"error": f"An error occurred with the AI model: {str(e)}"}