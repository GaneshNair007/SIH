import axios from "axios";

// Create an Axios instance pointing to the FastAPI backend
// Ensure NEXT_PUBLIC_API_URL is set in .env.local (e.g., http://localhost:8000/api)
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  withCredentials: true, // Crucial for passing the `rakshak_session` cookie
  headers: {
    "Content-Type": "application/json",
  },
});

// Generic error interceptor (optional)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Client Error:", error?.response?.data || error.message);
    return Promise.reject(error);
  }
);
