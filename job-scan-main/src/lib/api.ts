import axios from "axios";

// This line dynamically sets the backend URL.
// On Vercel (production), it will be '/api'.
// On your local machine (development), it will be 'http://localhost:8000'.
const baseURL = import.meta.env.PROD ? "https://resume-project-9w3t-d1ka2mk5h-viru-s-projects.vercel.app/" : "http://localhost:8000";

const api = axios.create({
  baseURL: baseURL,
});

export default api;
