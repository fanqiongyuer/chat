import React from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { mockProjects } from '../mock/projects';
import { ArrowLeft, FileText, Menu, Plus, ChevronRight } from 'lucide-react';
import { type LayoutOutletContext } from '../components/Layout';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSidebarOpen, setIsSidebarOpen, chats } = useOutletContext<LayoutOutletContext>();
  
  const proj = mockProjects.find(p => p.id === id);
  const projectChats = chats.filter(c => c.projectId === id);

  if (!proj) return <div className="p-8">项目不存在</div>;

  return (
    <div className="p-8 md:p-12 h-full overflow-y-auto bg-white w-full">
      <div className="max-w-[800px] mx-auto">
        <div className="flex items-center gap-4 mb-10">
          {!isSidebarOpen && (
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-secondaryText hover:bg-bgLight rounded-full transition-colors" title="展开边栏">
              <Menu size={20} />
            </button>
          )}
          <button onClick={() => navigate('/projects')} className={`p-2 ${isSidebarOpen ? '-ml-2' : ''} text-secondaryText hover:bg-bgLight rounded-full transition-colors`}>
            <ArrowLeft size={20}/>
          </button>
          <h1 className="text-3xl font-normal text-primaryText">{proj.name}</h1>
        </div>
        
        <div className="flex gap-4 mb-10">
          <button onClick={() => navigate(`/chat/new?projectId=${id}`)} className="btn-primary">
            <Plus size={18}/> 新建对话
          </button>
          <button className="btn-secondary">
            项目设置
          </button>
        </div>

        <h3 className="text-lg font-medium text-primaryText mb-4">全部对话</h3>
        <div className="border border-borderGray rounded-2xl overflow-hidden">
          {projectChats.map((chat, idx) => (
            <div key={chat.id} onClick={() => navigate(`/chat/${chat.id}`)} className={`flex items-center justify-between p-5 cursor-pointer hover:bg-bgLight transition-colors ${idx !== projectChats.length -1 ? 'border-b border-borderGray' : ''}`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white border border-borderGray flex items-center justify-center">
                  <FileText size={18} className="text-secondaryText"/>
                </div>
                <span className="font-medium text-lg text-primaryText">{chat.title}</span>
              </div>
              <div className="text-sm text-tertiaryText flex items-center gap-6">
                <span>{chat.date}</span>
                <ChevronRight size={16} className="text-[#c4c7c5]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
