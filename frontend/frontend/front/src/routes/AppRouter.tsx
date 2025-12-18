import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ProfilePage from "../pages/ProfilePage";
import ProjectPage from "../pages/ProjectPage";
import MainLayout from "../layouts/MainLayout";
import ProjectDetails from "../pages/ProjectDetails";
import HackathonsPage from "../pages/HackathonsPage";
import HackathonDetailsPage from "../pages/HackathonDetailsPage";
import ApplicantsPageWrapper from "../pages/ApplicantsPageWrapper";
import WorkspacePage from "../pages/WorkspacePage";
import WorkspaceSelectPage from "../pages/WorkspaceSelectPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<MainLayout />}>
          <Route path="/projects" element={<ProjectPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/project/:id" element={<ProjectDetails />} />
          <Route path="/workspace" element={<WorkspaceSelectPage />} />
          <Route path="/workspace/:id" element={<WorkspacePage />} />
          <Route path="/hackathons" element={<HackathonsPage />} />
          <Route path="/hackathon/:id" element={<HackathonDetailsPage />} />
          <Route
            path="/applications"
            element={<ApplicantsPageWrapper />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
