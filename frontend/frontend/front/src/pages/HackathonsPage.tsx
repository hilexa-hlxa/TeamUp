import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import FilterPage from "./FilterPage";
import api, { getUserProfile } from "../api/axios";

interface Project {
  id?: number;
  title: string;
  description: string;
  tags: string[];
  status: string;
  applicants: number;
  progress: number;
  skills: string[];
  format?: string;
  location?: string;
  authorId?: number;
  authorName?: string;
  authorAvatar?: string;
  venue?: string;
  dateRange?: string;
  prize?: string;
  cover?: string;
  participants?: number;
  type?: "project" | "hackathon";
  hackathon_id?: number;
  applications?: {
    userId: number;
    status: "pending" | "approved" | "rejected";
  }[];
}

export default function HackathonsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 6;
  const formRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const projectsEndRef = useRef<HTMLDivElement>(null);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [selectedHackathon, setSelectedHackathon] = useState<Project | null>(
    null
  );
  const [joinedHackathons, setJoinedHackathons] = useState<number[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const token = localStorage.getItem("token");

  const [joinData, setJoinData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    skills: "",
    bio: "",
    hasTeam: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState("");

  const [filter, setFilter] = useState({
    status: "all",
    themes: [] as string[],
    format: "",
    location: "",
    search: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const themeRef = useRef<HTMLDivElement | null>(null);

  const [newHackathon, setNewHackathon] = useState({
    title: "",
    description: "",
    start_at: "",
    end_at: "",
    prize: "",
    location: "",
    format: "",
    tags: "",
    max_participants: "",
  });

  useEffect(() => {
    // Загружаем профиль пользователя
    const fetchUser = async () => {
      try {
        const userRes = await getUserProfile();
        setCurrentUser(userRes);
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          const user = JSON.parse(savedUser);
          setJoinedHackathons(user.joinedHackathons || []);
        }
      } catch (err) {
        console.error("Ошибка загрузки профиля:", err);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    setIsLoading(true);
    api
      .get("/hackathons")
      .then((res: any) => {
        const hackathonsWithDefaults = res.data.map((h: any) => {
          const now = new Date();
          const startAt = new Date(h.start_at);
          const endAt = new Date(h.end_at);

          let status = "upcoming";
          if (now >= startAt && now <= endAt) status = "ongoing";
          else if (now > endAt) status = "past";

          const dateRange = `${startAt.toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "short",
          })} - ${endAt.toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}`;

          return {
            ...h,
            status,
            dateRange,
            prize: h.prize || "—",
            location: h.location || "TBA",
            format: h.format || "Online",
            tags: h.tags?.length ? h.tags : ["General"],
            participants: h.participants ?? 0,
            authorName: h.authorName || "Unknown",
            authorAvatar:
              h.authorAvatar || "https://via.placeholder.com/40?text=A",
            type: "hackathon",
          };
        });

        setProjects(hackathonsWithDefaults);
      })
      .catch(() => setProjects([]))
      .finally(() => setIsLoading(false));
  }, []);

  const handleHackathonApplication = async (
    hackathonId: number,
    userId: number,
    status: "approved" | "rejected"
  ) => {
    try {
      const response = await api.post(
        `/hackathons/${hackathonId}/applications/${userId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProjects((prev) =>
        prev.map((h) =>
          h.id === hackathonId
            ? { ...h, applications: response.data.applications }
            : h
        )
      );
    } catch (err) {
      console.error(err);
      alert("Не удалось обновить заявку на хакатон");
    }
  };

  const handleAddHackathon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (
      !newHackathon.title ||
      !newHackathon.description ||
      !newHackathon.start_at ||
      !newHackathon.end_at
    ) {
      alert("Пожалуйста, заполните все поля!");
      return;
    }

    const start = new Date(newHackathon.start_at);
    const end = new Date(newHackathon.end_at);

    if (start >= end) {
      alert("Дата начала должна быть раньше даты окончания!");
      return;
    }

    if (!token) {
      alert("Пожалуйста, войдите в систему");
      return;
    }

    try {
      setIsSubmitting(true);

      const startDateTime = new Date(
        newHackathon.start_at + "T00:00:00"
      ).toISOString();
      const endDateTime = new Date(
        newHackathon.end_at + "T23:59:59"
      ).toISOString();

      const hackathonData: any = {
        title: newHackathon.title,
        description: newHackathon.description,
        start_at: startDateTime,
        end_at: endDateTime,
      };

      if (newHackathon.prize) hackathonData.prize = newHackathon.prize;
      if (newHackathon.max_participants)
        hackathonData.max_participants = parseInt(
          newHackathon.max_participants
        );
      if (newHackathon.location) hackathonData.location = newHackathon.location;
      if (newHackathon.format) hackathonData.format = newHackathon.format;
      if (newHackathon.tags) hackathonData.tags = newHackathon.tags;

      const response = await api.post("/hackathons", hackathonData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Берем ID из ответа сервера, если он есть, иначе генерируем временный
      const newId = response.data.id ?? Date.now();

      const newProject: Project = {
        ...response.data,
        id: newId,
        prize: newHackathon.prize || "—",
        location: newHackathon.location || "",
        format: newHackathon.format || "",
        tags: newHackathon.tags
          ? newHackathon.tags.split(",").map((t) => t.trim())
          : [],
        max_participants: newHackathon.max_participants
          ? parseInt(newHackathon.max_participants)
          : 0,
        participants: 0,
        authorName: currentUser?.name || "Unknown",
        authorAvatar:
          currentUser?.avatar || "https://via.placeholder.com/40?text=A",
        status: "upcoming",
        dateRange: `${new Date(newHackathon.start_at).toLocaleDateString(
          "ru-RU",
          { day: "numeric", month: "short" }
        )} - ${new Date(newHackathon.end_at).toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}`,
      };

      // Обновляем состояние
      setProjects((prev) => [...prev, newProject]);

      setNewHackathon({
        title: "",
        description: "",
        start_at: "",
        end_at: "",
        prize: "",
        location: "",
        format: "",
        tags: "",
        max_participants: "",
      });

      setShowForm(false);
      alert("Хакатон успешно создан!");
    } catch (err: any) {
      console.error(err);
      alert(
        "Ошибка при создании хакатона: " +
          JSON.stringify(err.response?.data || err.message)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const allTags = Array.from(new Set(projects.flatMap((p) => p.tags || [])));

  const filteredProjects = projects.filter((p) => {
    if (
      filter.search &&
      !p.title.toLowerCase().includes(filter.search.toLowerCase()) &&
      !p.description.toLowerCase().includes(filter.search.toLowerCase())
    )
      return false;
    if (filter.status !== "all" && p.status !== filter.status) return false;
    if (
      filter.themes.length > 0 &&
      !filter.themes.some((t) => p.tags.includes(t))
    )
      return false;
    if (filter.format && p.format !== filter.format) return false;
    if (
      filter.location &&
      !p.location?.toLowerCase().includes(filter.location.toLowerCase())
    )
      return false;
    return true;
  });

  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = filteredProjects.slice(
    indexOfFirstProject,
    indexOfLastProject
  );
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);

  const handleJoinSubmit = async () => {
    if (!selectedHackathon?.id) {
      setJoinError("Выберите хакатон.");
      return;
    }

    setJoinError("");
    setJoinSuccess("");

    if (!joinData.name.trim()) return setJoinError("Введите ваше имя.");
    if (!joinData.email.includes("@"))
      return setJoinError("Введите корректный email.");
    if (joinData.phone.length < 10)
      return setJoinError("Введите корректный номер телефона.");
    if (!joinData.role) return setJoinError("Выберите вашу роль.");
    if (!joinData.skills.trim()) return setJoinError("Введите ваши навыки.");
    if (!joinData.hasTeam)
      return setJoinError("Укажите есть ли у вас команда.");

    try {
      setIsSubmitting(true);
      await api.post(
        "/hackathons/join",
        {
          hackathonId: selectedHackathon.id,
          ...joinData,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setJoinSuccess("✅ Вы успешно зарегистрировались на хакатон!");
      setJoinedHackathons((prev) =>
        selectedHackathon?.id ? [...prev, selectedHackathon.id] : prev
      );

      setTimeout(() => {
        setShowJoinForm(false);
        setJoinData({
          name: "",
          email: "",
          phone: "",
          role: "",
          skills: "",
          bio: "",
          hasTeam: "",
        });
      }, 1500);
    } catch (err) {
      console.error(err);
      setJoinError("❌ Ошибка при регистрации. Попробуйте позже.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFilters = () => {
    setFilter({
      status: "all",
      themes: [],
      format: "",
      location: "",
      search: "",
    });
    setCurrentPage(1);
  };

  useEffect(() => {
    function handleOutside(e: MouseEvent | TouchEvent) {
      const el = themeRef.current;
      if (!el) return;
      if (!(e.target instanceof Node) || !el.contains(e.target))
        setThemeOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setThemeOpen(false);
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  function SkeletonProjectCard() {
    const randomWidth = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min) + min) + "%";
    return (
      <div className="bg-[#FBFCFC] border-2 border-[#E5E9EF] rounded-3xl p-6 shadow-md animate-pulse flex flex-col justify-between h-[400px]">
        <div
          className="h-6 bg-gray-300 rounded mb-3"
          style={{ width: randomWidth(60, 90) }}
        ></div>
        <div
          className="h-4 bg-gray-300 rounded mb-2"
          style={{ width: randomWidth(40, 80) }}
        ></div>
        <div
          className="h-4 bg-gray-300 rounded mb-2"
          style={{ width: randomWidth(50, 90) }}
        ></div>
        <div className="flex gap-2 mt-2 mb-2">
          <div className="h-6 bg-gray-300 rounded-full w-16"></div>
          <div className="h-6 bg-gray-300 rounded-full w-16"></div>
        </div>
        <div className="h-2 bg-gray-300 rounded mt-2 mb-2 w-full"></div>
        <div className="h-2 bg-gray-300 rounded mt-2 mb-2 w-3/4"></div>
        <div className="h-6 bg-gray-300 rounded mt-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-black">
      {/* 🔹 Верхняя панель */}
      <div className="flex justify-between flex-wrap gap-4 p-6 text-xl border-b-2 border-[#E5E9EF] items-center">
        {/* Поиск */}
        <input
          value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          placeholder="Search hackathons..."
          className="border-2 border-[#E5E9EF] py-3 rounded-4xl bg-[#FBFCFC] placeholder:text-[#6C7280] px-5 w-[500px] sm:w-full md:w-[500px]"
        />

        <div className="flex gap-3 items-center">
          <div className="flex xl:hidden">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="bg-[#EBEDF0] text-[#364154] px-4 py-2 rounded-xl shadow-sm hover:bg-[#E0E3E7] transition"
              aria-label="Open filters"
            >
              <img src="/src/assets/filter.png" className="w-7" alt="filter" />
            </button>
          </div>
          {currentUser && ["admin", "mentor"].includes(currentUser.role) && (
            <button
              onClick={() => {
                setShowForm(true);
                setTimeout(() => {
                  formRef.current?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
              className="bg-[#21B4D6] text-white rounded-xl px-5 py-2 hover:bg-[#009FAF] transition"
            >
              + Create Hackathon
            </button>
          )}
        </div>
      </div>

      {/* 🔹 Контент */}
      <div className="flex flex-col xl:flex-row p-10 gap-10">
        {/* 🔹 Левая часть */}
        <div className="hidden xl:flex border-2 border-[#E5E9EF] rounded-3xl py-6 px-6 bg-[#FBFCFC] shadow-md flex-col gap-6 h-[70vh] sticky top-6 overflow-y-auto">
          <p className="text-2xl font-semibold mb-2">Filters</p>

          {/* Status */}
          <div className="flex flex-col">
            <label className="text-[#6C7280] text-lg font-medium">Status</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="border-2 border-[#E5E9EF] rounded-xl px-4 py-2"
            >
              <option value="all">All</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="past">Past</option>
            </select>
          </div>

          {/* Theme */}
          <div className="flex flex-col relative" ref={themeRef}>
            <label className="text-[#6C7280] text-lg font-medium mb-1">
              Theme
            </label>

            {/* контрол видимого поля */}
            <div
              onClick={() => setThemeOpen((s) => !s)}
              role="button"
              aria-haspopup="listbox"
              aria-expanded={themeOpen}
              className="w-full border-2 border-[#E5E9EF] rounded-xl bg-[#FBFCFC] text-black cursor-pointer flex flex-col gap-2 min-h-[48px] items-start p-2"
            >
              {filter.themes.length === 0 ? (
                <span className="text-gray-400">Select themes...</span>
              ) : (
                filter.themes.map((t) => (
                  <span
                    key={t}
                    className="bg-[#E6F0FF] text-[#2663EB] px-2 py-1 rounded-lg text-sm flex items-center gap-2 "
                  >
                    {t}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilter({
                          ...filter,
                          themes: filter.themes.filter((x) => x !== t),
                        });
                      }}
                      className="text-xs ml-1"
                      aria-label={`Remove ${t}`}
                    >
                      ✕
                    </button>
                  </span>
                ))
              )}

              {/* caret */}
              <div className="ml-auto pl-2">
                <svg
                  className={`w-4 h-4 transform transition-transform ${
                    themeOpen ? "rotate-180" : "rotate-0"
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M5.23 7.21a.75.75 0 011.06-.02L10 10.9l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.25a.75.75 0 01-.02-1.04z" />
                </svg>
              </div>
            </div>

            {/* Dropdown */}
            {themeOpen && (
              <div
                className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto"
                role="listbox"
                aria-multiselectable="true"
              >
                {allTags.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    No themes
                  </div>
                ) : (
                  allTags.map((theme) => {
                    const selected = filter.themes.includes(theme);
                    return (
                      <div
                        key={theme}
                        role="option"
                        aria-selected={selected}
                        onClick={() => {
                          if (selected) {
                            setFilter({
                              ...filter,
                              themes: filter.themes.filter((t) => t !== theme),
                            });
                          } else {
                            setFilter({
                              ...filter,
                              themes: [...filter.themes, theme],
                            });
                          }
                        }}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          readOnly
                          tabIndex={-1}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{theme}</span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Format */}
          <div>
            <label className="text-[#6C7280] text-lg font-medium">Format</label>
            <select
              value={filter.format || ""}
              onChange={(e) => setFilter({ ...filter, format: e.target.value })}
              className="mt-2 w-full border-2 border-[#E5E9EF] rounded-xl p-2 bg-white text-black "
            >
              <option value="">All</option>
              <option value="in-person">In-person</option>
              <option value="online">Online</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="text-[#6C7280] text-lg font-medium">
              Location
            </label>
            <input
              type="text"
              placeholder="e.g. Berkeley, CA"
              value={filter.location || ""}
              onChange={(e) =>
                setFilter({ ...filter, location: e.target.value })
              }
              className="mt-2 w-full border-2 border-[#E5E9EF] rounded-xl p-2 placeholder:text-[#6C7280]"
            />
          </div>

          {/* Reset button */}
          <button
            onClick={resetFilters}
            className="border border-[#E5E9EF] text-[#6C7280] py-2 rounded-xl hover:bg-gray-100 flex justify-center items-center gap-2"
          >
            Reset
          </button>
        </div>

        {/* Правая часть — хакатоны */}
        <div className="flex-1 overflow-y-auto">
          <p className="text-4xl font-semibold">Hackathons</p>

          <div className="grid gap-6 mt-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <SkeletonProjectCard key={i} />
              ))
            ) : currentProjects.length === 0 ? (
              <p className="col-span-full text-center text-gray-500 py-20">
                No hackathons found.
              </p>
            ) : (
              currentProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="bg-white border-2 border-[#E5E9EF] rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition"
                >
                  <div className="h-40 md:h-44 w-full overflow-hidden bg-gray-100">
                    <img
                      src={
                        proj.cover ??
                        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=60"
                      }
                      alt={proj.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">
                          {proj.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              proj.authorAvatar ??
                              "https://via.placeholder.com/40?text=A"
                            }
                            alt={proj.authorName ?? "Author"}
                            className="w-8 h-8 rounded-full border border-gray-200"
                          />
                          <span className="text-sm text-[#6C7280]">
                            {proj.authorName ?? "Unknown Author"}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-sm px-3 py-1 rounded-xl ${
                          proj.status === "upcoming"
                            ? "bg-[#F1F5F9] text-black border border-[#E5E9EF]"
                            : proj.status === "ongoing"
                            ? "bg-[#F1F5F9] text-black border border-[#E5E9EF]"
                            : proj.status === "past"
                            ? "bg-[#F1F5F9] text-black border border-[#E5E9EF]"
                            : "bg-[#F1F5F9] text-black border border-[#E5E9EF]"
                        }`}
                      >
                        {proj.status && typeof proj.status === "string"
                          ? proj.status.charAt(0).toUpperCase() +
                            proj.status.slice(1).toLowerCase()
                          : "Unknown"}
                      </span>
                    </div>

                    <div className="mt-4 text-sm text-[#6C7280] flex items-center justify-between">
                      <div>
                        <div className="font-medium flex gap-1 items-center">
                          <i className="fa-solid fa-calendar text-[#6C7280]"></i>
                          {proj.dateRange ?? "TBA"}
                        </div>
                        <div className="flex items-center gap-3 text-[#6C7280] text-sm mb-4">
                          {proj.format && typeof proj.format === "string" && (
                            <span className="flex items-center gap-1">
                              <i className="fa-solid fa-laptop-code text-[#6C7280]"></i>
                              {proj.format.charAt(0).toUpperCase() +
                                proj.format.slice(1).toLowerCase()}
                            </span>
                          )}
                          {proj.location && (
                            <span className="flex items-center gap-1">
                              <i className="fa-solid fa-location-dot text-[#6C7280]"></i>
                              {proj.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-1">
                        <i className="fa-solid fa-trophy text-[#6C7280]"></i>
                        <div className="font-semibold">{proj.prize ?? "—"}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-wrap gap-2">
                          {proj.tags && proj.tags.length > 0 ? (
                            proj.tags.map((tag, i) => (
                              <span
                                key={i}
                                className="bg-[#3A3F47] text-white px-3 py-1 rounded-full text-sm"
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-[#6C7280] text-sm">—</span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-[#6C7280]">
                        {proj.participants ?? 0} joined
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => navigate(`/hackathon/${proj.id}`)}
                        className="flex-1 border border-[#E5E9EF] rounded-xl px-4 py-2 hover:bg-[#F1F5F9]"
                      >
                        View
                      </button>
                      {currentUser &&
                        currentUser.role === "student" &&
                        proj.id && (
                          <button
                            onClick={() => {
                              if (
                                !currentUser ||
                                currentUser.role !== "student"
                              )
                                return;

                              setSelectedHackathon(proj); // Сохраняем хакатон
                              setShowJoinForm(true); // Открываем форму
                            }}
                            disabled={
                              joinedHackathons.includes(proj.id) ||
                              !currentUser ||
                              currentUser.role !== "student"
                            }
                            className={`px-4 py-2 rounded-xl w-full transition flex-1 ${
                              joinedHackathons.includes(proj.id)
                                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                : "bg-[#21B4D6] text-white hover:bg-[#009FAF]"
                            }`}
                          >
                            {joinedHackathons.includes(proj.id)
                              ? "Joined"
                              : "Join"}
                          </button>
                        )}
                    </div>

                    {/* Кнопка удаления для админов и менторов */}
                    {currentUser && currentUser.role && ["admin", "mentor"].includes(currentUser.role.toLowerCase()) && proj.id && (
                      <button
                        onClick={async () => {
                          if (
                            window.confirm(
                              `Вы уверены, что хотите удалить хакатон "${proj.title}"? Это действие нельзя отменить.`
                            )
                          ) {
                            try {
                              console.log("=== DELETE HACKATHON DEBUG ===");
                              console.log("Hackathon ID:", proj.id);
                              console.log("Current User:", currentUser);
                              console.log("User Role:", currentUser?.role);
                              console.log("Token exists:", !!localStorage.getItem("token"));
                              
                              const response = await api.delete(`/hackathons/${proj.id}`);
                              console.log("✅ Delete successful:", response.status);
                              alert("Хакатон успешно удален");
                              // Обновляем список хакатонов
                              setProjects(projects.filter(p => p.id !== proj.id));
                            } catch (err: any) {
                              console.error("❌ DELETE ERROR:", err);
                              console.error("Status:", err.response?.status);
                              console.error("Data:", err.response?.data);
                              const errorMsg = err.response?.data?.detail || err.message || "Не удалось удалить хакатон";
                              alert(`Ошибка: ${errorMsg}\n\nПроверьте консоль (F12) для деталей.`);
                            }
                          }
                        }}
                        className="mt-2 w-full bg-red-500 text-white rounded-xl px-4 py-2 hover:bg-red-600 transition font-medium"
                      >
                        <i className="fa-solid fa-trash mr-2"></i>
                        Удалить хакатон
                      </button>
                    )}
                    {/* Отладочная информация */}
                    {currentUser && (
                      <div className="mt-1 text-xs text-gray-400">
                        Debug: Role={currentUser.role}, CanDelete={["admin", "mentor"].includes(currentUser.role?.toLowerCase())}
                      </div>
                    )}
                  </div>
                  {selectedHackathon &&
                  currentUser &&
                  (currentUser.role === "mentor" ||
                    currentUser.role === "admin") &&
                  selectedHackathon.applications?.length ? (
                    <div className="mt-4">
                      <p className="text-sm font-semibold mb-2">
                        Applications:
                      </p>
                      {selectedHackathon.applications.map((app) => (
                        <div
                          key={app.userId}
                          className="flex items-center justify-between mb-1"
                        >
                          <span>User ID: {app.userId}</span>
                          <div className="flex gap-2">
                            {app.status === "pending" ? (
                              <>
                                <button
                                  onClick={() =>
                                    handleHackathonApplication(
                                      selectedHackathon.id!,
                                      app.userId,
                                      "approved"
                                    )
                                  }
                                  className="px-2 py-1 bg-green-500 text-white rounded text-sm"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() =>
                                    handleHackathonApplication(
                                      selectedHackathon.id!,
                                      app.userId,
                                      "rejected"
                                    )
                                  }
                                  className="px-2 py-1 bg-red-500 text-white rounded text-sm"
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span
                                className={`text-sm font-semibold ${
                                  app.status === "approved"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {app.status && typeof app.status === "string"
                                  ? app.status.charAt(0).toUpperCase() +
                                    app.status.slice(1)
                                  : "Unknown"}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            )}
            <div className="projects-list">
              <div ref={projectsEndRef}></div>
            </div>
          </div>

          {showForm && (
            <div
              ref={formRef}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white p-8 rounded-3xl w-full max-w-2xl shadow-xl overflow-y-auto max-h-[90vh]">
                <h2 className="text-2xl font-semibold mb-6">Создать Хакатон</h2>

                <form onSubmit={handleAddHackathon}>
                  <label className="text-lg font-medium">Название</label>
                  <input
                    type="text"
                    value={newHackathon.title}
                    onChange={(e) =>
                      setNewHackathon({
                        ...newHackathon,
                        title: e.target.value,
                      })
                    }
                    className="mt-2 mb-4 w-full border-2 p-2 rounded-xl"
                  />

                  <label className="text-lg font-medium">Описание</label>
                  <textarea
                    value={newHackathon.description}
                    onChange={(e) =>
                      setNewHackathon({
                        ...newHackathon,
                        description: e.target.value,
                      })
                    }
                    className="mt-2 mb-4 w-full border-2 p-2 rounded-xl"
                  />

                  <label className="text-lg font-medium">Дата начала</label>
                  <input
                    type="date"
                    value={newHackathon.start_at}
                    onChange={(e) =>
                      setNewHackathon({
                        ...newHackathon,
                        start_at: e.target.value,
                      })
                    }
                    className="mt-2 mb-4 w-full border-2 p-2 rounded-xl"
                  />

                  <label className="text-lg font-medium">Дата окончания</label>
                  <input
                    type="date"
                    value={newHackathon.end_at}
                    onChange={(e) =>
                      setNewHackathon({
                        ...newHackathon,
                        end_at: e.target.value,
                      })
                    }
                    className="mt-2 mb-4 w-full border-2 p-2 rounded-xl"
                  />

                  <label className="text-lg font-medium">
                    Призы (необязательно)
                  </label>
                  <textarea
                    value={newHackathon.prize}
                    onChange={(e) =>
                      setNewHackathon({
                        ...newHackathon,
                        prize: e.target.value,
                      })
                    }
                    placeholder="Опишите призы и награды..."
                    className="mt-2 mb-4 w-full border-2 p-2 rounded-xl"
                    rows={3}
                  />

                  <label className="text-lg font-medium">Локация</label>
                  <input
                    type="text"
                    value={newHackathon.location}
                    onChange={(e) =>
                      setNewHackathon({
                        ...newHackathon,
                        location: e.target.value,
                      })
                    }
                    className="mt-2 mb-4 w-full border-2 p-2 rounded-xl"
                  />

                  <label className="text-lg font-medium">Формат</label>
                  <select
                    value={newHackathon.format}
                    onChange={(e) =>
                      setNewHackathon({
                        ...newHackathon,
                        format: e.target.value,
                      })
                    }
                    className="mt-2 mb-4 w-full border-2 p-2 rounded-xl"
                  >
                    <option value="">Выберите формат</option>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="mixed">Смешанный</option>
                  </select>

                  <label className="text-lg font-medium">Теги</label>
                  <input
                    type="text"
                    placeholder="Например: AI, Blockchain, FinTech"
                    value={newHackathon.tags}
                    onChange={(e) =>
                      setNewHackathon({ ...newHackathon, tags: e.target.value })
                    }
                    className="mt-2 mb-4 w-full border-2 p-2 rounded-xl"
                  />

                  <label className="text-lg font-medium">
                    Максимальное количество участников (необязательно)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newHackathon.max_participants}
                    onChange={(e) =>
                      setNewHackathon({
                        ...newHackathon,
                        max_participants: e.target.value,
                      })
                    }
                    placeholder="Например: 50"
                    className="mt-2 mb-4 w-full border-2 p-2 rounded-xl"
                  />

                  {/* Кнопки */}
                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2 rounded-xl text-white bg-[#21B4D6] hover:bg-[#009FAF]"
                    >
                      {isSubmitting ? "Создание..." : "Создать"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showJoinForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white p-8 rounded-3xl w-full max-w-xl shadow-xl">
                <h2 className="text-2xl font-semibold mb-6">
                  Регистрация на хакатон
                </h2>

                {joinError && <p className="text-red-500 mb-3">{joinError}</p>}
                {joinSuccess && (
                  <p className="text-green-600 mb-3">{joinSuccess}</p>
                )}

                <label>Имя</label>
                <input
                  type="text"
                  value={joinData.name}
                  onChange={(e) =>
                    setJoinData({ ...joinData, name: e.target.value })
                  }
                  className="w-full border p-2 rounded-xl mb-4"
                />

                <label>Email</label>
                <input
                  type="email"
                  value={joinData.email}
                  onChange={(e) =>
                    setJoinData({ ...joinData, email: e.target.value })
                  }
                  className="w-full border p-2 rounded-xl mb-4"
                />

                <label>Телефон</label>
                <input
                  type="tel"
                  value={joinData.phone}
                  onChange={(e) =>
                    setJoinData({ ...joinData, phone: e.target.value })
                  }
                  className="w-full border p-2 rounded-xl mb-4"
                />

                <label>Роль</label>
                <input
                  type="text"
                  value={joinData.role}
                  onChange={(e) =>
                    setJoinData({ ...joinData, role: e.target.value })
                  }
                  className="w-full border p-2 rounded-xl mb-4"
                />

                <label>Навыки</label>
                <textarea
                  value={joinData.skills}
                  onChange={(e) =>
                    setJoinData({ ...joinData, skills: e.target.value })
                  }
                  className="w-full border p-2 rounded-xl mb-4"
                />

                <label>Есть команда?</label>
                <select
                  value={joinData.hasTeam}
                  onChange={(e) =>
                    setJoinData({ ...joinData, hasTeam: e.target.value })
                  }
                  className="w-full border p-2 rounded-xl mb-4"
                >
                  <option value="">Выберите</option>
                  <option value="yes">Да</option>
                  <option value="no">Нет</option>
                </select>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowJoinForm(false)}
                    className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300"
                  >
                    Отмена
                  </button>

                  <button
                    onClick={handleJoinSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-2 rounded-xl bg-[#21B4D6] text-white hover:bg-[#009FAF]"
                  >
                    {isSubmitting ? "Отправка..." : "Присоединиться"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 🔹 Пагинация */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-8">
              {/* Кнопка "Назад" */}
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 border rounded-xl ${
                  currentPage === 1
                    ? "text-gray-400 border-gray-200"
                    : "hover:bg-[#F1F5F9]"
                }`}
              >
                ←
              </button>

              {/* Номера страниц */}
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 border rounded-xl ${
                    currentPage === i + 1
                      ? "bg-[#21B4D6] text-white border-[#009FAF]"
                      : "border-[#E5E9EF] hover:bg-[#F1F5F9]"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              {/* Кнопка "Вперёд" */}
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className={`px-3 py-1 border rounded-xl ${
                  currentPage === totalPages
                    ? "text-gray-400 border-gray-200"
                    : "hover:bg-[#F1F5F9]"
                }`}
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>
      {mobileFilterOpen && (
        <FilterPage
          filter={filter}
          setFilter={setFilter}
          onClose={() => setMobileFilterOpen(false)}
          onReset={resetFilters}
          projects={projects}
        />
      )}
    </div>
  );
}
