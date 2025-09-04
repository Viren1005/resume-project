import axios from "axios";

const api = axios.create({
  baseURL: "/api", // Vercel will proxy this to Render
});

export default api;
