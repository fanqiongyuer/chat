import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { mockTools } from '../mock/tools';
import { Dna, Wrench, BookOpen, Menu } from 'lucide-react';
import { type LayoutOutletContext } from '../components/Layout';

const iconMap: Record<string, React.ReactNode> = {
  Dna: <Dna size={24} className="text-blue-500" />,
  Wrench: <Wrench size={24} className="text-orange-500" />,
  BookOpen: <BookOpen size={24} className="text-green-500" />
};

export default function ToolsPage() {
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
          <h1 className="text-xl font-medium text-primaryText">工具市场</h1>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-8 md:p-12">
        <div className="max-w-[1000px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockTools.map(tool => (
            <div key={tool.id} className="card hover:shadow-lg">
              <div className="w-12 h-12 rounded-full bg-bgLight flex items-center justify-center mb-5">
                {iconMap[tool.icon]}
              </div>
              <h3 className="font-medium text-xl mb-2 text-primaryText">{tool.name}</h3>
              <p className="text-secondaryText text-base mb-8 leading-relaxed">{tool.desc}</p>
              <button
                onClick={() => navigate(`/tool/${tool.id}`)}
                className="mt-auto w-full bg-bgLight hover:bg-[#e1e5ea] text-primaryText font-medium py-2.5 rounded-full transition-colors text-base"
              >
                打开工具
              </button>
            </div>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
}