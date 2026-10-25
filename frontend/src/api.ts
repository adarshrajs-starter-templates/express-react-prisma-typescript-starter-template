import axios from "axios";

const configuredUrl = import.meta.env.VITE_API_URL?.trim();
const baseURL = configuredUrl
  ? configuredUrl.replace(/\/+$/, "")
  : "http://localhost:4000/api";

export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("starter_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function apiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? error.message ?? "Request failed";
  }
  return error instanceof Error ? error.message : "Something went wrong";
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  isActive: boolean;
}
export interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface PaginatedTasks {
  data: Task[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}