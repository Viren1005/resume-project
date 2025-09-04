import { useState, useRef, useEffect } from "react";
import api from "@/lib/api";

export default function ResumeAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDesc, setJobDesc] = useState("");
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      alert("Please upload a PDF file");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
    } else {
      alert("Please drop a PDF file");
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!file) {
      alert("Please upload a PDF resume");
      setIsLoading(false);
      return;
    }

    if (!jobDesc.trim()) {
      alert("Please enter a job description");
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("job_desc", jobDesc);

    try {
      const res = await api.post("/analyze_resume", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);

      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 200);
    } catch (err) {
      console.error(err);
      setResult({ error: true, message: "❌ Error analyzing resume. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  // Animations fade-in
  useEffect(() => {
    if (result && !result.error) {
      const timer = setTimeout(() => {
        const elements = document.querySelectorAll(".fade-in");
        elements.forEach((el) => el.classList.add("opacity-100"));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [result]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-start py-10 px-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl shadow-lg w-full max-w-5xl p-10 text-center mb-10">
        <h1 className="text-4xl font-bold text-white mb-3">Job Match Analyzer</h1>
        <p className="text-white/90 text-lg max-w-2xl mx-auto">
          Upload your resume and compare it against any job description to get an instant compatibility score
        </p>
      </div>

      {/* Upload + Job Description */}
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-5xl">
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
          {/* Upload Resume */}
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-3">Upload Resume</label>
            {!file ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-indigo-400 transition cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
                <label htmlFor="file-upload" className="cursor-pointer text-indigo-600 font-medium">
                  Click to upload or drag file
                </label>
                <p className="text-sm text-gray-500 mt-2">PDF up to 10MB</p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-400 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                <svg
                  className="h-10 w-10 text-green-500 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-700 font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <button
                  type="button"
                  onClick={removeFile}
                  className="mt-3 text-red-500 text-sm hover:underline"
                >
                  Remove File
                </button>
              </div>
            )}
          </div>

          {/* Job Description */}
          <div>
            <label htmlFor="job-desc" className="block text-lg font-semibold text-gray-800 mb-3">
              Job Description
            </label>
            <textarea
              id="job-desc"
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              placeholder="Paste the job description here..."
              className="w-full border-2 border-purple-400 rounded-xl p-4 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition min-h-[160px]"
            />
            <div className="text-right text-xs text-gray-500 mt-2">{jobDesc.length} characters</div>
          </div>

          {/* Submit */}
          <div className="md:col-span-2 flex justify-center">
            <button
              type="submit"
              disabled={isLoading}
              className={`px-10 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 shadow-lg transition transform hover:scale-105 ${
                isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Analyzing..." : "Analyze Match"}
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      {result && !result.error && (
        <div ref={resultsRef} className="mt-12 w-full max-w-5xl fade-in opacity-0 transition-opacity duration-1000">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Analysis Results</h2>

          {/* Match Score */}
          <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center mb-8">
            <p className="text-lg font-semibold text-gray-700 mb-2">Match Percentage</p>
            <div className="relative w-32 h-32">
              <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 36 36">
                <path
                  className="text-gray-200"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  d="M18 2.0845a15.9155 15.9155 0 1 1 0 31.831"
                />
                <path
                  className="text-green-500"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${result.match_percentage}, 100`}
                  d="M18 2.0845a15.9155 15.9155 0 1 1 0 31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-gray-800">
                {result.match_percentage}%
              </div>
            </div>
            <p className="text-gray-600 mt-3">
              Your resume matches {result.match_percentage}% of the job requirements
            </p>
          </div>

          {/* Strengths */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-green-700 mb-4">✅ Strengths</h3>
            <ul className="space-y-2">
              {result.strengths?.map((s: string, i: number) => (
                <li key={i} className="bg-green-100 rounded-lg px-4 py-2 text-green-800 shadow-sm">
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Areas for Improvement */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-yellow-700 mb-4">⚠️ Areas for Improvement</h3>
            <ul className="space-y-2">
              {result.weaknesses?.map((w: string, i: number) => (
                <li key={i} className="bg-yellow-100 rounded-lg px-4 py-2 text-yellow-800 shadow-sm">
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="mt-10 text-gray-500 text-sm text-center">
        Your data is processed securely and never stored on our servers.
      </p>
    </div>
  );
}
