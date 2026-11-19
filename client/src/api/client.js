// One Axios instance for every call to the Express backend.
// withCredentials sends the session cookie so the server knows who is signed in.
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  withCredentials: true,
  timeout: 10000,
});

// Pulls the server's { error } message out of a failed request
export function errorMessage(err) {
  return err.response?.data?.error || "Couldn't reach the server. Is the backend running on port 8000?";
}

export default api;
