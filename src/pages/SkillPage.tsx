import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Menu, Plus } from 'lucide-react';
import { type LayoutOutletContext } from '../components/Layout';

export default function SkillPage() {
  const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<LayoutOutletContext>();

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <header className="h-16 shrink-0 flex items-center px-6 justify-between bg-white/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3 min-w-0">
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-secondaryText hover:bg-bgLight rounded-full transition-colors"
              title="展开边栏"
            >
              <Menu size={20} />
            </button>
          )}
          <h1 className="text-xl font-medium text-primaryText">Skill</h1>
        </div>
        <button className="shrink-0 px-4 py-2 bg-bgLight hover:bg-[bgLight] text-primaryText text-sm font-medium rounded-full transition-colors flex items-center gap-2">
          <Plus size={14} />
          <span>新建 Skill</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-12 pt-4 md:px-8 lg:px-10 md:pb-12 md:pt-6">
        <div className="max-w-[1240px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"></div>
        </div>
      </div>
    </div>
  );
}
