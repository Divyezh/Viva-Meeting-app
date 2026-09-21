import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://viva-meeting-app.onrender.com";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - attach Clerk JWT
api.interceptors.request.use(async (config) => {
  try {
    const clerkGlobal = (
      window as unknown as {
        Clerk?: {
          session?: {
            getToken: () => Promise<string | null>;
          };
        };
      }
    ).Clerk;
    const token = await clerkGlobal?.session?.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.error("Failed to get auth token:", err);
  }
  return config;
});

export default api;
