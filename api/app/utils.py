import fitz  # PyMuPDF
import os
import google.generativeai as genai
import json
import re

# --- THIS IS THE CORRECT WAY TO CONFIGURE THE LIBRARY ---
# It reads the key from the environment. Render or Vercel provides this variable.
# This code will crash with a clear error if the key is not set.
try:
    genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
except KeyError:
    # This provides a clear error if the API key is missing on the server
    raise RuntimeError("CRITICAL ERROR: GOOGLE_API_KEY environment variable not set on the server.")
# --- END OF CONFIGURATION ---


def extract_text_from_pdf(file_path: str) -> str:
    """Extracts text from a PDF file."""
    text = ""
    with fitz.open(file_path) as pdf:
        for page in pdf:
            text += page.get_text()
    return text.strip()


def analyze_resume_with_ai(resume_text: str, job_desc: str) -> dict:
    """
    Analyzes a resume against a job description using the Gemini AI model.
    """
    # Initialize the correct generative model
    model = genai.GenerativeModel('gemini-1.5-flash-latest')

    # Create the detailed prompt for the AI
    prompt = f"""
    You are an expert career advisor and hiring manager. Your task is to meticulously compare the provided resume with the job description.

    Analyze the following:
    1.  **Resume Text:**
        {resume_text}

    2.  **Job Description:**
        {job_desc}

    Based on your analysis, return your output STRICTLY in the following JSON format, with no additional text or explanations before or after the JSON block:
    {{
      "match_percentage": <A number from 0 to 100 representing the overall match>,
      "strengths": ["A list of key skills, experiences, or qualifications from the resume that directly align with the job description.", "Provide at least two strengths."],
      "weaknesses": ["A list of key requirements from the job description that are missing or not clearly stated in the resume.", "Provide at least two weaknesses or areas for improvement."]
    }}
    """

    try:
        # Generate content using the correct method for the library
        response = model.generate_content(prompt)
        content = response.text

        # Use a robust regex to find the JSON block, even with markdown backticks
        json_match = re.search(r"```json\s*(\{.*?\})\s*```", content, re.DOTALL)
        if json_match:
            # If markdown is found, extract only the JSON part
            json_string = json_match.group(1)
        else:
            # Otherwise, assume the whole response is the JSON string
            json_string = content

        # Parse the extracted JSON string
        return json.loads(json_string)

    except json.JSONDecodeError:
        # This error is critical if the AI doesn't return valid JSON
        return {"error": "Failed to parse the AI's response as valid JSON.", "raw_response": content}
    except Exception as e:
        # This catches any other errors during the API call (e.g., API key invalid, network issues)
        return {"error": f"An unexpected error occurred with the AI model: {str(e)}"}
