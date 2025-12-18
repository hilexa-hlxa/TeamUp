import { Outlet } from "react-router-dom";
import Header from "../components/Header";

export default function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F4F6F9] text-white">
      <Header />
      <main className="bg-white">
        <Outlet /> {/* сюда подставляются все внутренние страницы */}
      </main>
     
    </div>
  );
}
