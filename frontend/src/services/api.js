import axios from "axios";

export const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://attendance-system.codingity.workers.dev",
});