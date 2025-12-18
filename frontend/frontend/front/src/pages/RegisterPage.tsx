import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/axios";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      alert("Пожалуйста, заполните все поля!");
      return;
    }

    try {
      const selectedRole = role === "admin" ? "mentor" : role;

      const data = await registerUser({
        full_name: name,
        email,
        password,
        role: selectedRole,
        skills: ["JavaScript"], // минимум один скилл
        bio: "Hello, I am a participant.", // обязательный bio
      });

      console.log("✅ Регистрация успешна:", data);

      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("refreshToken", data.refresh_token || "");
        localStorage.setItem("role", selectedRole);

        navigate("/projects");
      } else {
        alert("Регистрация прошла, но токен не получен.");
      }
    } catch (error: any) {
      console.error(
        "Ошибка регистрации:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.error?.message ||
          "Не удалось зарегистрироваться. Попробуйте позже."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F8FA] p-4 md:p-20">
      <div className="w-full max-w-8xl grid grid-cols-1 lg:grid-cols-[6fr_4fr] gap-10">
        {/* Левая часть */}
        <div className="bg-[#FBFCFC] p-8 md:p-10 flex flex-col gap-6 justify-center border border-2 rounded-3xl border-[#E5E9EF]">
          <div className="flex gap-2 flex-wrap">
            <span className="bg-[#F6F8FA] text-lg md:text-xl px-3 py-1 text-black rounded-xl border-2 border-[#E5E9EF]">
              For students & hackers
            </span>
            <span className="bg-[#C5FCA4] text-lg md:text-xl px-3 py-1 text-black rounded-full">
              Free
            </span>
          </div>
          <h1 className="text-black text-3xl md:text-4xl font-semibold leading-tight">
            Form teams faster. Ship better projects.
          </h1>
          <p className="text-[#6C7280] text-lg md:text-2xl">
            Create projects, match teammates, manage applications, and
            collaborate in a focused workspace.
          </p>
        </div>

        {/* Правая часть */}
        <div className="bg-[#FBFCFC] p-8 md:p-10 flex flex-col justify-center border border-2 border-[#E5E9EF] rounded-3xl text-black">
          <div className="flex flex-col md:flex-row justify-between text-xl md:text-2xl gap-3 mb-4">
            <a href="/register" className="w-full">
              <button className="cursor-pointer bg-blue-100 text-[#2663EB] hover:bg-blue-200 transition duration-200 p-3 rounded-2xl flex items-center w-full gap-2 justify-center">
                <img src="/src/assets/sign-in2.png" className="w-4 mt-1" />
                Sign in
              </button>
            </a>

            <a href="/" className="w-full">
              <button className="cursor-pointer border-2 bg-[#F1F5F9] hover:bg-gray-200 transition duration-200 border-[#E5E9EF] text-black p-3 rounded-2xl w-full flex items-center gap-2 justify-center">
                <img src="/src/assets/login.png" className="w-5 mt-1" />
                Log in
              </button>
            </a>
          </div>
          <form
            className="flex flex-col gap-4 text-lg md:text-2xl"
            onSubmit={handleRegister}
          >
            <div className="border-2 border-[#E5E9EF] flex flex-col px-4 py-2 rounded-xl">
              <label htmlFor="name" className="text-[#6C7280]">
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-transparent text-black rounded-xl focus:outline-none"
              />
            </div>

            <div className="border-2 border-[#E5E9EF] flex flex-col px-4 py-2 rounded-xl">
              <label htmlFor="email" className="text-[#6C7280]">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent text-black rounded-xl focus:outline-none"
              />
            </div>

            <div className="border-2 border-[#E5E9EF] flex flex-col px-4 py-2 rounded-xl">
              <label htmlFor="password" className="text-[#6C7280]">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent text-black rounded-xl focus:outline-none"
              />
            </div>

            <div className="border-2 border-[#E5E9EF] flex flex-col px-4 py-2 rounded-xl">
              <label htmlFor="role" className="text-[#6C7280]">
                Choose your role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="bg-transparent text-black rounded-xl focus:outline-none"
              >
                <option value="student">Student</option>
                <option value="mentor">Mentor</option>
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center mt-2">
              <p className="text-[16px] text-[#6C7280] md:flex-1 text-center md:text-left">
                By continuing you agree to our Terms and Privacy.
              </p>
              <button
                type="submit"
                className="cursor-pointer bg-[#21B4D6] hover:bg-[#009FAF] transition duration-200 text-white text-2xl px-10 py-2 rounded-xl flex items-center gap-3 mt-4"
              >
                Create account
              </button>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center mt-5 gap-3">
              <p className="text-gray-400 text-xl text-center md:text-left">
                Already have an account?
              </p>
              <a href="/">
                <button className="cursor-pointer border-2 text-xl md:text-2xl border-[#E5E9EF] text-black p-3 px-5 rounded-2xl flex items-center gap-2 hover:bg-[#F1F5F9] transition duration-200">
                  <img src="/src/assets/sign-in3.png" className="w-4 mt-1" />
                  Log in
                </button>
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
