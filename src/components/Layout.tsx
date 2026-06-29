import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Plus, Folder, Wrench, Settings, Search, ChevronDown, ChevronRight, PanelLeftClose, Menu, SquarePen, MoreHorizontal, Pencil, Share2, Trash2 } from 'lucide-react';
import { mockProjects } from '../mock/projects';
import { mockChats, type MockChat } from '../mock/chats';

const logoIcon = new URL('../assets/deptrace-logo.png', import.meta.url).href;
export interface LayoutOutletContext {
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  chats: MockChat[];
  setChats: React.Dispatch<React.SetStateAction<MockChat[]>>;
}

const AUTH_STORAGE_KEY = 'deeptrace-authenticated';
const AUTH_SESSION_KEY = 'deeptrace-authenticated-session';
const CHATS_STORAGE_KEY = 'deeptrace-chats';
const CHAT_MESSAGES_STORAGE_KEY = 'deeptrace-chat-messages';

function loadChatsFromStorage(): MockChat[] {
  if (typeof window === 'undefined') return mockChats;

  try {
    const raw = window.localStorage.getItem(CHATS_STORAGE_KEY);
    if (!raw) return mockChats;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return mockChats;

    const normalizedChats = parsed
      .filter((chat) => chat && typeof chat === 'object')
      .map((chat) => {
        const id = typeof chat.id === 'string' ? chat.id : '';
        const title = typeof chat.title === 'string' ? chat.title : '';
        const date = typeof chat.date === 'string' ? chat.date : '刚刚';
        const count = typeof chat.count === 'number' ? chat.count : 0;
        const projectId = typeof chat.projectId === 'string' ? chat.projectId : undefined;

        return { id, title, date, count, projectId } as MockChat;
      })
      .filter((chat) => chat.id && chat.title);

    return normalizedChats.length > 0 ? normalizedChats : mockChats;
  } catch {
    return mockChats;
  }
}

function removeChatMessagesFromStorage(chatId: string) {
  if (typeof window === 'undefined') return;

  try {
    const raw = window.localStorage.getItem(CHAT_MESSAGES_STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object' || !(chatId in parsed)) return;

    delete parsed[chatId];
    window.localStorage.setItem(CHAT_MESSAGES_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore storage parse/write errors
  }
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(240);
  const [expandedProjects, setExpandedProjects] = useState(() => {
    const initial: Record<string, boolean> = { unassigned: true };
    mockProjects.forEach(p => { initial[p.id] = true; });
    return initial;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [chats, setChats] = useState<MockChat[]>(() => loadChatsFromStorage());
  const [chatMenuOpenId, setChatMenuOpenId] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    setShowSettings(false);
    navigate('/login', { replace: true });
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  const handleDeleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    setChatMenuOpenId(null);
    removeChatMessagesFromStorage(chatId);

    const activeChatId = location.pathname.match(/^\/chat\/([^/]+)$/)?.[1];
    if (activeChatId === chatId) {
      navigate('/chat/new', { replace: true });
    }
  };

  const handleResizeStart = (event: React.MouseEvent<HTMLDivElement>) => {
    resizeStartXRef.current = event.clientX;
    resizeStartWidthRef.current = sidebarWidth;
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const minWidth = 200;
    const maxWidth = 440;

    const handleMouseMove = (event: MouseEvent) => {
      const delta = event.clientX - resizeStartXRef.current;
      const nextWidth = Math.min(maxWidth, Math.max(minWidth, resizeStartWidthRef.current + delta));
      setSidebarWidth(nextWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, sidebarWidth]);

  useEffect(() => {
    if (!isSidebarOpen) {
      setSidebarWidth(240);
    }
  }, [isSidebarOpen]);

  useEffect(() => {
    window.localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats));
  }, [chats]);

  const navItems = [
    { label: '项目', icon: <Folder size={14} />, path: '/projects' },
    { label: '工具', icon: <Wrench size={14} />, path: '/tools' }
  ];

  const activeChat = useMemo(() => {
    const matched = location.pathname.match(/^\/chat\/([^/]+)$/);
    if (!matched) return null;
    return chats.find((chat) => chat.id === matched[1]) ?? null;
  }, [chats, location.pathname]);

  useEffect(() => {
    if (!activeChat) return;

    const targetKey = activeChat.projectId ?? 'unassigned';
    setExpandedProjects((prev) => {
      if (prev[targetKey] !== false) return prev;
      return { ...prev, [targetKey]: true };
    });
  }, [activeChat]);

  return (
    <div className="flex h-screen w-full bg-bgLight font-sans antialiased text-primaryText overflow-hidden relative">
      {/* 侧边栏 */}
      <aside 
        style={{ width: isSidebarOpen ? sidebarWidth : 0 }}
        className={`relative bg-bgLight flex flex-col h-full flex-shrink-0 z-20 transition-[width,opacity] duration-300 ease-in-out overflow-hidden ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-full flex flex-col h-full">
          {/* Logo 区域 */}
<div className="mt-2 md:mt-3 flex h-16 items-center justify-between pl-5 pr-[10px]">
<div className="flex items-center gap-3 cursor-pointer min-w-0 flex-1" onClick={() => navigate('/chat/new')}>
<img src={logoIcon} alt="DepTrace Logo" className="h-[16px] w-[16px] shrink-0 flex-shrink-0" style={{ display: 'flex', alignItems: 'center' }} />
<span className="text-[18px] font-bold text-primaryText tracking-tight truncate leading-none">DepTrace</span>
</div>
            <div className="flex items-center gap-0 shrink-0">
              <button className="p-2 text-secondaryText hover:bg-[#e1e5ea] rounded-full transition-colors" title="搜索">
                <Search size={16} />
              </button>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-secondaryText hover:bg-[#e1e5ea] rounded-full transition-colors">
                <PanelLeftClose size={16} />
              </button>
            </div>
          </div>

          {/* 新建对话按钮 */}
          <div className="px-0 mb-0.5 mt-0.5">
            <button 
              onClick={() => navigate('/chat/new')}
              className={`nav-item ${location.pathname === '/chat/new' ? 'nav-item-active' : 'nav-item-inactive'}`}
            >
              <SquarePen size={14} />
              <span>发起新对话</span>
            </button>
          </div>

          {/* 主导航 */}
          <div className="px-0 flex flex-col gap-0.5 mb-4">
            {navItems.map(item => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* 对话历史 */}
          <div className="flex-1 overflow-y-auto px-0">
            <div className="text-sm font-normal text-secondaryText opacity-60 px-4 mb-1 mt-0.5">近期对话</div>
            
            {mockProjects.map(proj => {
              const projChats = chats.filter(c => c.projectId === proj.id);
              const isExpanded = expandedProjects[proj.id] !== false;
              
              return (
                <div key={proj.id} className="mb-0.5">
                  <div 
                    className="mx-[10px] flex items-center gap-2 pl-[8px] pr-4 py-2 text-sm font-normal text-secondaryText cursor-pointer hover:text-primaryText rounded-full hover:bg-[#e1e5ea] transition-colors"
                    onClick={() => toggleProject(proj.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown size={14} className="text-secondaryText shrink-0" />
                    ) : (
                      <ChevronRight size={14} className="text-secondaryText shrink-0" />
                    )}
                    <span className="truncate">{proj.name}</span>
                  </div>
                  
                  {isExpanded && projChats.length > 0 && (
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      {projChats.map(chat => {
                        const isActive = location.pathname === `/chat/${chat.id}`;
                        const isMenuOpen = chatMenuOpenId === chat.id;
                        return (
                          <div key={chat.id} className="relative">
                            <div 
                              onClick={() => navigate(`/chat/${chat.id}`)}
                              className={`mx-[10px] text-sm pl-[30px] pr-4 py-1.5 rounded-full cursor-pointer transition-colors flex items-center justify-between group ${
                                isActive ? 'text-primaryText bg-[#e1e5ea] font-normal' : 'text-secondaryText hover:text-primaryText hover:bg-[#e1e5ea] font-normal'
                              }`}
                            >
                              <span className="truncate">{chat.title}</span>
                              <div className="ml-2 shrink-0 flex items-center h-[14px]">
                                <span className={`text-xs opacity-60 ${isMenuOpen ? 'hidden' : 'group-hover:hidden'}`}>{chat.count}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setChatMenuOpenId(isMenuOpen ? null : chat.id);
                                  }}
                                  className={`flex items-center justify-center -mx-1 ${isMenuOpen ? 'block' : 'hidden group-hover:block'}`}
                                >
                                  <MoreHorizontal size={14} />
                                </button>
                              </div>
                            </div>
                            {isMenuOpen && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setChatMenuOpenId(null)}></div>
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-popover z-40 overflow-hidden py-2 animate-in fade-in slide-in-from-bottom-2">
                                  <div className="px-4 py-2.5 text-base text-primaryText hover:bg-bgLight cursor-pointer transition-colors flex items-center gap-3 rounded-lg mx-2">
                                    <Pencil size={16} />
                                    <span>重命名</span>
                                  </div>
                                  <div className="px-4 py-2.5 text-base text-primaryText hover:bg-bgLight cursor-pointer transition-colors flex items-center gap-3 rounded-lg mx-2">
                                    <Share2 size={16} />
                                    <span>分享对话</span>
                                  </div>
                                  <div
                                    onClick={() => handleDeleteChat(chat.id)}
                                    className="px-4 py-2.5 text-base text-red-600 hover:bg-red-50 cursor-pointer transition-colors flex items-center gap-3 rounded-lg mx-2"
                                  >
                                    <Trash2 size={16} />
                                    <span>删除</span>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 未分组对话 */}
            {(() => {
              const unassignedChats = chats.filter(c => !c.projectId);
              if (unassignedChats.length === 0) return null;
              const isExpanded = expandedProjects['unassigned'] !== false;

              return (
                <div className="mb-0.5 mt-1">
                  <div 
                    className="mx-[10px] flex items-center gap-2 pl-[8px] pr-4 py-2 text-sm font-normal text-secondaryText cursor-pointer hover:text-primaryText rounded-full hover:bg-[#e1e5ea] transition-colors"
                    onClick={() => toggleProject('unassigned')}
                  >
                    {isExpanded ? (
                      <ChevronDown size={14} className="text-secondaryText shrink-0" />
                    ) : (
                      <ChevronRight size={14} className="text-secondaryText shrink-0" />
                    )}
                    <span className="truncate">未分组对话</span>
                  </div>
                  
                  {isExpanded && (
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      {unassignedChats.map(chat => {
                        const isActive = location.pathname === `/chat/${chat.id}`;
                        const isMenuOpen = chatMenuOpenId === chat.id;
                        return (
                          <div key={chat.id} className="relative">
                            <div 
                              onClick={() => navigate(`/chat/${chat.id}`)}
                              className={`mx-[10px] text-sm pl-[30px] pr-4 py-1.5 rounded-full cursor-pointer transition-colors flex items-center justify-between group ${
                                isActive ? 'text-primaryText bg-[#e1e5ea] font-normal' : 'text-secondaryText hover:text-primaryText hover:bg-[#e1e5ea] font-normal'
                              }`}
                            >
                              <span className="truncate">{chat.title}</span>
                              <div className="ml-2 shrink-0 flex items-center h-[14px]">
                                <span className={`text-xs opacity-60 ${isMenuOpen ? 'hidden' : 'group-hover:hidden'}`}>{chat.count}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setChatMenuOpenId(isMenuOpen ? null : chat.id);
                                  }}
                                  className={`flex items-center justify-center -mx-1 ${isMenuOpen ? 'block' : 'hidden group-hover:block'}`}
                                >
                                  <MoreHorizontal size={14} />
                                </button>
                              </div>
                            </div>
                            {isMenuOpen && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setChatMenuOpenId(null)}></div>
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-popover z-40 overflow-hidden py-2 animate-in fade-in slide-in-from-bottom-2">
                                  <div className="px-4 py-2.5 text-base text-primaryText hover:bg-bgLight cursor-pointer transition-colors flex items-center gap-3 rounded-lg mx-2">
                                    <Pencil size={16} />
                                    <span>重命名</span>
                                  </div>
                                  <div className="px-4 py-2.5 text-base text-primaryText hover:bg-bgLight cursor-pointer transition-colors flex items-center gap-3 rounded-lg mx-2">
                                    <Share2 size={16} />
                                    <span>分享对话</span>
                                  </div>
                                  <div
                                    onClick={() => handleDeleteChat(chat.id)}
                                    className="px-4 py-2.5 text-base text-red-600 hover:bg-red-50 cursor-pointer transition-colors flex items-center gap-3 rounded-lg mx-2"
                                  >
                                    <Trash2 size={16} />
                                    <span>删除</span>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* 用户区域 */}
          <div className="p-3 mt-auto">
            <div 
              onClick={() => setShowSettings(true)}
              className="flex items-center justify-between p-2 rounded-full hover:bg-[#e1e5ea] transition-colors cursor-pointer text-secondaryText"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-medium">
                  研
                </div>
                <span className="text-sm font-normal">研究员</span>
              </div>
              <div className="p-1 rounded-full">
                <Settings size={18} />
              </div>
            </div>
          </div>
        </div>
        {isSidebarOpen && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="调整侧边栏宽度"
            onMouseDown={handleResizeStart}
            className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize bg-transparent"
          />
        )}
      </aside>

      {/* 主内容区 */}
      <main className={`flex-1 h-full overflow-hidden relative p-2 md:p-3 transition-all duration-300 ${isSidebarOpen ? 'pl-0 md:pl-0' : 'pl-2 md:pl-3'}`}>
        <div className="bg-white rounded-2xl md:rounded-3xl w-full h-full shadow-sm overflow-hidden border border-borderGray/50 relative">
          <div className="flex h-full w-full">
            {/* 展开侧边栏按钮 */}
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="absolute top-4 left-4 p-2 text-secondaryText hover:bg-bgLight rounded-full transition-colors z-10"
                title="展开边栏"
              >
                <Menu size={20} />
              </button>
            )}
            <Outlet context={{ isSidebarOpen, setIsSidebarOpen, chats, setChats }} />
          </div>
        </div>
      </main>

      {/* 设置弹窗 */}
      {showSettings && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)}></div>
          <div 
            className="absolute left-4 bottom-[72px] z-50 bg-white w-64 rounded-xl shadow-popover overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-bottom-left"
            onClick={e => e.stopPropagation()}
          >
            <div className="py-2 text-base text-primaryText font-normal space-y-1 px-2">
              <div className="px-3 py-2.5 hover:bg-bgLight cursor-pointer transition-colors flex justify-between items-center rounded-lg">
                <span>配置模型</span>
                <span className="text-tertiaryText text-sm font-normal">DeepSeek-V3</span>
              </div>
              <div className="px-3 py-2.5 hover:bg-bgLight cursor-pointer transition-colors flex justify-between items-center rounded-lg">
                <span>用量限额</span>
                <span className="text-tertiaryText text-sm font-normal">剩余 89%</span>
              </div>
              <div className="px-3 py-2.5 hover:bg-bgLight cursor-pointer transition-colors flex justify-between items-center rounded-lg">
                <span>成员管理</span>
                <span className="text-tertiaryText text-sm font-normal">5 人</span>
              </div>
              <div className="px-3 py-2.5 text-primaryText hover:bg-bgLight cursor-pointer transition-colors flex justify-between items-center rounded-lg">
                <span>更多系统设置</span>
                <Settings size={16} className="text-tertiaryText" />
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2.5 text-red-600 hover:bg-red-50 cursor-pointer transition-colors font-medium rounded-lg"
              >
                退出登录
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}