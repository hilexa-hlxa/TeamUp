import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

type ApplicantStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "hold"
  | "withdrawn";

interface Applicant {
  id: number;
  name: string;
  avatar_url?: string | null;
  email?: string;
  role?: string;
  skills?: string[];
  project_id?: number;
  hackathon_id?: number;
  project_title?: string;
  applied_at?: string;
  status: ApplicantStatus;
  message?: string | null;
  type?: "project" | "hackathon";
  owner_id?: number;
}

interface ApplicantsPageProps {
  isOwner?: boolean;
  projectId?: number;
  applicantId?: string;
}

export default function ApplicantsPage({
  isOwner = false,
  projectId,
}: ApplicantsPageProps) {
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    role: "",
    status: "all",
    skill: "",
    search: "",
    dateRange: "all",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 8;
  const exportRef = useRef<HTMLButtonElement | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [isMobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newApplication, setNewApplication] = useState({
    type: "project" as "project" | "hackathon",
    target_id: "",
    message: "",
  });
  const [projects, setProjects] = useState<any[]>([]);
  const [hackathons, setHackathons] = useState<any[]>([]);
  type UserRole = "student" | "mentor" | "client" | "admin";

  const [currentUser, setCurrentUser] = useState<{
    role: UserRole;
  }>({ role: "student" });

  const isMentor = currentUser.role === "mentor";
  const isStudent = currentUser.role === "student";
  const isClient = currentUser.role === "client";

  useEffect(() => {
    const role = localStorage.getItem("role") as UserRole | null;
    if (role) {
      setCurrentUser({ role });
    }
  }, []);

  // Получаем список заявок
  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        let res;
        const role = localStorage.getItem("role"); // получаем роль текущего пользователя

        if (projectId) {
          // Исправлено: используем правильный endpoint с query параметрами
          res = await api.get(
            `/applications?type=project&target_id=${projectId}`
          );
        } else if (
          role === "student" ||
          role === "mentor" ||
          role === "customer"
        ) {
          res = await api.get(`/applications`);
        } else {
          // владельцы видят все заявки
          res = await api.get(`/applications`);
        }

        if (Array.isArray(res.data)) {
          setApplicants(res.data);
        } else if (Array.isArray(res.data.items)) {
          // Fallback для старого формата
          setApplicants(res.data.items);
        } else {
          console.error("Некорректный формат данных с сервера", res.data);
          setApplicants([]);
        }
      } catch (err: any) {
        console.error("Ошибка запроса к серверу:", err.response || err);
        alert("Не удалось загрузить данные с сервера.");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [projectId]);

  // Загружаем проекты и хакатоны для формы создания заявки
  useEffect(() => {
    const fetchProjectsAndHackathons = async () => {
      try {
        const [projectsRes, hackathonsRes] = await Promise.all([
          api.get("/projects"),
          api.get("/hackathons"),
        ]);
        setProjects(projectsRes.data);
        setHackathons(hackathonsRes.data);
      } catch (err) {
        console.error("Ошибка загрузки проектов/хакатонов:", err);
      }
    };
    fetchProjectsAndHackathons();
  }, []);

  // Фильтрация
  const filtered = useMemo(() => {
    return applicants.filter((a) => {
      if (filter.status !== "all" && a.status !== filter.status) return false;
      if (
        filter.role &&
        a.role &&
        !a.role.toLowerCase().includes(filter.role.toLowerCase())
      )
        return false;
      if (
        filter.skill &&
        a.skills &&
        !a.skills.some((s) =>
          s.toLowerCase().includes(filter.skill.toLowerCase())
        )
      )
        return false;
      if (filter.dateRange !== "all" && a.applied_at) {
        const days = parseInt(filter.dateRange);
        const appliedDate = new Date(a.applied_at);
        const now = new Date();
        const diffDays =
          (now.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > days) return false;
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        const inName = a.name?.toLowerCase().includes(q);
        const inEmail = a.email?.toLowerCase().includes(q);
        const inProject = a.project_title?.toLowerCase().includes(q);
        const inSkills = a.skills?.some((s) => s.toLowerCase().includes(q));
        if (!(inName || inEmail || inProject || inSkills)) return false;
      }
      return true;
    });
  }, [applicants, filter]);

  // Сортировка
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      return sortBy === "newest"
        ? new Date(b.applied_at ?? 0).getTime() -
            new Date(a.applied_at ?? 0).getTime()
        : new Date(a.applied_at ?? 0).getTime() -
            new Date(b.applied_at ?? 0).getTime();
    });
  }, [filtered, sortBy]);

  const totalPages = Math.ceil(sorted.length / perPage);
  const pageData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    const end = currentPage * perPage;
    return sorted.slice(start, end);
  }, [sorted, currentPage, perPage]);

  useEffect(() => setCurrentPage(1), [filter]);
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages || 1);
  }, [totalPages]);

  // Обновление статуса заявки
  const updateStatus = async (appId: number, newStatus: ApplicantStatus) => {
    const prev = [...applicants];
    setApplicants((s) =>
      s.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );

    try {
      if (newStatus === "approved") {
        await api.post(`/applications/${appId}/approve`);
      } else if (newStatus === "rejected") {
        await api.post(`/applications/${appId}/reject`);
      } else {
        console.warn(
          `Статус "${newStatus}" не поддерживается. Используйте approve или reject.`
        );
        setApplicants(prev);
        alert("Можно изменить статус только на 'approved' или 'rejected'.");
        return;
      }
    } catch (err) {
      console.error("Update status failed:", err);
      setApplicants(prev);
      alert("Не удалось обновить статус.");
    }
  };

  const handleApprove = (id: number) => updateStatus(id, "approved");
  const handleReject = (id: number) => {
    if (!confirm("Вы уверены, что хотите отклонить заявку?")) return;
    updateStatus(id, "rejected");
  };

  // Создание новой заявки
  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newApplication.target_id) {
      alert("Пожалуйста, выберите проект или хакатон");
      return;
    }

    try {
      const response = await api.post("/applications", {
        type: newApplication.type,
        target_id: parseInt(newApplication.target_id),
        message: newApplication.message || "Хочу присоединиться",
      });

      // Обновляем список заявок
      setApplicants((prev) => [response.data, ...prev]);

      // Сбрасываем форму
      setNewApplication({
        type: "project",
        target_id: "",
        message: "",
      });
      setShowCreateForm(false);

      alert("Заявка успешно создана!");
    } catch (err: any) {
      console.error("Ошибка создания заявки:", err);
      alert(
        "Не удалось создать заявку: " +
          (err.response?.data?.detail || err.message)
      );
    }
  };

  // Экспорт CSV
  const exportCSV = () => {
    if (!filtered.length) return alert("Нет заявок для экспорта");
    const header = ["role", "project", "applied_at", "status", "skills"];
    const rows = filtered.map((a) => [
      a.role,
      a.project_title,
      a.applied_at,
      a.status,
      (a.skills || []).join(";"),
    ]);
    const csvContent = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applications_${new Date().toISOString().slice(0, 19)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen text-black">
      {/* Верхняя панель */}
      <div className="flex justify-between flex-wrap gap-4 p-6 border-b-2 border-[#E5E9EF] text-xl items-center">
        <input
          type="text"
          value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          placeholder="Search projects, hackathons..."
          className="border-2 border-[#E5E9EF] py-3 rounded-4xl bg-[#FBFCFC] placeholder:text-[#6C7280] px-5 w-[500px] sm:w-full md:w-[500px]"
        />
        {(isStudent || isClient) && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-[#21B4D6] text-white px-6 py-3 rounded-xl hover:bg-[#009FAF]"
          >
            + Создать заявку
          </button>
        )}
      </div>

      {/* Модальное окно создания заявки */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-2xl shadow-xl">
            <h2 className="text-2xl font-semibold mb-6">
              Создать новую заявку
            </h2>
            <form
              onSubmit={handleCreateApplication}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="block text-lg font-medium mb-2">Тип</label>
                <select
                  value={newApplication.type}
                  onChange={(e) =>
                    setNewApplication({
                      ...newApplication,
                      type: e.target.value as "project" | "hackathon",
                      target_id: "",
                    })
                  }
                  className="w-full border-2 border-[#E5E9EF] rounded-xl p-3"
                >
                  <option value="project">Проект</option>
                  <option value="hackathon">Хакатон</option>
                </select>
              </div>

              <div>
                <label className="block text-lg font-medium mb-2">
                  {newApplication.type === "project" ? "Проект" : "Хакатон"}
                </label>
                <select
                  value={newApplication.target_id}
                  onChange={(e) =>
                    setNewApplication({
                      ...newApplication,
                      target_id: e.target.value,
                    })
                  }
                  className="w-full border-2 border-[#E5E9EF] rounded-xl p-3"
                  required
                >
                  <option value="">
                    Выберите{" "}
                    {newApplication.type === "project" ? "проект" : "хакатон"}
                  </option>
                  {(newApplication.type === "project"
                    ? projects
                    : hackathons
                  ).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-lg font-medium mb-2">
                  Сообщение (необязательно)
                </label>
                <textarea
                  value={newApplication.message}
                  onChange={(e) =>
                    setNewApplication({
                      ...newApplication,
                      message: e.target.value,
                    })
                  }
                  placeholder="Расскажите о себе и почему вы хотите присоединиться..."
                  className="w-full border-2 border-[#E5E9EF] rounded-xl p-3"
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewApplication({
                      type: "project",
                      target_id: "",
                      message: "",
                    });
                  }}
                  className="px-6 py-2 rounded-xl bg-gray-200 hover:bg-gray-300"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl text-white bg-[#21B4D6] hover:bg-[#009FAF]"
                >
                  Создать заявку
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Контент */}
      <div className="flex gap-10 p-10">
        {/* Filters */}
        <div className="hidden xl:flex border-2 border-[#E5E9EF] rounded-3xl py-6 px-6 bg-[#FBFCFC] shadow-md flex-col gap-6 h-[70vh] w-[17vw] sticky top-6 overflow-y-auto">
          <p className="text-2xl font-semibold mb-2">Filters</p>

          <div className="mb-5">
            <label className="block text-lg font-medium text-[#6C7280] mb-1">
              Role
            </label>
            <input
              type="text"
              value={filter.role}
              onChange={(e) => setFilter({ ...filter, role: e.target.value })}
              placeholder="Frontend / Designer / PM"
              className=" w-full border-2 border-[#E5E9EF] rounded-xl p-2 placeholder:text-[#6C7280]"
            />
          </div>

          <div className="mb-5">
            <label className="block text-lg font-medium text-[#6C7280] mb-1">
              Status
            </label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full border-2 border-[#E5E9EF] rounded-xl p-2"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="hold">Hold</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>

          <div className="mb-5">
            <label className="block text-lg font-medium text-[#6C7280] mb-1">
              Skill
            </label>
            <input
              type="text"
              value={filter.skill}
              onChange={(e) => setFilter({ ...filter, skill: e.target.value })}
              placeholder="React, Python..."
              className="w-full border-2 border-[#E5E9EF] rounded-xl p-2 placeholder:text-[#6C7280]"
            />
          </div>

          <div className="mb-5">
            <label className="block text-lg font-medium text-[#6C7280] mb-1">
              Submitted
            </label>
            <select
              value={filter.dateRange}
              onChange={(e) =>
                setFilter({ ...filter, dateRange: e.target.value })
              }
              className="w-full border-2 border-[#E5E9EF] rounded-xl p-2"
            >
              <option value="all">All time</option>
              <option value="30">Last 30 days</option>
              <option value="14">Last 14 days</option>
              <option value="7">Last 7 days</option>
            </select>
          </div>

          <button
            onClick={() =>
              setFilter({
                role: "",
                status: "all",
                skill: "",
                search: "",
                dateRange: "all",
              })
            }
            className="w-full mt-4 border text-[#6C7280] border-gray-300 rounded-xl py-2 hover:bg-gray-100"
          >
            Reset
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4 sm:gap-0">
            <h1 className="text-4xl sm:text-4xl font-semibold text-black">
              Applicants
            </h1>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Мобильная кнопка фильтра */}
              <div className="flex xl:hidden">
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="bg-[#EBEDF0] text-[#364154] px-3 py-2 rounded-xl shadow-sm hover:bg-[#E0E3E7] transition flex items-center justify-center"
                  aria-label="Open filters"
                >
                  <img
                    src="/src/assets/filter.png"
                    className="w-6 h-6"
                    alt="filter"
                  />
                </button>
              </div>

              {/* Export CSV */}
              <button
                ref={exportRef}
                onClick={exportCSV}
                className="flex-1 sm:flex-none text-lg sm:text-base border border-gray-300 rounded-xl px-3 py-2 hover:bg-gray-100 transition text-center"
              >
                Export
              </button>

              {/* Сортировка */}
              <div className="flex gap-2 sm:gap-3 flex-wrap">
                <button
                  onClick={() => setSortBy("newest")}
                  className={`px-3 py-2 sm:px-4 sm:py-2 rounded-xl border text-lg sm:text-base transition flex items-center justify-center ${
                    sortBy === "newest"
                      ? "bg-[#21B4D6] text-white border-[#009FAF]"
                      : "border-gray-300"
                  }`}
                >
                  Newest
                </button>

                <button
                  onClick={() => setSortBy("oldest")}
                  className={`px-3 py-2 sm:px-4 sm:py-2 rounded-xl border text-lg sm:text-base transition flex items-center justify-center ${
                    sortBy === "oldest"
                      ? "bg-[#21B4D6] text-white border-[#009FAF]"
                      : "border-gray-300"
                  }`}
                >
                  Oldest
                </button>
              </div>
            </div>
          </div>

          <main className="flex-1 overflow-x-auto bg-[#FBFCFC] border-2 border-[#E5E9EF] rounded-2xl">
            {loading ? (
              <p className="p-4">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="text-gray-500 p-4">No applicants found.</p>
            ) : (
              <table className="min-w-full text-xl">
                <thead className="bg-gray-50 text-[#6C7280] font-medium">
                  <tr>
                    <td className="px-4 py-5 text-left">Projects</td>
                    <td className="px-4 py-5 text-left">Role</td>
                    <td className="px-4 py-5 text-left">Submitted</td>
                    <td className="px-4 py-5 text-left">Status</td>
                    <td className="px-4 py-5 text-left">Actions</td>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((a) => (
                    <tr
                      key={a.id}
                      className="border-t border-[#E5E9EF] hover:bg-gray-50"
                    >
                      <td className="px-5 py-5">
                        <p className="bg-[#3A3F47] text-white rounded-full px-5 py-2 inline-block">
                          {a.project_title}
                        </p>
                      </td>
                      <td className="px-4 py-4">{a.role}</td>
                      <td className="px-4 py-4">
                        {a.applied_at
                          ? new Date(a.applied_at).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-4 py-4">
                        <StatusChip status={a.status} />
                      </td>
                      <td className="px-4 py-4 flex gap-2 flex-wrap">
                        {/* VIEW — ВИДЯТ ВСЕ */}
                        <button
                          onClick={() => {
                            if (a.type === "project" && a.project_id) {
                              navigate(`/project/${a.project_id}`);
                            } else if (
                              a.type === "hackathon" &&
                              a.hackathon_id
                            ) {
                              navigate(`/hackathon/${a.hackathon_id}`);
                            }
                          }}
                          className="text-black border border-[#E5E9EF] rounded-xl px-4 py-2 hover:bg-[#F1F5F9] transition flex items-center gap-2"
                        >
                          <i className="fa-solid fa-eye"></i>
                          View
                        </button>

                        {/* OWNER ACTIONS */}
                        {isOwner && a.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(a.id)}
                              className="bg-green-600 text-white rounded-xl px-4 py-2 hover:bg-green-700 transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(a.id)}
                              className="bg-red-500 text-white rounded-xl px-4 py-2 hover:bg-red-600 transition"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {/* STUDENT / CLIENT */}
                        {(isStudent || isClient) && !isOwner && !isMentor && (
                          <>
                            {a.status === "pending" && (
                              <button
                                onClick={() => updateStatus(a.id, "withdrawn")}
                                className="bg-[#21B4D6] text-white rounded-xl px-4 py-2"
                              >
                                Withdraw
                              </button>
                            )}

                            {a.status === "approved" && a.project_id && (
                              <button
                                onClick={() =>
                                  navigate(`/workspace/${a.project_id}`)
                                }
                                className="border border-[#E5E9EF] rounded-xl px-4 py-2"
                              >
                                Open Workspace
                              </button>
                            )}
                          </>
                        )}

                        {/* MENTOR — НИКАКИХ ДЕЙСТВИЙ */}
                        {isMentor && (
                          <span className="text-[#6C7280] text-sm italic">
                            Mentor view only
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {isMobileFilterOpen && (
              <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50 lg:flex xl:hidden">
                <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl overflow-y-auto max-h-[90vh] relative">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800">
                      Filters
                    </h2>
                    <button
                      onClick={() => setMobileFilterOpen(false)}
                      className="text-gray-600 text-2xl hover:text-gray-900 transition"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-col gap-4">
                    {/* Role */}
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-600 font-medium text-base">
                        Role
                      </label>
                      <input
                        type="text"
                        placeholder="Frontend / Designer / PM"
                        className="p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
                        value={filter.role}
                        onChange={(e) =>
                          setFilter({
                            ...filter,
                            role: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Status */}
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-600 font-medium text-base">
                        Status
                      </label>
                      <select
                        className="p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
                        value={filter.status}
                        onChange={(e) =>
                          setFilter({
                            ...filter,
                            status: e.target.value,
                          })
                        }
                      >
                        <option value="all">All</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Accepted</option>
                        <option value="rejected">Rejected</option>
                        <option value="hold">Hold</option>
                        <option value="withdrawn">Withdrawn</option>
                      </select>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-600 font-medium text-base">
                        Skill
                      </label>
                      <input
                        type="text"
                        placeholder="React, Python..."
                        className="p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
                        value={filter.skill}
                        onChange={(e) =>
                          setFilter({
                            ...filter,
                            skill: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Date Range */}
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-600 font-medium text-base">
                        Submitted
                      </label>
                      <select
                        className="p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
                        value={filter.dateRange}
                        onChange={(e) =>
                          setFilter({
                            ...filter,
                            dateRange: e.target.value,
                          })
                        }
                      >
                        <option value="all">All time</option>
                        <option value="30">Last 30 days</option>
                        <option value="14">Last 14 days</option>
                        <option value="7">Last 7 days</option>
                      </select>
                    </div>

                    {/* Search */}
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-600 font-medium text-base">
                        Search
                      </label>
                      <input
                        type="text"
                        placeholder="Projects, hackathons..."
                        className="p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
                        value={filter.search}
                        onChange={(e) =>
                          setFilter({
                            ...filter,
                            search: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-between mt-8">
                      <button
                        onClick={() => setMobileFilterOpen(false)}
                        className="border border-gray-300 px-4 py-2 rounded-xl hover:bg-gray-100"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() =>
                          setFilter({
                            role: "",
                            status: "all",
                            skill: "",
                            search: "",
                            dateRange: "all",
                          })
                        }
                        className="bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4 mb-5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded-xl disabled:text-gray-400 disabled:border-gray-200 hover:bg-gray-100"
                >
                  ←
                </button>

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

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded-xl disabled:text-gray-400 disabled:border-gray-200 hover:bg-gray-100"
                >
                  →
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: ApplicantStatus }) {
  const map: Record<
    ApplicantStatus,
    { label: string; classes: string; icon: React.ReactNode }
  > = {
    pending: {
      label: "Pending",
      classes:
        "flex items-center gap-2 text-black text-lg bg-[#F1F5F9] px-4 py-1 rounded-xl border-2 border-[#E5E9EF]",
      icon: <i className="fa-solid fa-clock text-black"></i>,
    },
    approved: {
      label: "Accepted",
      classes:
        "flex items-center gap-2 text-black text-lg bg-[#F1F5F9] px-4 py-1 rounded-xl border-2 border-[#E5E9EF]",
      icon: <i className="fa-solid fa-check-circle text-black"></i>,
    },
    rejected: {
      label: "Rejected",
      classes:
        "flex items-center gap-2 text-black text-lg bg-[#F1F5F9] px-4 py-1 rounded-xl border-2 border-[#E5E9EF]",
      icon: <i className="fa-solid fa-times-circle text-black"></i>,
    },
    hold: {
      label: "Hold",
      classes:
        "flex items-center gap-2 text-black text-lg bg-[#F1F5F9] px-4 py-1 rounded-xl border-2 border-[#E5E9EF]",
      icon: <i className="fa-solid fa-pause text-yellow-600"></i>,
    },
    withdrawn: {
      label: "Withdrawn",
      classes:
        "flex items-center gap-2 text-black text-lg bg-[#F1F5F9] px-4 py-1 rounded-xl border-2 border-[#E5E9EF]",
      icon: <i className="fa-solid fa-rotate text-black"></i>,
    },
  };

  const info = map[status];
  return (
    <span className={info.classes}>
      {info.icon}
      {info.label}
    </span>
  );
}
