import React from 'react';
import { useNavigate } from 'react-router-dom';

const AUTH_STORAGE_KEY = 'deeptrace-authenticated';
const AUTH_SESSION_KEY = 'deeptrace-authenticated-session';

export default function SettingsPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    navigate('/login', { replace: true });
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">⚙️ 系统设置</h1>
      <div className="bg-white border border-borderGray rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => navigate('/ai-usage')}
          className="w-full text-left p-4 border-b border-borderGray hover:bg-bgLight cursor-pointer transition-colors"
        >
          AI用量统计
        </button>
        <button
          onClick={() => navigate('/members')}
          className="w-full text-left p-4 border-b border-borderGray hover:bg-bgLight cursor-pointer transition-colors"
        >
          项目成员管理
        </button>
        <button
          onClick={handleLogout}
          className="w-full text-left p-4 text-red-500 hover:bg-red-50 cursor-pointer transition-colors font-medium"
        >
          退出登录
        </button>
      </div>
    </div>
  );
}
