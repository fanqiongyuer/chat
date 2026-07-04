import type { ReactElement } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ChatPage from './pages/ChatPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ExperimentDetailPage from './pages/ExperimentDetailPage';
import ToolsPage from './pages/ToolsPage';
import ToolPage from './pages/ToolPage';
import SettingsPage from './pages/SettingsPage';
import MemberManagementPage from './pages/MemberManagementPage';
import AiUsagePage from './pages/AiUsagePage';
import SkillPage from './pages/SkillPage';
import SystemSettingsDetailPage from './pages/SystemSettingsDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ComponentShowcase from './pages/ComponentShowcase';

type ReactElement = any;

const AUTH_STORAGE_KEY = 'deeptrace-authenticated';
const AUTH_SESSION_KEY = 'deeptrace-authenticated-session';

const checkIsAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(AUTH_STORAGE_KEY) === '1' || sessionStorage.getItem(AUTH_SESSION_KEY) === '1';
};

const RequireAuth = ({ children }: { children: ReactElement }) => {
  if (!checkIsAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const RedirectIfAuthenticated = ({ children }: { children: ReactElement }) => {
  if (checkIsAuthenticated()) {
    return <Navigate to="/chat/new" replace />;
  }
  return children;
};

const importMetaEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
const routerBaseName = importMetaEnv?.BASE_URL || '/';

const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: (
        <RedirectIfAuthenticated>
          <LoginPage />
        </RedirectIfAuthenticated>
      ),
    },
    {
      path: '/register',
      element: (
        <RedirectIfAuthenticated>
          <RegisterPage />
        </RedirectIfAuthenticated>
      ),
    },
    {
      path: '/forgot-password',
      element: (
        <RedirectIfAuthenticated>
          <ForgotPasswordPage />
        </RedirectIfAuthenticated>
      ),
    },
    {
      path: '/',
      element: (
        <RequireAuth>
          <Layout />
        </RequireAuth>
      ),
      children: [
        { index: true, element: <Navigate to="/chat/new" replace /> },
        { path: 'chat/new', element: <ChatPage isNew={true} /> },
        { path: 'chat/:id', element: <ChatPage isNew={false} /> },
        { path: 'projects', element: <ProjectsPage /> },
        { path: 'project/:id', element: <ProjectDetailPage /> },
        { path: 'project/:projectId/experiment/:experimentId', element: <ExperimentDetailPage /> },
        { path: 'tools', element: <ToolsPage /> },
        { path: 'tool/:id', element: <ToolPage /> },
        { path: 'ai-usage', element: <AiUsagePage /> },
        { path: 'skills', element: <SkillPage /> },
        { path: 'system-settings', element: <SystemSettingsDetailPage /> },
        { path: 'members', element: <MemberManagementPage /> },
        { path: 'settings', element: <SettingsPage /> },
        { path: 'showcase', element: <ComponentShowcase /> },
      ]
    },
    {
      path: '*',
      element: <Navigate to="/" replace />,
    }
  ],
  {
    basename: routerBaseName,
  }
);

export default function App() {
  return <RouterProvider router={router} />;
}
