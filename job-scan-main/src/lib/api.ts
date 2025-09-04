import axios from "axios";

// Detect environment and set backend URL
const baseURL = import.meta.env.PROD
  ? "https://resume-project-bqrf.onrender.com" // Render backend URL
  : "http://localhost:8000"; // Local FastAPI server

const api = axios.create({
  baseURL: baseURL,
});

export default api;
