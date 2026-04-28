import axios from "axios";
import { API_URL } from "./api";

// apiClient uses the backend API base (including /api)
const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
