import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getUserProfile } from "../api/axios";

interface Project {
  id: number;
  title: string;
  description?: string;
  type: "project" | "hackathon";
  created_by?: number;
}

interface Membership {
  id: number;
  project_id: number;
  user_id: number;
  role_in_team: string;
  status: "active" | "invited";
}

export default function WorkspaceSelectPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [accessibleProjects, setAccessibleProjects] = useState<Project[]>([]);
  const [accessibleHackathons, setAccessibleHackathons] = useState<Project[]>([]);

  useEffect(() => {
    const fetchAccessibleWorkspaces = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/");
          return;
        }

        const userRes = await getUserProfile();
        setUser(userRes);

        // Fetch all projects and hackathons
        const [projectsRes, hackathonsRes, membershipsRes] = await Promise.all([
          api.get("/projects"),
          api.get("/hackathons"),
          api.get(`/memberships/user/${userRes.id}`),
        ]);

        const allProjects: Project[] = projectsRes.data.map((p: any) => ({
          ...p,
          type: "project" as const,
        }));
        const allHackathons: Project[] = hackathonsRes.data.map((h: any) => ({
          ...h,
          type: "hackathon" as const,
        }));
        const userMemberships: Membership[] = membershipsRes.data;

        // Find created projects and hackathons
        const createdProjects = allProjects.filter(
          (p) => p.created_by === userRes.id
        );
        const createdHackathons = allHackathons.filter(
          (h) => h.created_by === userRes.id
        );

        // Find joined projects (active memberships)
        const joinedProjects = allProjects.filter((p) =>
          userMemberships.some(
            (m) => m.project_id === p.id && m.status === "active"
          )
        );

        // For hackathons, check if user is a participant
        // Note: We'll need to check hackathon participants separately
        // For now, we'll only show created hackathons
        const joinedHackathons: Project[] = [];

        // Combine and remove duplicates
        const uniqueAccessibleProjects = Array.from(
          new Set([...createdProjects, ...joinedProjects].map((p) => p.id))
        ).map(
          (id) =>
            [...createdProjects, ...joinedProjects].find((p) => p.id === id)!
        );

        const uniqueAccessibleHackathons = Array.from(
          new Set([...createdHackathons, ...joinedHackathons].map((h) => h.id))
        ).map(
          (id) =>
            [...createdHackathons, ...joinedHackathons].find((h) => h.id === id)!
        );

        setAccessibleProjects(uniqueAccessibleProjects);
        setAccessibleHackathons(uniqueAccessibleHackathons);
      } catch (err: any) {
        console.error("Ошибка загрузки доступных workspace:", err);
        if (err.response?.status === 401) {
          navigate("/");
        } else {
          alert("Не удалось загрузить доступные workspace.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAccessibleWorkspaces();
  }, [navigate]);

  if (loading) {
    return (
      <div className="p-6 min-h-screen text-black">
        <p className="text-lg">Загрузка доступных workspace...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 min-h-screen text-black">
        <p className="text-lg">Пользователь не найден.</p>
      </div>
    );
  }

  const allWorkspaces = [...accessibleProjects, ...accessibleHackathons];

  return (
    <div className="p-6 md:p-10 min-h-screen bg-[#F6F8FA] text-black">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-[#1E293B]">
          Мои Workspace
        </h1>

        {allWorkspaces.length === 0 ? (
          <div className="bg-[#FBFCFC] border-2 border-[#E5E9EF] rounded-3xl p-8 text-center">
            <p className="text-[#6C7280] text-lg">
              У вас пока нет доступных workspace. Создайте проект или
              присоединитесь к существующему.
            </p>
            <button
              onClick={() => navigate("/projects")}
              className="mt-6 bg-[#21B4D6] hover:bg-[#009FAF] text-white px-6 py-3 rounded-xl transition text-lg"
            >
              Найти проекты
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allWorkspaces.map((item) => (
              <div
                key={item.id}
                className="bg-[#FBFCFC] border-2 border-[#E5E9EF] rounded-3xl p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
                onClick={() => navigate(`/workspace/${item.id}`)}
              >
                <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
                <p className="text-[#6C7280] text-sm line-clamp-2 mb-3">
                  {item.description || "Без описания."}
                </p>
                <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs capitalize">
                  {item.type === "project" ? "Проект" : "Хакатон"}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/workspace/${item.id}`);
                  }}
                  className="mt-4 w-full bg-[#21B4D6] hover:bg-[#009FAF] text-white px-4 py-2 rounded-xl transition text-sm"
                >
                  Открыть Workspace
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

