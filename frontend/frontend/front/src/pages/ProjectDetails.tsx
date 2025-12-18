import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api, { applyToProject } from "../api/axios";

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
  progress?: number;
  skills: string[];
  format?: string;
  location?: string;
  authorId?: number; // ID автора
  authorName?: string;
  authorAvatar?: string;
  authorEmail?: string;
  ownerId?: number;
  applications?: Application[];
  type?: "project" | "hackathon";
  project_id?: number;
  alreadyApplied?: boolean;
  alreadyJoined?: boolean;
  deadline?: string;
  prize?: string;
}

const mockProjects: Project[] = [];

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showJoinForm, setShowJoinForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState("");

  const role = localStorage.getItem("role");

  const canJoin = role === "student" && project?.type === "project";

  const [joinData, setJoinData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    skills: "",
    bio: "",
    hasTeam: "",
  });

  useEffect(() => {
    async function fetchProject() {
      try {
        const response = await api.get(`/projects/${id}`);
        const data: Project = {
          ...response.data,
          skills: response.data.skills || [],
          tags: response.data.tags || [],
          applicants: response.data.applicants || 0,
          format: response.data.format || "online",
          location: response.data.location || "TBA",
          authorName: response.data.authorName || "Unknown",
          authorAvatar:
            response.data.authorAvatar || "https://via.placeholder.com/80",
          authorEmail: response.data.authorEmail || "",
          progress: response.data.progress || 0,
        };
        setProject(data);
      } catch (err) {
        console.warn("⚠️ Сервер не отвечает, используем mock:", err);
        const fallback = mockProjects.find((p) => p.id === Number(id));
        if (fallback) setProject(fallback);
        else setError("Project not found 😕");
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [id]);

  const handleApply = () => {
    if (!id) return;
    if (!localStorage.getItem("token")) {
      alert("Сначала войдите в аккаунт, чтобы подать заявку");
      return;
    }
    if (!canJoin) {
      alert("Только студенты могут присоединяться к проекту");
      return;
    }
    setShowJoinForm(true);
  };

  const handleJoinSubmit = async () => {
    if (!project) return;
    setIsSubmitting(true);
    setJoinError("");
    setJoinSuccess("");
    try {
      await applyToProject(project.id); // один аргумент
      setJoinSuccess("✅ Вы успешно подали заявку!");
    } catch (err: any) {
      console.error(err);
      setJoinError("❌ Ошибка при отправке заявки. Попробуйте позже.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#2663EB]"></div>
      </div>
    );
  }

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-500 text-xl">
        {error}
        <button
          onClick={() => navigate("/projects")}
          className="mt-6 px-4 py-2 bg-[#2663EB] text-white rounded-xl hover:bg-blue-700"
        >
          Back to Projects
        </button>
      </div>
    );

  if (!project) return null;

  return (
    <div className="min-h-screen bg-[#FBFCFC] text-black py-8 px-4 md:py-12 md:px-8">
      <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-[2fr_1fr]">
        {/* Left section */}
        <div className="bg-white shadow-md border border-[#E5E9EF] rounded-3xl p-6 md:p-10">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 text-[#2663EB] hover:bg-[#FBFCFC] border border-transparent hover:border-[#E5E9EF] rounded-full px-5 py-2 duration-200 transition"
          >
            <i className="fa-solid fa-arrow-left text-black"></i>
          </button>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6">
            <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-0">
              {project.title}
            </h1>
            <span
              className={`text-sm font-semibold px-3 py-1 rounded-full ${
                project.status === "open"
                  ? "bg-green-100 text-green-700"
                  : project.status === "recruiting"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {project.status.charAt(0).toUpperCase() +
                project.status.slice(1).toLowerCase()}
            </span>
          </div>

          <p className="text-[#6C7280] text-base md:text-lg mb-6 leading-relaxed">
            {project.description}
          </p>

          {/* Tags */}
          {project.tags?.length ? (
            <div className="flex flex-wrap gap-2 mb-6">
              {project.tags.map((tag, i) => (
                <span
                  key={i}
                  className="bg-[#3A3F47] text-white px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[#6C7280] italic mb-6">No tags provided</p>
          )}

          {/* Skills */}
          {project.skills?.length ? (
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-semibold mb-3 text-[#1E293B]">
                Required skills
              </h2>
              <ul className="flex flex-wrap gap-3">
                {project.skills.map((skill, i) => (
                  <li
                    key={i}
                    className="border border-[#E5E9EF] rounded-xl px-3 py-1 text-[#6C7280] text-sm"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-[#6C7280] italic mb-6">
              No specific skills required
            </p>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            {canJoin && (
              <button
                onClick={handleApply}
                disabled={isSubmitting}
                className={`${
                  isSubmitting
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-[#21B4D6] hover:bg-[#009FAF] text-white"
                } px-6 py-3 rounded-xl transition flex items-center gap-2 justify-center`}
              >
                <i className="fa-solid fa-paper-plane"></i>{" "}
                {isSubmitting ? "Submitting..." : "Join Project"}
              </button>
            )}

            <button className="border border-[#E5E9EF] px-6 py-3 rounded-xl hover:bg-[#F1F5F9] transition flex items-center gap-2 justify-center">
              <i className="fa-regular fa-bookmark"></i> Save project
            </button>
          </div>
        </div>

        {/* Right section */}
        <div className="bg-white border border-[#E5E9EF] rounded-3xl p-6 md:p-8 shadow-sm h-fit">
          {project.authorName && (
            <div
              className="flex flex-col items-center mb-6 md:mb-8 cursor-pointer"
              onClick={() =>
                project.authorId && navigate(`/profile/${project.authorId}`)
              }
            >
              <img
                src={project.authorAvatar || "https://via.placeholder.com/80"}
                alt={project.authorName || "Author"}
                className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-[#E5E9EF] mb-3"
              />
              <p className="text-lg font-semibold text-[#1E293B]">
                {project.authorName || "Unknown Author"}
              </p>
              {project.authorEmail && (
                <p className="text-[#6C7280] text-sm truncate">
                  {project.authorEmail}
                </p>
              )}
              <p className="text-[#6C7280] text-sm">Project creator</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {project.format && (
              <div className="flex items-center gap-2 text-[#6C7280]">
                <i className="fa-solid fa-laptop-code"></i>
                <span className="font-medium">{project.format}</span>
              </div>
            )}
            {project.location && (
              <div className="flex items-center gap-2 text-[#6C7280]">
                <i className="fa-solid fa-location-dot"></i>
                <span>{project.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-[#6C7280]">
              <i className="fa-solid fa-users"></i>
              <span>{project.applicants} applicants</span>
            </div>
          </div>
        </div>
      </div>

      {/* Join Form Modal */}
      {showJoinForm && project && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-2xl shadow-xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-semibold mb-6">
              Join "{project.title}"
            </h2>

            {/* Name */}
            <label className="text-[#6C7280] text-lg font-medium mt-5">
              Full Name
            </label>
            <input
              disabled={isSubmitting}
              value={joinData.name}
              onChange={(e) =>
                setJoinData({ ...joinData, name: e.target.value })
              }
              className="mt-2 mb-5 w-full border-2 border-[#E5E9EF] rounded-xl p-2"
              placeholder="Your full name"
            />

            {/* Email */}
            <label className="text-[#6C7280] text-lg font-medium">Email</label>
            <input
              disabled={isSubmitting}
              type="email"
              value={joinData.email}
              onChange={(e) =>
                setJoinData({ ...joinData, email: e.target.value })
              }
              className="mt-2 mb-5 w-full border-2 border-[#E5E9EF] rounded-xl p-2"
              placeholder="you@example.com"
            />

            {/* Phone */}
            <label className="text-[#6C7280] text-lg font-medium">
              Phone Number
            </label>
            <input
              disabled={isSubmitting}
              value={joinData.phone}
              onChange={(e) =>
                setJoinData({ ...joinData, phone: e.target.value })
              }
              className="mt-2 mb-5 w-full border-2 border-[#E5E9EF] rounded-xl p-2"
              placeholder="+7 777 000 0000"
            />

            {/* Role */}
            <label className="text-[#6C7280] text-lg font-medium">
              Your Role
            </label>
            <select
              disabled={isSubmitting}
              value={joinData.role}
              onChange={(e) =>
                setJoinData({ ...joinData, role: e.target.value })
              }
              className="mt-2 mb-5 w-full border-2 border-[#E5E9EF] rounded-xl p-2"
            >
              <option value="">Select your role</option>
              <option value="Frontend">Frontend Developer</option>
              <option value="Backend">Backend Developer</option>
              <option value="Fullstack">Fullstack Developer</option>
              <option value="Designer">UI/UX Designer</option>
              <option value="Mobile">Mobile Developer</option>
              <option value="Data">Data/AI</option>
              <option value="PM">Product Manager</option>
            </select>

            {/* Skills */}
            <label className="text-[#6C7280] text-lg font-medium">Skills</label>
            <input
              disabled={isSubmitting}
              value={joinData.skills}
              onChange={(e) =>
                setJoinData({ ...joinData, skills: e.target.value })
              }
              className="mt-2 mb-5 w-full border-2 border-[#E5E9EF] rounded-xl p-2"
              placeholder="React, Python, Figma..."
            />

            {/* Bio */}
            <label className="text-[#6C7280] text-lg font-medium">
              Short Bio
            </label>
            <textarea
              disabled={isSubmitting}
              value={joinData.bio}
              onChange={(e) =>
                setJoinData({ ...joinData, bio: e.target.value })
              }
              className="mt-2 mb-5 w-full border-2 border-[#E5E9EF] rounded-xl p-2"
              placeholder="Tell us about yourself..."
            />

            {/* Team */}
            <label className="text-[#6C7280] text-lg font-medium">
              Do you have a team?
            </label>
            <select
              disabled={isSubmitting}
              value={joinData.hasTeam}
              onChange={(e) =>
                setJoinData({ ...joinData, hasTeam: e.target.value })
              }
              className="mt-2 mb-5 w-full border-2 border-[#E5E9EF] rounded-xl p-2"
            >
              <option value="">Choose</option>
              <option value="yes">Yes, I have a team</option>
              <option value="no">No, I'm looking for teammates</option>
            </select>

            {joinError && (
              <p className="text-red-500 font-semibold">{joinError}</p>
            )}
            {joinSuccess && (
              <p className="text-green-500 font-semibold">{joinSuccess}</p>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowJoinForm(false)}
                className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>

              <button
                onClick={handleJoinSubmit}
                disabled={isSubmitting}
                className={`px-6 py-2 rounded-xl text-white ${
                  isSubmitting
                    ? "bg-gray-400"
                    : "bg-[#21B4D6] hover:bg-[#009FAF]"
                }`}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
