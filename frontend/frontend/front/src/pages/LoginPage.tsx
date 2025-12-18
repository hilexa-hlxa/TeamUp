import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, getUserProfile } from "../api/axios";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      alert("Пожалуйста, заполните все поля!");
      return;
    }

    try {
      const data = await loginUser({ email, password });

      if (!data || !data.access_token) {
        alert("Пользователь не зарегистрирован. Сначала зарегистрируйтесь.");
        return;
      }

      localStorage.setItem("token", data.access_token);
      if (data.refresh_token)
        localStorage.setItem("refreshToken", data.refresh_token);

      const userProfile = await getUserProfile();
      localStorage.setItem("user", JSON.stringify(userProfile));

      navigate("/projects");
    } catch (error: any) {
      console.error("Ошибка входа:", error.response?.data || error.message);

      alert(
        error.response?.data?.detail ||
          "Неверный email или пароль. Сначала зарегистрируйтесь."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F8FA] p-4 md:p-20">
      <div className="gap-10 w-full max-w-8xl grid grid-cols-1 lg:grid-cols-[6fr_4fr] overflow-hidden">
        {/* Левая часть */}
        <div className="bg-[#FBFCFC] flex-1 p-10 flex gap-6 flex-col h-full justify-center mb-10 md:mb-0 border border-2 rounded-3xl border-[#E5E9EF]">
          <div className="flex gap-2 flex-wrap">
            <span className="bg-[#F6F8FA] text-lg md:text-xl px-3 py-1 text-black rounded-xl border-2 border-[#E5E9EF]">
              For students & hackers
            </span>
            <span className="bg-[#C5FCA4] text-lg md:text-xl px-3 py-1 text-black rounded-full">
              Free
            </span>
          </div>
          <h1 className="text-black text-3xl md:text-4xl font-semibold">
            Form teams faster. Ship better projects.
          </h1>
          <p className="text-[#6C7280] text-lg md:text-2xl">
            Create projects, match with teammates, manage applications, and
            collaborate in a focused workspace.
          </p>
          <div className="flex flex-col text-black text-lg md:text-2xl gap-2 justify-start">
            <div className="flex gap-2 items-center">
              <img src="/src/assets/team.png" className="w-6" />
              <p>Smart team formation</p>
            </div>
            <div className="flex gap-2 items-center">
              <img src="/src/assets/work.png" className="w-6" />
              <p>Application workflows</p>
            </div>
            <div className="flex gap-2 items-center">
              <img src="/src/assets/project.png" className="w-6" />
              <p>Project workspace</p>
            </div>
            <div className="flex gap-2 items-center">
              <img src="/src/assets/dark.png" className="w-5" />
              <p>Light & Dark modes</p>
            </div>
          </div>
        </div>

        {/* Правая часть */}
        <div className="flex-1 bg-[#FBFCFC] p-10 flex flex-col justify-center border border-2 border-[#E5E9EF] rounded-3xl text-black">
          <div className="flex flex-col md:flex-row justify-between text-xl md:text-2xl gap-3 mb-4">
            <a href="/register" className="w-full">
              <button className="cursor-pointer border-2 bg-[#F1F5F9] hover:bg-gray-200 transition duration-200 border-[#E5E9EF] text-black p-3 rounded-2xl w-full flex items-center gap-2 justify-center">
                <img src="/src/assets/sign-in3.png" className="w-4 mt-1" />
                Sign in
              </button>
            </a>

            <a href="/" className="w-full">
              <button className="cursor-pointer bg-blue-100 text-[#2663EB] hover:bg-blue-200 transition duration-200 p-3 rounded-2xl flex items-center w-full gap-2 justify-center">
                <img src="/src/assets/login1.png" className="w-5 mt-1" />
                Log in
              </button>
            </a>
          </div>

          <form
            className="flex flex-col gap-4 text-lg md:text-2xl"
            onSubmit={handleLogin}
          >
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

            <div className="flex flex-col md:flex-row gap-4 items-center mt-2">
              <p className="text-[16px] text-[#6C7280] md:flex-1 text-center md:text-left">
                By continuing you agree to our Terms and Privacy.
              </p>
              <button
                type="submit"
                className="cursor-pointer bg-[#21B4D6] hover:bg-[#009FAF] transition duration-200 text-white text-2xl px-10 py-2 rounded-xl flex items-center gap-3"
              >
                <img src="/src/assets/sign-in.png" className="w-6" />
                Log in account
              </button>
            </div>

            <hr className="border border-[#E5E9EF] mt-2" />
          </form>

          <div className="flex flex-col md:flex-row justify-between items-center mt-5 gap-3">
            <p className="text-gray-400 text-xl text-center md:text-left">
              Don't have an account?
            </p>
            <a href="/register">
              <button className="cursor-pointer border-2 text-xl md:text-2xl border-[#E5E9EF] text-black p-3 px-5 rounded-2xl flex items-center gap-2 hover:bg-[#F1F5F9] transition duration-200">
                <img src="/src/assets/sign-in3.png" className="w-4 mt-1" />
                Sign in
              </button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
