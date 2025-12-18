import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getUserProfile } from "../api/axios";

type Role = "student" | "customer" | "mentor" | "admin";
type Status = "pending" | "approved" | "rejected";

interface Project {
  id: number;
  title: string;
  description?: string;
  status?: string;
}


interface Application {
  id: number;
  type: "project" | "hackathon";
  target_id: number;
  status: Status;
  created_at: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  avatar_url?: string;
  skills: string[];
  bio?: string;
}

interface UserProjects {
  created: Project[];
  memberships: Project[];
  applications: Application[];
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [userProjects, setUserProjects] = useState<UserProjects>({
    created: [],
    memberships: [],
    applications: [],
  });
  const [loading, setLoading] = useState(true);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editedBio, setEditedBio] = useState("");
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [editedSkills, setEditedSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/");
          return;
        }

        // Получаем профиль пользователя
        const userRes = await getUserProfile();
        setUser(userRes);
        setEditedBio(userRes.bio || "");
        setEditedSkills(userRes.skills || []);

        // Получаем проекты пользователя
        const projectsRes = await api.get("/projects");
        const allProjects: Project[] = projectsRes.data;
        const created = allProjects.filter(
          (p: any) => p.created_by === userRes.id
        );

        // Получаем memberships
        const membershipsRes = await api.get(`/memberships/user/${userRes.id}`);
        const memberships: any[] = membershipsRes.data;
        const membershipProjectIds = memberships
          .filter((m) => m.status === "active")
          .map((m) => m.project_id);
        const membershipProjects = allProjects.filter((p) =>
          membershipProjectIds.includes(p.id)
        );

        // Получаем заявки
        const applicationsRes = await api.get("/applications");
        const applications: Application[] = applicationsRes.data;

        setUserProjects({
          created,
          memberships: membershipProjects,
          applications,
        });
      } catch (err: any) {
        console.error("Ошибка загрузки профиля:", err);
        if (err.response?.status === 401) {
          navigate("/");
        } else {
          alert("Не удалось загрузить профиль.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleSaveBio = async () => {
    if (!user) return;
    try {
      await api.patch(`/users/me`, { bio: editedBio });
      setUser({ ...user, bio: editedBio });
      setIsEditingBio(false);
    } catch (err) {
      console.error("Ошибка сохранения биографии:", err);
      alert("Не удалось сохранить биографию.");
    }
  };

  const handleSaveSkills = async () => {
    if (!user) return;
    try {
      await api.patch(`/users/me`, { skills: editedSkills });
      setUser({ ...user, skills: editedSkills });
      setIsEditingSkills(false);
    } catch (err) {
      console.error("Ошибка сохранения навыков:", err);
      alert("Не удалось сохранить навыки.");
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !editedSkills.includes(newSkill.trim())) {
      setEditedSkills([...editedSkills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setEditedSkills(editedSkills.filter((skill) => skill !== skillToRemove));
  };

  const handleDeleteProject = async (projectId: number) => {
    const confirmed = window.confirm(
      "Вы уверены, что хотите удалить этот проект? Это действие необратимо."
    );
    if (!confirmed) return;

    try {
      await api.delete(`/projects/${projectId}`);

      setUserProjects((prev) => ({
        ...prev,
        created: prev.created.filter((p) => p.id !== projectId),
      }));
    } catch (err) {
      console.error("Ошибка удаления проекта:", err);
      alert("Не удалось удалить проект.");
    }
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen text-black">
        <p className="text-lg">Загрузка профиля...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 min-h-screen text-black">
        <p className="text-lg">Профиль не найден.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 min-h-screen bg-[#F6F8FA] text-black">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-[#FBFCFC] border-2 border-[#E5E9EF] rounded-3xl p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <img
              src={user.avatar_url || "https://i.pravatar.cc/150?img=1"}
              alt="Avatar"
              className="w-20 h-20 rounded-full border-2 border-[#E5E9EF]"
            />
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-semibold mb-2">
                {user.name}
              </h1>
              <p className="text-[#6C7280] text-lg mb-1">{user.email}</p>
              <span className="inline-block bg-blue-100 text-[#2663EB] px-3 py-1 rounded-full text-sm capitalize">
                {user.role}
              </span>
            </div>
          </div>

          {/* Bio Section */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold">О себе</h2>
              <button
                onClick={() => setIsEditingBio(!isEditingBio)}
                className="text-[#2663EB] hover:underline text-sm"
              >
                {isEditingBio ? "Отмена" : "Редактировать"}
              </button>
            </div>
            {isEditingBio ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  className="w-full p-2 border border-[#E5E9EF] rounded-md bg-transparent"
                  rows={4}
                  placeholder="Расскажите о себе..."
                />
                <button
                  onClick={handleSaveBio}
                  className="bg-[#21B4D6] hover:bg-[#009FAF] text-white px-4 py-2 rounded-xl text-sm self-end"
                >
                  Сохранить
                </button>
              </div>
            ) : (
              <p className="text-[#6C7280]">
                {user.bio || "Информация о себе отсутствует."}
              </p>
            )}
          </div>

          {/* Skills Section */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold">Навыки</h2>
              <button
                onClick={() => setIsEditingSkills(!isEditingSkills)}
                className="text-[#2663EB] hover:underline text-sm"
              >
                {isEditingSkills ? "Отмена" : "Редактировать"}
              </button>
            </div>
            {isEditingSkills ? (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2 mb-2">
                  {editedSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-[#F6F8FA] border border-[#E5E9EF] px-3 py-1 rounded-xl text-sm flex items-center gap-2"
                    >
                      {skill}
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-red-500 hover:text-red-700"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    placeholder="Добавить навык"
                    className="flex-1 p-2 border border-[#E5E9EF] rounded-md bg-transparent"
                  />
                  <button
                    onClick={handleAddSkill}
                    className="bg-[#21B4D6] hover:bg-[#009FAF] text-white px-4 py-2 rounded-xl text-sm"
                  >
                    Добавить
                  </button>
                </div>
                <button
                  onClick={handleSaveSkills}
                  className="bg-[#21B4D6] hover:bg-[#009FAF] text-white px-4 py-2 rounded-xl text-sm self-end mt-2"
                >
                  Сохранить навыки
                </button>
              </div>
            ) : user.skills && user.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-[#F6F8FA] border border-[#E5E9EF] px-3 py-1 rounded-xl text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[#6C7280]">Навыки не указаны.</p>
            )}
          </div>
        </div>

        {/* Created Projects */}
        {userProjects.created.length > 0 && (
          <div className="bg-[#FBFCFC] border-2 border-[#E5E9EF] rounded-3xl p-6 md:p-8 mb-6">
            <h2 className="text-xl md:text-2xl font-semibold mb-4">
              Мои проекты
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userProjects.created.map((project) => (
                <div
                  key={project.id}
                  className="border-2 border-[#E5E9EF] rounded-xl p-4 hover:bg-[#F6F8FA] transition"
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => navigate(`/project/${project.id}`)}
                  >
                    <h3 className="font-semibold text-lg mb-2">
                      {project.title}
                    </h3>
                    {project.description && (
                      <p className="text-[#6C7280] text-sm line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    {project.status && (
                      <span className="inline-block mt-2 text-xs text-[#6C7280]">
                        Статус: {project.status}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => navigate(`/workspace/${project.id}`)}
                      className="flex-1 bg-[#21B4D6] hover:bg-[#009FAF] text-white px-4 py-2 rounded-xl transition text-sm"
                    >
                      Открыть workspace
                    </button>

                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="px-3 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm"
                      title="Удалить проект"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Memberships */}
        {userProjects.memberships.length > 0 && (
          <div className="bg-[#FBFCFC] border-2 border-[#E5E9EF] rounded-3xl p-6 md:p-8 mb-6">
            <h2 className="text-xl md:text-2xl font-semibold mb-4">
              Участвую в проектах
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userProjects.memberships.map((project) => (
                <div
                  key={project.id}
                  className="border-2 border-[#E5E9EF] rounded-xl p-4 cursor-pointer hover:bg-[#F6F8FA] transition"
                  onClick={() => navigate(`/workspace/${project.id}`)}
                >
                  <h3 className="font-semibold text-lg mb-2">
                    {project.title}
                  </h3>
                  {project.description && (
                    <p className="text-[#6C7280] text-sm line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <span className="inline-block mt-2 text-xs text-[#21B4D6]">
                    Открыть workspace →
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Applications */}
        {userProjects.applications.length > 0 && (
          <div className="bg-[#FBFCFC] border-2 border-[#E5E9EF] rounded-3xl p-6 md:p-8 mb-6">
            <h2 className="text-xl md:text-2xl font-semibold mb-4">
              Мои заявки
            </h2>
            <div className="space-y-3">
              {userProjects.applications.map((app) => {
                const statusColors = {
                  pending: "bg-yellow-100 text-yellow-800",
                  approved: "bg-green-100 text-green-800",
                  rejected: "bg-red-100 text-red-800",
                };
                return (
                  <div
                    key={app.id}
                    className="border-2 border-[#E5E9EF] rounded-xl p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold capitalize">
                        {app.type} #{app.target_id}
                      </p>
                      <p className="text-sm text-[#6C7280]">
                        {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        statusColors[app.status] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {userProjects.created.length === 0 &&
          userProjects.memberships.length === 0 &&
          userProjects.applications.length === 0 && (
            <div className="bg-[#FBFCFC] border-2 border-[#E5E9EF] rounded-3xl p-8 text-center">
              <p className="text-[#6C7280] text-lg">
                У вас пока нет проектов или заявок.
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
