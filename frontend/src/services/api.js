import axios from "axios";

export const API = axios.create({
  baseURL: "https://attendance-system.codingity.workers.dev",
});