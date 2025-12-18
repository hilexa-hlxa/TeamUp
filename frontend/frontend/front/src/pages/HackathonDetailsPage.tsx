import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api, { applyToProject } from "../api/axios";

interface Hackathon {
  id: string;
  title: string;
  description: string;
  cover?: string;
  dateRange?: string;
  location?: string;
  venue?: string;
  prize?: string;
  format?: string;
  applicants?: number;
  authorId?: number;
  authorName?: string;
  authorAvatar?: string;
  authorEmail?: string;
  tags?: string[];
  timeline?: string[];
  status?: "Registration" | "Ongoing" | "Submission" | "Closed";
  contacts?: {
    email?: string;
    website?: string;
    github?: string;
    devpost?: string;
  };
}

export default function HackathonDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [loading, setLoading] = useState(true);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinData, setJoinData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [joined, setJoined] = useState(false);

  const fetchHackathon = async () => {
    try {
      const response = await api.get(`/hackathons/${id}`);
      setHackathon(response.data);
    } catch (err) {
      // fallback для локальной проверки
      const fallback: Hackathon = {
        id: String(id),
        title: "Sample Hackathon",
        description: "Описание хакатона для теста.",
        cover:
          "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=60",
        dateRange: "Nov 20–22, 2025",
        location: "Global",
        venue: "Virtual",
        prize: "$10,000",
        format: "online",
        applicants: 42,
        authorName: "TechLabs",
        authorAvatar: "https://i.pravatar.cc/150?img=12",
        authorEmail: "contact@techlabs.com",
        tags: ["AI", "Web", "Open Data"],
        timeline: [
          "Registration: Nov 1–15",
          "Hackathon: Nov 20–22",
          "Submission Deadline: Nov 22, 5 PM UTC",
          "Winners Announcement: Nov 25",
        ],
        status: "Registration",
        contacts: {
          email: "contact@techlabs.com",
          website: "https://techlabs.com",
          github: "https://github.com/techlabs",
          devpost: "https://devpost.com/techlabs",
        },
      };
      setHackathon(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHackathon();
  }, [id]);

  const handleJoinHackathon = () => {
    if (!localStorage.getItem("user")) {
      alert("Сначала войдите в аккаунт, чтобы участвовать");
      return;
    }
    setShowJoinForm(true);
  };

  const submitJoinForm = async () => {
    if (!hackathon) return;

    try {
      setIsSubmitting(true);
      await applyToProject(Number(hackathon.id));

      setHackathon((prev) =>
        prev ? { ...prev, applicants: (prev.applicants || 0) + 1 } : prev
      );

      setShowJoinForm(false);
      setJoined(true);
      alert("Вы успешно подали заявку!");
    } catch (err) {
      console.error(err);
      alert("Ошибка при отправке данных");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#2663EB]"></div>
      </div>
    );

  if (!hackathon)
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <p className="text-gray-500 text-lg mb-4">Hackathon not found.</p>
        <button
          onClick={() => navigate("/hackathons")}
          className="px-4 py-2 bg-[#2663EB] text-white rounded-xl hover:bg-blue-700 transition"
        >
          Back to Hackathons
        </button>
      </div>
    );

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate("/hackathons")}
        className="mb-6 text-[#2663EB] hover:bg-[#FBFCFC] border border-transparent hover:border-[#E5E9EF] rounded-full px-5 py-2 duration-200 transition"
      >
        <i className="fa-solid fa-arrow-left text-black"></i>
      </button>

      {hackathon.cover && (
        <div className="w-full h-64 sm:h-80 md:h-96 overflow-hidden rounded-3xl shadow-md mb-8">
          <img
            src={hackathon.cover}
            alt={hackathon.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-gray-900">{hackathon.title}</h1>
        {hackathon.status && (
          <span
            className={`px-3 py-1 rounded-full font-semibold ${
              hackathon.status.toLowerCase() === "closed"
                ? "bg-gray-400 text-gray-100"
                : "bg-[#21B4D6]/10 text-[#009FAF]"
            }`}
          >
            {hackathon.status}
          </span>
        )}
      </div>

      <div
        className="flex items-center gap-3 mb-4 cursor-pointer"
        onClick={() =>
          hackathon.authorId && navigate(`/profile/${hackathon.authorId}`)
        }
      >
        <img
          src={hackathon.authorAvatar ?? "https://i.pravatar.cc/40?img=1"}
          alt={hackathon.authorName ?? "Author"}
          className="w-10 h-10 rounded-full border border-[#E5E9EF]"
        />
        <div className="text-[#6C7280] text-sm">
          <p className="font-medium">
            {hackathon.authorName ?? "Unknown Author"}
          </p>
          {hackathon.authorEmail && (
            <p className="truncate">{hackathon.authorEmail}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {hackathon.tags?.map((tag) => (
          <span
            key={tag}
            className="bg-[#F6F8FA] text-[#6C7280] font-medium text-sm px-3 py-1 rounded-full border border-[#E5E9EF]"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Основная информация */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8 text-[#6C7280]">
        <div className="p-4 bg-[#F8FAFC] rounded-2xl border">
          <strong>Date:</strong> {hackathon.dateRange}
        </div>
        <div className="p-4 bg-[#F8FAFC] rounded-2xl border">
          <strong>Location:</strong> {hackathon.location || hackathon.venue}
        </div>
        <div className="p-4 bg-[#F8FAFC] rounded-2xl border">
          <strong>Prize:</strong> {hackathon.prize}
        </div>
        <div className="p-4 bg-[#F8FAFC] rounded-2xl border">
          <strong>Participants:</strong> {hackathon.applicants}
        </div>
        <div className="p-4 bg-[#F8FAFC] rounded-2xl border">
          <strong>Format:</strong> {hackathon.format}
        </div>
      </div>

      <div className="bg-white border rounded-3xl shadow-md p-6 mb-8">
        <h2 className="text-xl text-[#6C7280] font-semibold mb-3">
          About this Hackathon
        </h2>
        <p className="text-gray-700 leading-relaxed">{hackathon.description}</p>
      </div>

      {/* Timeline */}
      {hackathon.timeline && (
        <div className="mb-8">
          <h2 className="font-semibold text-lg mb-2">Timeline</h2>
          <ul className="list-disc list-inside text-gray-600">
            {hackathon.timeline.map((event, idx) => (
              <li key={idx}>{event}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Contacts */}
      {hackathon.contacts && (
        <div className="mb-8">
          <h2 className="font-semibold text-lg mb-2">Contacts</h2>
          <div className="flex flex-wrap gap-4 text-[#6C7280]">
            {hackathon.contacts.email && (
              <a
                href={`mailto:${hackathon.contacts.email}`}
                className="hover:underline"
              >
                Email
              </a>
            )}
            {hackathon.contacts.website && (
              <a
                href={hackathon.contacts.website}
                target="_blank"
                className="hover:underline"
              >
                Website
              </a>
            )}
            {hackathon.contacts.github && (
              <a
                href={hackathon.contacts.github}
                target="_blank"
                className="hover:underline"
              >
                GitHub
              </a>
            )}
            {hackathon.contacts.devpost && (
              <a
                href={hackathon.contacts.devpost}
                target="_blank"
                className="hover:underline"
              >
                Devpost
              </a>
            )}
          </div>
        </div>
      )}

      {/* Join Form Modal */}
      {showJoinForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-2xl shadow-xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-semibold mb-6">
              Join "{hackathon.title}"
            </h2>

            <label className="text-[#6C7280] text-lg font-medium mt-5">
              Full Name
            </label>
            <input
              disabled={isSubmitting}
              type="text"
              value={joinData.name}
              onChange={(e) =>
                setJoinData({ ...joinData, name: e.target.value })
              }
              placeholder="Your full name"
              className="mt-2 mb-5 w-full border-2 border-[#E5E9EF] rounded-xl p-2"
            />

            <label className="text-[#6C7280] text-lg font-medium">Email</label>
            <input
              disabled={isSubmitting}
              type="email"
              value={joinData.email}
              onChange={(e) =>
                setJoinData({ ...joinData, email: e.target.value })
              }
              placeholder="you@example.com"
              className="mt-2 mb-5 w-full border-2 border-[#E5E9EF] rounded-xl p-2"
            />

            <label className="text-[#6C7280] text-lg font-medium">
              Phone Number
            </label>
            <input
              disabled={isSubmitting}
              type="text"
              value={joinData.phone}
              onChange={(e) =>
                setJoinData({ ...joinData, phone: e.target.value })
              }
              placeholder="+7 777 000 0000"
              className="mt-2 mb-5 w-full border-2 border-[#E5E9EF] rounded-xl p-2"
            />

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
              <option value="Designer">Designer</option>
              <option value="PM">Project Manager</option>
            </select>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setShowJoinForm(false)}
                className="px-5 py-2 rounded-xl border hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={submitJoinForm}
                disabled={isSubmitting}
                className="px-6 py-2 bg-[#2663EB] text-white rounded-xl hover:bg-blue-700"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Button */}
      {!joined && hackathon.status !== "Closed" && (
        <div className="flex justify-end mt-6">
          <button
            onClick={handleJoinHackathon}
            disabled={isSubmitting}
            className="px-6 py-3 bg-[#21B4D6] text-white rounded-2xl hover:bg-[#009FAF]"
          >
            Join Hackathon
          </button>
        </div>
      )}

      {joined && (
        <div className="flex justify-end mt-6">
          <span className="px-6 py-3 bg-green-500 text-white rounded-2xl cursor-not-allowed">
            Joined ✓
          </span>
        </div>
      )}
    </div>
  );
}
