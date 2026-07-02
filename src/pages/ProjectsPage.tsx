import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { mockProjects } from '../mock/projects';
import { Plus, Menu, Folder } from 'lucide-react';
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
      <div className="flex-1 overflow-y-auto px-4 pb-12 pt-4 md:px-8 lg:px-10 md:pb-12 md:pt-6">
        <div className="max-w-[1240px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {mockProjects.map((proj) => (
              <button
                key={proj.id}
                type="button"
                onClick={() => navigate(`/project/${proj.id}`)}
                className="rounded-xl border border-[#e9edf2] bg-white p-4 text-left transition-all hover:shadow-sm hover:border-[#dde3ea]"
              >
                <div className="mb-3 inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#f3f5f8] text-[#7f8995]">
                  <Folder size={12} />
                </div>

                <div className="mb-1 flex items-center gap-2">
                  <h3 className="truncate text-[17px] font-medium text-primaryText">{proj.name}</h3>
                  <span className="shrink-0 rounded px-1.5 py-0.5 text-[11px] leading-none text-[#e46d5e] bg-[#fff1ef]">
                    团队项目
                  </span>
                </div>

                <p className="line-clamp-2 min-h-[38px] text-sm leading-5 text-secondaryText">{proj.desc}</p>

                <div className="mt-3 flex items-center gap-2 text-xs text-tertiaryText">
                  <span>{proj.count} 个对话</span>
                  <span>·</span>
                  <span>{proj.members} 名成员</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}