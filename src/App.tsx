import type { ReactElement } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ChatPage from './pages/ChatPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ToolsPage from './pages/ToolsPage';
import ToolPage from './pages/ToolPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';

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

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <RedirectIfAuthenticated>
        <LoginPage />
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
      { path: 'tools', element: <ToolsPage /> },
      { path: 'tool/:id', element: <ToolPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ]
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  }
]);

export default function App() {
  return <RouterProvider router={router} />;
}
