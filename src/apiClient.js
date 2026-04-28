import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://evmbackend-n3qk.onrender.com",
  headers: {
    "Content-Type": "application/json"
  }
});

export default apiClient;