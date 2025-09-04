from app.utils import analyze_resume_with_ai

resume_text = "Experienced Python and Java developer with SQL knowledge."
job_desc = "Software Engineer with Python and SQL skills."

result = analyze_resume_with_ai(resume_text, job_desc)
print(result)
