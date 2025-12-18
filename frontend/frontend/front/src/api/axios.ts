import axios from "axios";

const api = axios.create({
  baseURL: "https://teamup-u17c.onrender.com/api/v1/", // Render production API
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && token !== "null") {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// ------------------- REGISTER -------------------
export async function registerUser(data: any) {
  try {
    const payload = {
      email: data.email,
      password: data.password,
      name: data.full_name || "Test User",
      role: data.role === "admin" ? "student" : data.role, // запрещаем админа
      skills: data.skills && data.skills.length ? data.skills : ["JavaScript"], // минимум один скилл
      bio: data.bio || "Hello, I am a participant.", // обязательный bio
    };

    console.log("Отправляемые данные:", payload);

    const response = await api.post("auth/register", payload);

    return response.data;
  } catch (err: any) {
    console.error("REGISTER ERROR:", err.response?.data || err.message);
    throw err;
  }
}

// ------------------- LOGIN -------------------
export async function loginUser(data: { email: string; password: string }) {
  try {
    const response = await api.post("auth/login", data);
    const { access_token, refresh_token, role } = response.data;

    if (access_token) localStorage.setItem("token", access_token);
    if (refresh_token) localStorage.setItem("refreshToken", refresh_token);
    if (role) localStorage.setItem("role", role);

    return response.data;
  } catch (err: any) {
    console.error("LOGIN ERROR:", err.response?.data || err.message);
    throw err;
  }
}

// ------------------- APPLY TO PROJECT -------------------
export const applyToProject = async (projectId: number) => {
  try {
    const response = await api.post("applications", {
      type: "project",
      target_id: projectId,
    });
    return response.data;
  } catch (err: any) {
    console.error("Ошибка при отправке заявки:", err.response?.data || err.message);
    throw err;
  }
};

// ------------------- GET USER PROFILE -------------------
export async function getUserProfile() {
  try {
    const response = await api.get("users/me");
    return response.data;
  } catch (err: any) {
    console.error("Ошибка получения профиля:", err.response?.data || err.message);
    throw err;
  }
}
