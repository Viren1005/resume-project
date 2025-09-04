import fitz  # PyMuPDF
import os
from google import genai
from dotenv import load_dotenv
import json
import re

# Load environment variables
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")
print("🔑 Loaded API Key:", API_KEY)

# ✅ Extract text from PDF
def extract_text_from_pdf(file_path: str) -> str:
    """Extracts text from a PDF file."""
    text = ""
    with fitz.open(file_path) as pdf:
        for page in pdf:
            text += page.get_text()
    return text.strip()

# ✅ Analyze resume with AI (Gemini) and return structured JSON


def analyze_resume_with_ai(resume_text: str, job_desc: str) -> dict:
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

    try:
        client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
        response = client.models.generate_content(
            model="gemini-2.0-flash-001",
            contents=prompt
        )

        content = response.text

        # Extract JSON inside ```json ... ``` if present
        json_match = re.search(r"```json\s*(\{.*?\})\s*```", content, re.DOTALL)
        if json_match:
            content = json_match.group(1)

        # Parse JSON
        return json.loads(content)
    except json.JSONDecodeError:
        return {"error": "Failed to parse AI response", "raw": content}
    except Exception as e:
        return {"error": str(e)}
