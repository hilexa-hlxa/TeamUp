import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api, { getUserProfile } from "../api/axios";

interface Task {
  id: number;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  assignee_id?: number;
  assignee_name?: string;
  created_at: string;
}

interface Member {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  role_in_team: string;
  status: "active" | "invited";
}

interface Project {
  id: number;
  title: string;
  description: string;
  status: string;
  created_by: number;
}

interface CurrentUser {
  id: number;
  name: string;
  email: string;
}

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"tasks" | "members">("tasks");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");

  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!id) return;

      try {
        // Проверяем авторизацию
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Необходима авторизация");
          navigate("/");
          return;
        }

        // Загружаем текущего пользователя
        let user: CurrentUser;
        try {
          user = await getUserProfile();
          setCurrentUser(user);
        } catch (err) {
          alert("Не удалось загрузить профиль пользователя");
          navigate("/");
          return;
        }

        // Загружаем данные проекта
        const [projectRes, tasksRes, membersRes] = await Promise.all([
          api.get(`/projects/${id}`),
          api.get(`/tasks/project/${id}`),
          api.get(`/memberships/project/${id}`),
        ]);

        const projectData = projectRes.data;
        setProject(projectData);

        // Проверяем доступ: создатель или активный участник
        const isCreator = projectData.created_by === user.id;
        const allMembers: Member[] = membersRes.data;
        const activeMembership = allMembers.find(
          (m) => m.user_id === user.id && m.status === "active"
        );
        const hasAccessToWorkspace = isCreator || !!activeMembership;

        if (!hasAccessToWorkspace) {
          setHasAccess(false);
          setLoading(false);
          return;
        }

        setHasAccess(true);

        // Загружаем имена пользователей для задач
        const tasksData: Task[] = tasksRes.data;
        const tasksWithNames = await Promise.all(
          tasksData.map(async (task) => {
            if (task.assignee_id) {
              try {
                const userRes = await api.get(`/users/${task.assignee_id}`);
                return {
                  ...task,
                  assignee_name: userRes.data.name,
                };
              } catch {
                return task;
              }
            }
            return task;
          })
        );
        setTasks(tasksWithNames);

        // Загружаем имена пользователей для участников
        const membersData: Member[] = membersRes.data;
        const membersWithNames = await Promise.all(
          membersData.map(async (member) => {
            try {
              const userRes = await api.get(`/users/${member.user_id}`);
              return {
                ...member,
                user_name: userRes.data.name,
                user_email: userRes.data.email,
              };
            } catch {
              return member;
            }
          })
        );
        setMembers(membersWithNames.filter((m) => m.status === "active"));
      } catch (err: any) {
        console.error("Ошибка загрузки workspace:", err);
        if (err.response?.status === 404) {
          alert("Проект не найден");
          navigate("/projects");
        } else if (err.response?.status === 401) {
          alert("Необходима авторизация");
          navigate("/");
        } else {
          alert("Не удалось загрузить workspace");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspace();
  }, [id, navigate]);

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !id) return;

    try {
      const res = await api.post("/tasks", {
        project_id: parseInt(id),
        title: newTaskTitle,
        description: newTaskDescription || null,
        status: "todo",
      });

      setTasks([...tasks, res.data]);
      setNewTaskTitle("");
      setNewTaskDescription("");
    } catch (err: any) {
      console.error("Ошибка создания задачи:", err);
      alert("Не удалось создать задачу");
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      const res = await api.patch(`/tasks/${taskId}`, {
        status: newStatus,
      });

      setTasks(tasks.map((t) => (t.id === taskId ? res.data : t)));
    } catch (err: any) {
      console.error("Ошибка обновления задачи:", err);
      alert("Не удалось обновить задачу");
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Удалить задачу?")) return;

    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch (err: any) {
      console.error("Ошибка удаления задачи:", err);
      alert("Не удалось удалить задачу");
    }
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-[#F6F8FA] text-black">
        <p className="text-lg">Загрузка workspace...</p>
      </div>
    );
  }

  // Проверка доступа
  if (hasAccess === false) {
    return (
      <div className="p-6 md:p-10 min-h-screen bg-[#F6F8FA] text-black">
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#FBFCFC] border-2 border-[#E5E9EF] rounded-3xl p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">Нет доступа к workspace</h2>
            <p className="text-[#6C7280] mb-6">
              Чтобы открыть workspace, вы должны быть создателем проекта или активным участником.
            </p>
            <div className="space-y-3">
              <p className="text-sm text-[#6C7280]">
                • Создайте проект, чтобы получить доступ к workspace
              </p>
              <p className="text-sm text-[#6C7280]">
                • Или подайте заявку на участие в проекте и дождитесь одобрения
              </p>
            </div>
            <div className="mt-6 flex gap-4 justify-center">
              <button
                onClick={() => navigate("/projects")}
                className="bg-[#21B4D6] hover:bg-[#009FAF] text-white px-6 py-2 rounded-xl transition"
              >
                Вернуться к проектам
              </button>
              {project && (
                <button
                  onClick={() => navigate(`/project/${id}`)}
                  className="bg-[#F6F8FA] hover:bg-[#E5E9EF] text-black border-2 border-[#E5E9EF] px-6 py-2 rounded-xl transition"
                >
                  Детали проекта
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 min-h-screen bg-[#F6F8FA] text-black">
        <p className="text-lg">Проект не найден</p>
      </div>
    );
  }

  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === "todo"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    done: tasks.filter((t) => t.status === "done"),
  };

  return (
    <div className="p-6 md:p-10 min-h-screen bg-[#F6F8FA] text-black">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-[#FBFCFC] border-2 border-[#E5E9EF] rounded-3xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold mb-2">{project.title}</h1>
              <p className="text-[#6C7280]">{project.description}</p>
            </div>
            <button
              onClick={() => navigate(`/project/${id}`)}
              className="bg-[#21B4D6] hover:bg-[#009FAF] text-white px-4 py-2 rounded-xl transition"
            >
              Детали проекта
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-[#FBFCFC] border-2 border-[#E5E9EF] rounded-3xl p-6 mb-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab("tasks")}
              className={`px-6 py-2 rounded-xl transition ${
                activeTab === "tasks"
                  ? "bg-[#21B4D6] text-white"
                  : "bg-[#F6F8FA] text-black hover:bg-[#E5E9EF]"
              }`}
            >
              Задачи ({tasks.length})
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={`px-6 py-2 rounded-xl transition ${
                activeTab === "members"
                  ? "bg-[#21B4D6] text-white"
                  : "bg-[#F6F8FA] text-black hover:bg-[#E5E9EF]"
              }`}
            >
              Участники ({members.length})
            </button>
          </div>

          {/* Tasks Tab */}
          {activeTab === "tasks" && (
            <div>
              {/* Create Task Form */}
              <div className="border-2 border-[#E5E9EF] rounded-xl p-4 mb-6">
                <h3 className="font-semibold mb-3">Создать задачу</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Название задачи"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full border-2 border-[#E5E9EF] rounded-xl px-4 py-2 focus:outline-none focus:border-[#21B4D6]"
                  />
                  <textarea
                    placeholder="Описание (необязательно)"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    className="w-full border-2 border-[#E5E9EF] rounded-xl px-4 py-2 focus:outline-none focus:border-[#21B4D6]"
                    rows={3}
                  />
                  <button
                    onClick={handleCreateTask}
                    className="bg-[#21B4D6] hover:bg-[#009FAF] text-white px-6 py-2 rounded-xl transition"
                  >
                    Создать
                  </button>
                </div>
              </div>

              {/* Kanban Board */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Todo */}
                <div className="bg-[#F6F8FA] border-2 border-[#E5E9EF] rounded-xl p-4">
                  <h3 className="font-semibold mb-3 text-yellow-600">
                    To Do ({tasksByStatus.todo.length})
                  </h3>
                  <div className="space-y-2">
                    {tasksByStatus.todo.map((task) => (
                      <div
                        key={task.id}
                        className="bg-white border border-[#E5E9EF] rounded-lg p-3"
                      >
                        <h4 className="font-medium mb-1">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-[#6C7280] mb-2">{task.description}</p>
                        )}
                        {task.assignee_name && (
                          <p className="text-xs text-[#6C7280] mb-2">
                            Исполнитель: {task.assignee_name}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, "in_progress")}
                            className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded"
                          >
                            В работу
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* In Progress */}
                <div className="bg-[#F6F8FA] border-2 border-[#E5E9EF] rounded-xl p-4">
                  <h3 className="font-semibold mb-3 text-blue-600">
                    In Progress ({tasksByStatus.in_progress.length})
                  </h3>
                  <div className="space-y-2">
                    {tasksByStatus.in_progress.map((task) => (
                      <div
                        key={task.id}
                        className="bg-white border border-[#E5E9EF] rounded-lg p-3"
                      >
                        <h4 className="font-medium mb-1">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-[#6C7280] mb-2">{task.description}</p>
                        )}
                        {task.assignee_name && (
                          <p className="text-xs text-[#6C7280] mb-2">
                            Исполнитель: {task.assignee_name}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, "done")}
                            className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded"
                          >
                            Готово
                          </button>
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, "todo")}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                          >
                            Назад
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Done */}
                <div className="bg-[#F6F8FA] border-2 border-[#E5E9EF] rounded-xl p-4">
                  <h3 className="font-semibold mb-3 text-green-600">
                    Done ({tasksByStatus.done.length})
                  </h3>
                  <div className="space-y-2">
                    {tasksByStatus.done.map((task) => (
                      <div
                        key={task.id}
                        className="bg-white border border-[#E5E9EF] rounded-lg p-3 opacity-75"
                      >
                        <h4 className="font-medium mb-1 line-through">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-[#6C7280] mb-2">{task.description}</p>
                        )}
                        {task.assignee_name && (
                          <p className="text-xs text-[#6C7280] mb-2">
                            Исполнитель: {task.assignee_name}
                          </p>
                        )}
                        <button
                          onClick={() => handleUpdateTaskStatus(task.id, "in_progress")}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                        >
                          Вернуть
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === "members" && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="bg-[#F6F8FA] border-2 border-[#E5E9EF] rounded-xl p-4"
                  >
                    <h3 className="font-semibold text-lg mb-1">{member.user_name}</h3>
                    <p className="text-sm text-[#6C7280] mb-2">{member.user_email}</p>
                    <span className="inline-block bg-blue-100 text-[#2663EB] px-3 py-1 rounded-full text-sm">
                      {member.role_in_team}
                    </span>
                  </div>
                ))}
              </div>
              {members.length === 0 && (
                <p className="text-center text-[#6C7280] py-8">
                  В проекте пока нет участников
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

