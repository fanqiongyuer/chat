import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { mockProjects } from '../mock/projects';
import { Plus, Menu } from 'lucide-react';
import { type LayoutOutletContext } from '../components/Layout';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<LayoutOutletContext>();
  
  return (
    <div className="flex h-full w-full flex-col bg-white">
      <header className="h-16 shrink-0 flex items-center px-6 justify-between bg-white/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3 min-w-0">
          {!isSidebarOpen && (
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-secondaryText hover:bg-bgLight rounded-full transition-colors" title="展开边栏">
              <Menu size={20} />
            </button>
          )}
          <h1 className="text-xl font-medium text-primaryText">科研项目</h1>
        </div>
        <button className="shrink-0 px-4 py-2 bg-bgLight hover:bg-[#e1e5ea] text-primaryText text-sm font-medium rounded-full transition-colors flex items-center gap-2">
          <Plus size={14} />
          <span>创建新项目</span>
        </button>
      </header>
      <div className="flex-1 overflow-y-auto p-8 md:p-12">
        <div className="max-w-[1000px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockProjects.map(proj => (
            <div key={proj.id} className="card hover:shadow-lg">
              <h3 className="font-medium text-xl mb-2 text-primaryText">{proj.name}</h3>
              <p className="text-secondaryText text-base mb-6 line-clamp-2 min-h-[40px] leading-relaxed">{proj.desc}</p>
              
              <div className="mt-auto flex items-center gap-4 text-sm text-tertiaryText mb-6">
                <span>{proj.count} 个对话</span>
                <span>•</span>
                <span>{proj.members} 名成员</span>
              </div>
              
              <button 
                onClick={() => navigate(`/project/${proj.id}`)} 
                className="w-full bg-bgLight hover:bg-blue-50 text-primaryText hover:text-blue-700 font-medium py-2.5 rounded-xl transition-colors text-base"
              >
                进入研究
              </button>
            </div>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
}