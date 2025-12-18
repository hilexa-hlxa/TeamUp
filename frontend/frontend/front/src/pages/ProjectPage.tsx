import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import FilterPage from "./FilterPage";
import api from "../api/axios";
import { getUserProfile } from "../api/axios";

interface Application {
  id: string;
  applicant_id: number;
  status: "pending" | "approved" | "rejected";
}

interface Project {
  id: number;
  title: string;
  description: string;
  tags: string[];
  status: string;
  applicants: number;
  skills: string[]; // оставляем для совместимости
  tech_stack?: string[]; // добавляем для хранения ролей
  format?: string;
  location?: string;
  authorId?: number;
  authorName?: string;
  authorAvatar?: string;
  authorEmail?: string; // добавляем email
  joinedUsers?: number[];
  applications?: Application[];
  type?: "project" | "hackathon";
  project_id?: number;
  ownerId: number;
  alreadyApplied?: boolean;
  alreadyJoined?: boolean;
  maxParticipants?: number;
  prize?: string;
  deadline?: string;
}

export default function ProjectPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 6;
  const formRef = useRef<HTMLDivElement | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [themeOpen, setThemeOpen] = useState(false);
  const themeRef = useRef<HTMLDivElement | null>(null);
  // Role will be taken from currentUser after it's loaded

  const fallbackProjects: Project[] = [
    {
      ownerId: 1,
      id: 1,
      type: "project",
      project_id: 1,
      title: "AI Health Tracker",
      description:
        "Project with AI for health tracker.  Wales between 1918 and 2011, highlighting long-term trends and changes.",
      tags: ["Data", "UI"],
      status: "upcoming",
      applicants: 5,
      skills: ["Python"],
      format: "online",
      location: "San Francisco, CA",
      authorId: 1,
      authorName: "Alice Johnson",
      authorAvatar:
        "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80",
    },
    {
      ownerId: 2,
      id: 2,
      type: "project",
      project_id: 2,
      title: "AI Health",
      description:
        "Project with AI for health traker. Wales between 1918 and 2011, highlighting long-term trends and changes. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
      tags: ["AI/ML"],
      status: "upcoming",
      applicants: 5,
      skills: ["Python"],
      format: "online",
      location: "San Francisco, CA",
      authorId: 1,
      authorName: "Charlie Lee",
      authorAvatar:
        "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80",
    },
  ];

  const [currentUser, setCurrentUser] = useState<{
    id: number;
    name: string;
    email: string;
    role: string;
    avatar: string;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingProjects(true);

      const token = localStorage.getItem("token");

      const userPromise = token
        ? getUserProfile().catch(() => null)
        : Promise.resolve(null);
      const projectsPromise = api
        .get("/projects")
        .catch(() => ({ data: fallbackProjects }));

      const [user, projectsRes] = await Promise.all([
        userPromise,
        projectsPromise,
      ]);

      if (user) setCurrentUser(user);

      const projectsData: Project[] = projectsRes.data;

      const updatedProjects = projectsData.map((p) => {
        const alreadyApplied = user
          ? p.applications?.some((a) => a.applicant_id === user.id) ?? false
          : false;
        const alreadyJoined = user
          ? p.joinedUsers?.includes(user.id) ?? false
          : false;

        return {
          ...p,
          authorId: p.authorId ?? p.ownerId,
          authorName: p.authorName ?? "Unknown",
          authorAvatar:
            p.authorAvatar ?? "https://via.placeholder.com/40?text=A",
          format: p.format ?? "online",
          location: p.location ?? "TBA",
          tags: Array.isArray(p.tags) ? p.tags : ["General"],
          applications: Array.isArray(p.applications) ? p.applications : [],
          joinedUsers: Array.isArray(p.joinedUsers) ? p.joinedUsers : [],
          status: p.status ?? "upcoming",
          alreadyApplied,
          alreadyJoined,
        };
      });

      setProjects(updatedProjects);
      setLoadingProjects(false);
    };

    fetchData();
  }, []);

  const [requiredRoles, setRequiredRoles] = useState<
    { role: string; count: number }[]
  >([{ role: "developer", count: 1 }]);

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

  const [filter, setFilter] = useState({
    status: "all",
    themes: [] as string[],
    format: "",
    location: "",
    search: "",
  });

  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (showForm) {
      const t = setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
      return () => clearTimeout(t);
    }
  }, [showForm]);

  // console.log("CURRENT USER:", currentUser);

  const handleJoin = async (project: Project) => {
    // Проверка авторизации
    if (!currentUser?.id || !localStorage.getItem("token")) {
      alert("Please log in to join the project");
      return;
    }

    if (project.alreadyApplied) {
      alert("You have already applied to this project");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Token is missing, please log in again");
      return;
    }

    // Используем правильный ID проекта
    const targetId = project.project_id ?? project.id;

    try {
      const response = await api.post(
        `/applications`,
        {
          type: "project",
          target_id: targetId,
          message: "I would like to join this project", // можно сделать input позже
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const newApplication = response.data;

      setProjects((prev) =>
        prev.map((p) =>
          p.id === project.id
            ? {
                ...p,
                applications: Array.isArray(p.applications)
                  ? [...p.applications, newApplication]
                  : [newApplication],
                alreadyApplied: true,
              }
            : p
        )
      );
    } catch (err: any) {
      console.error("Error applying:", err.response?.data || err);

      if (err.response?.data?.detail === "Already applied to this target") {
        alert("You have already applied to this project");
      } else if (err.response?.status === 400) {
        alert("Bad request: check your input or project ID");
      } else {
        alert("Failed to send application 😢");
      }
    }
  };

  const renderJoinButton = (proj: Project) => {
    if (!currentUser?.id || currentUser.role !== "student") {
      return null; // для менторов и админов кнопка не отображается
    }

    const alreadyApplied = proj.applications?.some(
      (a) => a.applicant_id === currentUser.id
    );

    const alreadyJoined = proj.joinedUsers?.includes(currentUser.id);

    const disabled = alreadyApplied || alreadyJoined;

    const buttonText = alreadyJoined
      ? "Joined"
      : alreadyApplied
      ? "Already applied"
      : "Join";

    return (
      <button
        onClick={() => handleJoin(proj)}
        disabled={disabled}
        className={`flex-1 rounded-xl px-5 py-2 transition ${
          disabled
            ? "bg-gray-300 text-white cursor-not-allowed"
            : "bg-[#21B4D6] text-white hover:bg-[#009FAF]"
        }`}
      >
        {buttonText}
      </button>
    );
  };
  const handleApplication = async (
    applicationId: string,
    status: "approved" | "rejected"
  ) => {
    try {
      const endpoint =
        status === "approved"
          ? `/applications/${applicationId}/approve`
          : `/applications/${applicationId}/reject`;

      await api.patch(endpoint);

      setProjects((prev) =>
        prev.map((p) => {
          if (!p.applications?.some((a) => a.id === applicationId)) return p;

          const updatedApplications = p.applications.map((a) =>
            a.id === applicationId ? { ...a, status } : a
          );

          const applicantId =
            updatedApplications.find((a) => a.id === applicationId)
              ?.applicant_id ?? null;

          const updatedJoinedUsers =
            status === "approved" && applicantId
              ? Array.from(new Set([...(p.joinedUsers ?? []), applicantId]))
              : p.joinedUsers ?? [];

          return {
            ...p,
            applications: updatedApplications,
            joinedUsers: updatedJoinedUsers,
          };
        })
      );
    } catch (err) {
      console.error(err);
      alert("Не удалось обновить заявку");
    }
  };

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectPrize, setProjectPrize] = useState("");
  const [projectDeadline, setProjectDeadline] = useState("");
  const [projectMaxParticipants, setProjectMaxParticipants] = useState("");
  const rolesAsStrings = requiredRoles.map((r) => r.role);
  const [projectFormat, setProjectFormat] = useState("online");
  const [projectLocation, setProjectLocation] = useState("");
  const [projectTags, setProjectTags] = useState(""); // текст через запятую
  const [projectStatus, setProjectStatus] = useState("upcoming");

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim() || !projectDescription.trim()) {
      alert("Пожалуйста, заполните все поля!");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Пожалуйста, войдите в систему");
      return;
    }
    console.log("Token перед отправкой проекта:", token);

    try {
      if (!currentUser) {
        alert("Пожалуйста, войдите в систему");
        return;
      }
      const projectData: any = {
        title: projectName,
        description: projectDescription,
        tech_stack: rolesAsStrings,
        authorEmail: currentUser.email,
      };

      if (projectPrize) {
        projectData.prize = projectPrize;
      }

      if (projectDeadline) {
        // Форматируем дату для API (ISO 8601 с временем)
        const deadlineDateTime = new Date(
          projectDeadline + "T23:59:59"
        ).toISOString();
        projectData.deadline = deadlineDateTime;
      }

      if (projectMaxParticipants) {
        projectData.max_participants = parseInt(projectMaxParticipants);
      }

      const response = await api.post("projects", projectData);

      const newProject: Project = {
        id: response.data.id,
        title: projectName,
        description: projectDescription,
        skills: rolesAsStrings,
        format: "online",
        location: "TBA",
        tags: ["General"],
        status: "upcoming",
        applicants: 0,
        joinedUsers: [],
        applications: [],
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorAvatar: currentUser.avatar,
        ownerId: currentUser.id,
        alreadyApplied: false,
        alreadyJoined: false,
        deadline: projectDeadline,
      };
      setProjects((prev) => [newProject, ...prev]);

      alert("Проект создан!");
      setProjectName("");
      setProjectDescription("");
      setProjectPrize("");
      setProjectDeadline("");
      setProjectMaxParticipants("");
      setRequiredRoles([{ role: "developer", count: 1 }]);
      setShowForm(false);
    } catch (error: any) {
      console.error(
        "Ошибка при создании проекта:",
        error.response?.data || error.message
      );
      alert(
        "Ошибка при создании проекта: " +
          JSON.stringify(error.response?.data || error.message)
      );
    }
  };

  const allTags = Array.from(new Set(projects.flatMap((p) => p.tags ?? [])));

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
      if (!(e.target instanceof Node)) return;
      if (themeRef.current && !themeRef.current.contains(e.target)) {
        setThemeOpen(false);
      }
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  return (
    <div className="min-h-screen text-black">
      {/* 🔹 Верхняя панель */}
      <div className="flex justify-between flex-wrap gap-4 p-6 border-b-2 border-[#E5E9EF] text-xl items-center">
        {/* Поиск */}
        <input
          value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          placeholder="Search projects..."
          className="border-2 border-[#E5E9EF] py-3 rounded-4xl bg-[#FBFCFC] placeholder:text-[#6C7280] px-5 w-[500px] sm:w-full md:w-[500px]"
        />

        <div className="flex gap-3">
          <div className="flex xl:hidden">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="bg-[#EBEDF0] text-[#364154] px-4 py-2 rounded-xl shadow-sm hover:bg-[#E0E3E7] transition"
            >
              <img src="/src/assets/filter.png" className="w-7" />
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
              + New Project
            </button>
          )}
        </div>
      </div>

      {/* 🔹 Контент */}
      <div className="flex p-10 gap-10">
        {/* 🔹 Левая часть */}
        <div className="hidden xl:flex border-2 border-[#E5E9EF] rounded-3xl py-6 px-6 bg-[#FBFCFC] shadow-md flex-col gap-6 h-[70vh] sticky top-6 overflow-y-auto">
          <p className="text-2xl font-semibold mb-2">Filters</p>

          {/* Status */}
          <div>
            <label className="text-[#6C7280] text-lg font-medium">Status</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="mt-2 w-full border-2 border-[#E5E9EF] rounded-xl p-2 bg-white text-black"
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
              placeholder="Berkeley, CA"
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
            <span></span> Reset
          </button>
        </div>

        {/* Правая часть — проекты */}
        <div className="flex-1 overflow-y-auto">
          <p className="text-4xl font-semibold text-black">Projects</p>

          <div className="grid gap-6 mt-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {loadingProjects ? (
              Array.from({ length: 3 }).map((_, i) => (
                <SkeletonProjectCard key={i} />
              ))
            ) : currentProjects.length === 0 ? (
              <p className="col-span-full text-center text-gray-500 py-20">
                No projects found.
              </p>
            ) : (
              currentProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="bg-[#FBFCFC] border-2 border-[#E5E9EF] rounded-3xl p-6 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Заголовок и статус */}
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-2xl font-semibold">{proj.title}</h2>
                    <span
                      className={`text-sm px-3 py-1 rounded-xl ${
                        proj.status === "upcoming"
                          ? "bg-[#F1F5F9] text-black border border-[#E5E9EF]"
                          : proj.status === "ongoing"
                          ? "bg-[#F1F5F9] text-black border border-[#E5E9EF]"
                          : "bg-[#F1F5F9] text-black border border-[#E5E9EF]"
                      }`}
                    >
                      {proj.status.charAt(0).toUpperCase() +
                        proj.status.slice(1)}
                    </span>
                  </div>

                  {/* Автор */}
                  {proj.authorId && proj.authorName && (
                    <div
                      onClick={() => navigate(`/profile/${proj.authorId}`)}
                      className="flex flex-col cursor-pointer mb-3 hover:opacity-80 transition"
                    >
                      <span className="text-sm text-[#2663EB] font-medium">
                        {proj.authorName}
                      </span>

                      {proj.authorEmail && (
                        <span className="text-xs text-[#6C7280]">
                          {proj.authorEmail}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Описание */}
                  <p className="text-[#6C7280] mb-3">
                    {proj.description.length > 120
                      ? proj.description.substring(0, 120) + "..."
                      : proj.description}
                  </p>

                  {/* Формат и локация */}
                  <div className="flex items-center gap-3 text-[#6C7280] text-sm mb-4">
                    {proj.format && (
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

                  {/* Теги */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {Array.isArray(proj.tags) &&
                      proj.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="bg-[#3A3F47] text-white px-3 py-1 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                  </div>

                  {/* Количество заявок */}
                  <p className="text-[#6C7280] text-sm mb-4">
                    Applicants:{" "}
                    <span className="font-semibold">{proj.applicants}</span>
                  </p>

                  {/* Кнопки */}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => navigate(`/project/${proj.id}`)}
                      className="flex-1 border border-[#E5E9EF] rounded-xl px-4 py-2 hover:bg-[#F1F5F9]"
                    >
                      View
                    </button>

                    {renderJoinButton(proj)}
                  </div>

                  {/* Кнопка удаления для админов и менторов */}
                  {currentUser && currentUser.role && ["admin", "mentor"].includes(currentUser.role.toLowerCase()) && (
                    <button
                      onClick={async () => {
                        if (
                          window.confirm(
                            `Вы уверены, что хотите удалить проект "${proj.title}"? Это действие нельзя отменить.`
                          )
                        ) {
                          try {
                            console.log("=== DELETE PROJECT DEBUG ===");
                            console.log("Project ID:", proj.id);
                            console.log("Current User:", currentUser);
                            console.log("User Role:", currentUser?.role);
                            console.log("Token exists:", !!localStorage.getItem("token"));
                            
                            const response = await api.delete(`/projects/${proj.id}`);
                            console.log("✅ Delete successful:", response.status);
                            alert("Проект успешно удален");
                            // Обновляем список проектов
                            setProjects(projects.filter(p => p.id !== proj.id));
                          } catch (err: any) {
                            console.error("❌ DELETE ERROR:", err);
                            console.error("Status:", err.response?.status);
                            console.error("Data:", err.response?.data);
                            const errorMsg = err.response?.data?.detail || err.message || "Не удалось удалить проект";
                            alert(`Ошибка: ${errorMsg}\n\nПроверьте консоль (F12) для деталей.`);
                          }
                        }
                      }}
                      className="mt-2 w-full bg-red-500 text-white rounded-xl px-4 py-2 hover:bg-red-600 transition font-medium"
                    >
                      <i className="fa-solid fa-trash mr-2"></i>
                      Удалить проект
                    </button>
                  )}
                  {/* Отладочная информация */}
                  {currentUser && (
                    <div className="mt-1 text-xs text-gray-400">
                      Debug: Role={currentUser.role}, CanDelete={["admin", "mentor"].includes(currentUser.role?.toLowerCase())}
                    </div>
                  )}

                  {/* Управление заявками для автора */}
                  {currentUser &&
                  currentUser.id === proj.authorId &&
                  proj.applications?.length ? (
                    <div className="mt-4">
                      {proj.applications.map((app) => (
                        <div
                          key={app.id}
                          className="flex items-center justify-between mb-1"
                        >
                          <span>User ID: {app.applicant_id}</span>
                          <div className="flex gap-2">
                            {app.status === "pending" ? (
                              <>
                                <button
                                  onClick={() =>
                                    handleApplication(app.id, "approved")
                                  }
                                  className="px-2 py-1 bg-green-500 text-white rounded text-sm"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() =>
                                    handleApplication(app.id, "rejected")
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
                                {app.status.charAt(0).toUpperCase() +
                                  app.status.slice(1)}
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
          </div>

          {/* 🔹 Пагинация */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-8">
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

          {/* Форма добавления нового проекта */}
          <div ref={formRef}>
            {showForm && (
              <div className="bg-white p-6 rounded-xl shadow-md mt-6">
                <h2 className="text-xl font-bold mb-4">Создать проект</h2>
                <form
                  onSubmit={handleAddProject}
                  className="flex flex-col gap-4"
                >
                  <input
                    type="text"
                    placeholder="Название проекта"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="border p-2 rounded"
                  />
                  <textarea
                    placeholder="Описание проекта"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    className="border p-2 rounded"
                    rows={4}
                  />

                  <label className="text-sm font-medium">
                    Призы (необязательно)
                  </label>
                  <textarea
                    placeholder="Опишите призы и награды..."
                    value={projectPrize}
                    onChange={(e) => setProjectPrize(e.target.value)}
                    className="border p-2 rounded"
                    rows={2}
                  />

                  <label className="text-sm font-medium">
                    Дедлайн подачи заявок (необязательно)
                  </label>
                  <input
                    type="date"
                    value={projectDeadline}
                    onChange={(e) => setProjectDeadline(e.target.value)}
                    className="border p-2 rounded"
                  />

                  <input
                    type="text"
                    placeholder="Локация"
                    value={projectLocation}
                    onChange={(e) => setProjectLocation(e.target.value)}
                    className="border p-2 rounded"
                  />

                  <input
                    type="text"
                    placeholder="Теги через запятую"
                    value={projectTags}
                    onChange={(e) => setProjectTags(e.target.value)}
                    className="border p-2 rounded"
                  />

                  <select
                    value={projectFormat}
                    onChange={(e) => setProjectFormat(e.target.value)}
                    className="border p-2 rounded"
                  >
                    <option value="online">Online</option>
                    <option value="in-person">In-person</option>
                    <option value="hybrid">Hybrid</option>
                  </select>

                  <select
                    value={projectStatus}
                    onChange={(e) => setProjectStatus(e.target.value)}
                    className="border p-2 rounded"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="past">Past</option>
                  </select>

                  <label className="text-sm font-medium">
                    Максимальное количество участников (необязательно)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Например: 10"
                    value={projectMaxParticipants}
                    onChange={(e) => setProjectMaxParticipants(e.target.value)}
                    className="border p-2 rounded"
                  />

                  <label className="text-sm font-medium">Требуемые роли</label>
                  {requiredRoles.map((roleObj, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={roleObj.role}
                        onChange={(e) => {
                          const newRoles = [...requiredRoles];
                          newRoles[idx].role = e.target.value;
                          setRequiredRoles(newRoles);
                        }}
                        className="border p-2 rounded flex-1"
                      />
                      <input
                        type="number"
                        value={roleObj.count}
                        min={1}
                        onChange={(e) => {
                          const newRoles = [...requiredRoles];
                          newRoles[idx].count = Number(e.target.value);
                          setRequiredRoles(newRoles);
                        }}
                        className="border p-2 rounded w-20"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setRequiredRoles(
                            requiredRoles.filter((_, i) => i !== idx)
                          )
                        }
                        className="text-red-500"
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setRequiredRoles([
                        ...requiredRoles,
                        { role: "developer", count: 1 },
                      ])
                    }
                    className="text-blue-500"
                  >
                    Добавить роль
                  </button>
                  <button
                    type="submit"
                    className="bg-[#21B4D6] text-white py-2 px-4 rounded hover:bg-[#009FAF]"
                  >
                    Создать проект
                  </button>
                </form>
              </div>
            )}
          </div>
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
