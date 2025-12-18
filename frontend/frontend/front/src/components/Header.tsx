import { useState, useEffect } from "react";
import { getUserProfile } from "../api/axios";

export default function Header() {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const currentPath = window.location.pathname;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const userData = await getUserProfile();
          setUser(userData);
        }
      } catch (err) {
        // User not logged in or error
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  const menuItems = [
    {
      title: "Projects",
      icon: <i className="fa-solid fa-cubes transition-colors"></i>,
      href: "/projects",
    },
    {
      title: "Hackathons",
      icon: <i className="fa-solid fa-calendar transition-colors"></i>,
      href: "/hackathons",
    },
    {
      title: "Applications",
      icon: <i className="fa-solid fa-list-ul transition-colors"></i>,
      href: "/applications",
    },
    {
      title: "Workspace",
      icon: <i className="fa-solid fa-briefcase transition-colors"></i>,
      href: "/workspace",
    },
    {
      title: "Profile",
      icon: <i className="fa-solid fa-user transition-colors"></i>,
      href: "/profile",
    },
  ];

  return (
    <header className="bg-[#C5FCA4] border-b-2 border-[#E5E9EF] text-black relative">
      {/* Верхняя панель */}
      <div className="py-3 px-4 flex items-center justify-between flex-wrap">
        {/* Логотип */}
        <div className="flex gap-4 items-center">
          <img src="/src/assets/star.png" className="w-10" />
          <h1 className="text-3xl font-medium leading-tight">
            TeamUp
            <br /> Campus
          </h1>
        </div>

        {/* Десктопное меню и аватар */}
        <div className="hidden lg:flex gap-5 items-center flex-wrap">
          {menuItems.map((item) => (
            <a
              key={item.title}
              href={item.href}
              className={`flex gap-2 items-center px-5 py-3 rounded-xl
    ${currentPath === item.href ? "bg-[#21B4D6] text-white" : ""}
    hover:bg-[#21B4D6] hover:text-white transition
  `}
            >
              <span>{item.icon}</span>
              <span className="text-2xl">{item.title}</span>
            </a>
          ))}
          {user && user.avatar_url && (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="w-12 h-12 rounded-full border-2 border-[#E5E9EF] object-cover ml-2"
            />
          )}
        </div>

        {/* Кнопка бургер-меню и аватар (мобильная версия) */}
        <div className="lg:hidden flex items-center gap-3">
          {user && user.avatar_url && (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="w-10 h-10 rounded-full border-2 border-[#E5E9EF] object-cover"
            />
          )}
          <button
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            className="text-3xl transition-transform duration-500"
          >
            {isMobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Раскрывающееся меню под хедером */}
      <div
        className={`lg:hidden bg-[#FBFCFC] border-t border-[#E5E9EF] overflow-hidden transition-all duration-300 ${
          isMobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col">
          {menuItems.map((item) => (
            <a
              key={item.title}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex gap-3 items-center px-5 py-3 hover:bg-[#F1F5F9] transition"
            >
              <span className="text-inherit">{item.icon}</span>
              <span className="text-lg">{item.title}</span>
            </a>
          ))}

          
        </div>
      </div>
    </header>
  );
}
