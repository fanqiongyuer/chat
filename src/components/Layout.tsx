import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Folder, Clock3, Settings, Search, ChevronDown, ChevronRight, PanelLeftClose, Menu, SquarePen, MoreHorizontal, Pencil, Share2, Trash2, Pin, AlertTriangle } from 'lucide-react';
import { BaseActionMenu, BaseEmpty, BaseModal } from './common';
import type { BaseActionMenuItem, BaseActionMenuProps } from './common';
import { mockProjects } from '../mock/projects';
import { mockChats, type MockChat } from '../mock/chats';

const logoIcon = new URL('../assets/deptrace-logo.png', import.meta.url).href;
export interface LayoutOutletContext {
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  chats: MockChat[];
  setChats: React.Dispatch<React.SetStateAction<MockChat[]>>;
  setAiUsageWarningActive: React.Dispatch<React.SetStateAction<boolean>>;
}

const AUTH_STORAGE_KEY = 'deeptrace-authenticated';
const AUTH_SESSION_KEY = 'deeptrace-authenticated-session';
const CHATS_STORAGE_KEY = 'deeptrace-chats';
const CHAT_MESSAGES_STORAGE_KEY = 'deeptrace-chat-messages';
const MAX_RECENT_CHATS = 10;
const TASK_DEMO_CHAT_ID = 'task-demo-1';
const AI_USAGE_ACCOUNT_BALANCE_BASE = 40_000_000;

const generateMockMonthTrendPoints = (monthValue: string, memberFactor = 1): number[] => {
  const [yearText, monthText] = monthValue.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const daysInMonth = new Date(year, month, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const weekDay = new Date(year, month - 1, day).getDay();
    const isWeekend = weekDay === 0 || weekDay === 6;
    const base = 84_000 + ((month * 19 + day * 11) % 7) * 4_300;
    const wave = 1 + Math.sin((day / daysInMonth) * Math.PI * 2) * 0.16;
    const weekendFactor = isWeekend ? 0.72 : 1;
    return Math.round(base * wave * weekendFactor * memberFactor);
  });
};

const calculateIsAiUsageBudgetLow = () => {
  const now = new Date();
  const monthValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const summaryTrendPoints = generateMockMonthTrendPoints(monthValue, 1);
  const summaryMonthlyTotal = summaryTrendPoints.reduce((sum, point) => sum + point, 0);
  const summarySevenDayTotal = summaryTrendPoints.slice(-7).reduce((sum, point) => sum + point, 0);
  const accountBalance = Math.max(0, AI_USAGE_ACCOUNT_BALANCE_BASE - summaryMonthlyTotal);
  const summaryDailyAvg = summarySevenDayTotal / 7;

  if (summaryDailyAvg <= 0) return false;

  // Keep mock behavior aligned with AiUsagePage for warning display.
  const remainingDays = Math.min(7, Math.max(0, Math.floor(accountBalance / summaryDailyAvg)));
  return remainingDays <= 7;
};

const TASK_DEMO_CHAT: MockChat =
  mockChats.find((chat) => chat.id === TASK_DEMO_CHAT_ID) ?? {
    id: TASK_DEMO_CHAT_ID,
    title: '肿瘤免疫文献订阅（Mock）',
    date: '刚刚',
    count: 12,
    isTaskConversation: true,
    taskId: 'task-5',
    source: 'task',
  };

const isTaskConversationChat = (chat: MockChat) =>
  chat.isTaskConversation === true ||
  chat.source === 'task' ||
  chat.id.startsWith('task-') ||
  (typeof chat.taskId === 'string' && chat.taskId.trim().length > 0);

const ensureTaskDemoChat = (chats: MockChat[]) => {
  if (chats.some(isTaskConversationChat)) {
    return chats;
  }

  return [TASK_DEMO_CHAT, ...chats.filter((chat) => chat.id !== TASK_DEMO_CHAT_ID)];
};

function loadChatsFromStorage(): MockChat[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(CHATS_STORAGE_KEY);
    if (!raw) return ensureTaskDemoChat([]);

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return ensureTaskDemoChat([]);

    const normalizedChats = parsed
      .filter((chat) => chat && typeof chat === 'object')
      .map((chat) => {
        const id = typeof chat.id === 'string' ? chat.id : '';
        const title = typeof chat.title === 'string' ? chat.title : '';
        const date = typeof chat.date === 'string' ? chat.date : '刚刚';
        const count = typeof chat.count === 'number' ? chat.count : 0;
        const projectId = typeof chat.projectId === 'string' ? chat.projectId : undefined;
        const isPinned = chat.isPinned === true;
        const taskId = typeof chat.taskId === 'string' ? chat.taskId : undefined;
        const source = typeof chat.source === 'string' ? chat.source : undefined;
        const isTaskConversation =
          chat.isTaskConversation === true ||
          source === 'task' ||
          id.startsWith('task-') ||
          (typeof taskId === 'string' && taskId.trim().length > 0);

        return {
          id,
          title,
          date,
          count,
          projectId,
          isPinned,
          taskId,
          source,
          isTaskConversation,
        } as MockChat;
      })
      .filter((chat) => chat.id && chat.title);

    return ensureTaskDemoChat(normalizedChats);
  } catch {
    return ensureTaskDemoChat([]);
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
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [chats, setChats] = useState<MockChat[]>(() => loadChatsFromStorage());
  const [chatMenuOpenId, setChatMenuOpenId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<'time' | 'project'>('time');
  const [isSidebarScrolling, setIsSidebarScrolling] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingChatTitle, setEditingChatTitle] = useState('');
  const [showAllChatsModal, setShowAllChatsModal] = useState(false);
  const [allChatsKeyword, setAllChatsKeyword] = useState('');
  const [isAllChatsModalScrolling, setIsAllChatsModalScrolling] = useState(false);
  const [aiUsageWarningActive, setAiUsageWarningActive] = useState(() => calculateIsAiUsageBudgetLow());
  const [aiUsageWarningDismissed, setAiUsageWarningDismissed] = useState(false);
  const chatRenameInputRef = useRef<HTMLInputElement | null>(null);
  const sidebarScrollTimerRef = useRef<number | null>(null);
  const allChatsScrollTimerRef = useRef<number | null>(null);

  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    setSettingsMenuOpen(false);
    navigate('/login', { replace: true });
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  const handleDeleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    setChatMenuOpenId(null);

    if (editingChatId === chatId) {
      setEditingChatId(null);
      setEditingChatTitle('');
    }

    removeChatMessagesFromStorage(chatId);

    const activeChatId = location.pathname.match(/^\/chat\/([^/]+)$/)?.[1];
    if (activeChatId === chatId) {
      navigate('/chat/new', { replace: true });
    }
  };

  const handleTogglePinChat = (chatId: string) => {
    setChats((prev) => {
      const target = prev.find((chat) => chat.id === chatId);
      if (!target) return prev;

      const toggledPinned = !target.isPinned;
      const updated = prev.map((chat) =>
        chat.id === chatId ? { ...chat, isPinned: toggledPinned } : chat,
      );

      const pinned = updated.filter((chat) => chat.isPinned);
      const unpinned = updated.filter((chat) => !chat.isPinned);
      return [...pinned, ...unpinned];
    });
    setChatMenuOpenId(null);
  };

  const startChatRename = (chat: MockChat) => {
    setEditingChatId(chat.id);
    setEditingChatTitle(chat.title);
    setChatMenuOpenId(null);
  };

  const cancelChatRename = () => {
    setEditingChatId(null);
    setEditingChatTitle('');
  };

  const commitChatRename = (chatId: string) => {
    const nextTitle = editingChatTitle.trim();

    if (nextTitle) {
      setChats((prev) => prev.map((chat) => (
        chat.id === chatId ? { ...chat, title: nextTitle } : chat
      )));
    }

    cancelChatRename();
  };

  const handleChatTitleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, chatId: string) => {
    event.stopPropagation();

    if (event.key === 'Enter') {
      event.preventDefault();
      commitChatRename(chatId);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      cancelChatRename();
    }
  };

  const handleChatRowClick = (chatId: string) => {
    if (editingChatId === chatId) {
      chatRenameInputRef.current?.focus();
      return;
    }
    navigate(`/chat/${chatId}`);
  };

  const renderChatTitle = (chat: MockChat, withPinIcon = false) => {
    const isEditing = editingChatId === chat.id;

    if (isEditing) {
      return (
        <div
          className="flex min-w-0 items-center gap-2 flex-1"
          onClick={(event) => {
            event.stopPropagation();
            chatRenameInputRef.current?.focus();
          }}
        >
          {withPinIcon && <Pin size={14} className="shrink-0" />}
          <input
            ref={chatRenameInputRef}
            value={editingChatTitle}
            onChange={(event) => setEditingChatTitle(event.target.value)}
            onKeyDown={(event) => handleChatTitleKeyDown(event, chat.id)}
            onBlur={() => commitChatRename(chat.id)}
            onClick={(event) => event.stopPropagation()}
            className="w-full bg-transparent px-0 text-sm text-primaryText outline-none"
            maxLength={80}
            aria-label="重命名对话"
          />
        </div>
      );
    }

    return (
      <div className="flex min-w-0 items-center gap-2 flex-1">
        {withPinIcon && <Pin size={14} className="shrink-0" />}
        <span className="truncate">{chat.title}</span>
      </div>
    );
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

  useEffect(() => {
    if (!editingChatId) return;

    const frameId = window.requestAnimationFrame(() => {
      chatRenameInputRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [editingChatId]);

  useEffect(() => {
    return () => {
      if (sidebarScrollTimerRef.current !== null) {
        window.clearTimeout(sidebarScrollTimerRef.current);
      }
      if (allChatsScrollTimerRef.current !== null) {
        window.clearTimeout(allChatsScrollTimerRef.current);
      }
    };
  }, []);

  const handleSidebarScroll = () => {
    setIsSidebarScrolling(true);
    if (sidebarScrollTimerRef.current !== null) {
      window.clearTimeout(sidebarScrollTimerRef.current);
    }
    sidebarScrollTimerRef.current = window.setTimeout(() => {
      setIsSidebarScrolling(false);
    }, 600);
  };

  const handleAllChatsModalScroll = () => {
    setIsAllChatsModalScrolling(true);
    if (allChatsScrollTimerRef.current !== null) {
      window.clearTimeout(allChatsScrollTimerRef.current);
    }
    allChatsScrollTimerRef.current = window.setTimeout(() => {
      setIsAllChatsModalScrolling(false);
    }, 600);
  };

  useEffect(() => {
    if (!aiUsageWarningActive) {
      setAiUsageWarningDismissed(false);
    }
  }, [aiUsageWarningActive]);

  const handleAiUsageWarningClick = () => {
    setAiUsageWarningDismissed(true);
    navigate('/ai-usage');
  };

  const settingsMenuItems = useMemo<BaseActionMenuItem[]>(() => [
    {
      key: 'skills',
      label: 'Skill',
    },
    {
      key: 'ai-usage',
      label: 'AI用量',
    },
    {
      key: 'members',
      label: '成员管理',
    },
    {
      key: 'system-settings',
      label: '更多系统设置',
    },
    {
      key: 'logout',
      label: '退出登录',
      danger: true,
    },
  ], []);

  const handleSettingsMenuItemClick: BaseActionMenuProps['onItemClick'] = (item) => {
    setSettingsMenuOpen(false);

    if (item.key === 'skills') {
      navigate('/skills');
      return;
    }

    if (item.key === 'ai-usage') {
      navigate('/ai-usage');
      return;
    }

    if (item.key === 'members') {
      navigate('/members');
      return;
    }

    if (item.key === 'system-settings') {
      navigate('/system-settings');
      return;
    }

    if (item.key === 'logout') {
      handleLogout();
    }
  };

  const chatMenuFooterItems = useMemo<BaseActionMenuItem[]>(() => [
    {
      key: 'delete',
      label: '删除',
      icon: <Trash2 size={14} />,
      danger: true,
    },
  ], []);

  const buildChatMenuItems = (chat: MockChat): BaseActionMenuItem[] => [
    {
      key: 'rename',
      label: '重命名',
      icon: <Pencil size={14} />,
    },
    {
      key: 'share',
      label: '分享对话',
      icon: <Share2 size={14} />,
    },
    {
      key: 'pin',
      label: chat.isPinned ? '取消置顶' : '置顶对话',
      icon: <Pin size={14} />,
    },
  ];

  const renderChatActionControl = (chat: MockChat, isMenuOpen: boolean) => {
    const isTaskChat = isTaskConversationChat(chat);

    return (
      <div className={`relative shrink-0 flex h-5 w-5 items-center justify-center ${isTaskChat ? 'ml-6' : 'ml-2'}`}>
        {isTaskChat && !isMenuOpen && (
          <span className="pointer-events-none absolute right-0 shrink-0 whitespace-nowrap rounded-full bg-[#E4E7EC] px-1.5 py-0.5 text-[11px] leading-[14px] text-[#667085] transition-opacity group-hover:opacity-0">
            任务
          </span>
        )}
        <BaseActionMenu
          open={isMenuOpen}
          onOpenChange={(open) => setChatMenuOpenId(open ? chat.id : null)}
          placement="bottom-end"
          width={Math.max(140, Math.min(176, sidebarWidth - 56))}
          trigger={<MoreHorizontal size={14} />}
          onTriggerClick={(event) => {
            event.stopPropagation();
          }}
          items={buildChatMenuItems(chat)}
          footerItems={chatMenuFooterItems}
          onItemClick={(item, event) => {
            event.stopPropagation();
            if (item.key === 'rename') {
              startChatRename(chat);
              return;
            }
            if (item.key === 'share') {
              navigate(`/chat/${chat.id}?share=1`);
              setChatMenuOpenId(null);
              return;
            }
            if (item.key === 'pin') {
              handleTogglePinChat(chat.id);
              return;
            }
            if (item.key === 'delete') {
              handleDeleteChat(chat.id);
              return;
            }
            setChatMenuOpenId(null);
          }}
          triggerClassName={`h-5 w-5 items-center justify-center ${isMenuOpen ? 'inline-flex' : 'hidden group-hover:inline-flex'}`}
          className="relative z-40"
          menuClassName="!min-w-0 !right-[-6px]"
        />
      </div>
    );
  };

  const navItems = [
    {
      label: '项目',
      icon: <Folder size={14} />,
      path: '/projects',
      isActive: location.pathname === '/projects' || location.pathname.startsWith('/project/'),
    },
    {
      label: '任务',
      icon: <Clock3 size={14} />,
      path: '/tools',
      isActive: location.pathname === '/tools' || location.pathname.startsWith('/tool/'),
    },
  ];

  const activeChat = useMemo(() => {
    const matched = location.pathname.match(/^\/chat\/([^/]+)$/);
    if (!matched) return null;
    return chats.find((chat) => chat.id === matched[1]) ?? null;
  }, [chats, location.pathname]);

  const pinnedChats = useMemo(
    () => chats.filter((chat) => chat.isPinned),
    [chats],
  );

  const timeSortedUnpinnedChats = useMemo(
    () => chats
      .filter((chat) => !chat.isPinned)
      .slice()
      .sort((a, b) => b.id.localeCompare(a.id)),
    [chats],
  );

  const visiblePinnedChats = useMemo(
    () => (sortMode === 'time' ? pinnedChats.slice(0, MAX_RECENT_CHATS) : pinnedChats),
    [pinnedChats, sortMode],
  );

  const visibleTimeChats = useMemo(() => {
    if (sortMode !== 'time') return [];
    const availableSlots = Math.max(MAX_RECENT_CHATS - visiblePinnedChats.length, 0);
    return timeSortedUnpinnedChats.slice(0, availableSlots);
  }, [sortMode, timeSortedUnpinnedChats, visiblePinnedChats.length]);

  const totalVisibleRecentChats = useMemo(
    () => visiblePinnedChats.length + visibleTimeChats.length,
    [visiblePinnedChats.length, visibleTimeChats.length],
  );

  const shouldShowViewAllChatsEntry = sortMode === 'time' && chats.length > totalVisibleRecentChats;

  const projectNameById = useMemo(() => {
    return new Map(mockProjects.map((project) => [project.id, project.name]));
  }, []);

  const allChatsSorted = useMemo(() => {
    return chats.slice().sort((a, b) => b.id.localeCompare(a.id));
  }, [chats]);

  const normalizedAllChatsKeyword = allChatsKeyword.trim().toLowerCase();

  const filteredAllChats = useMemo(() => {
    if (!normalizedAllChatsKeyword) return allChatsSorted;

    return allChatsSorted.filter((chat) => {
      const projectName = chat.projectId ? (projectNameById.get(chat.projectId) ?? '未分组') : '未分组';
      const searchableText = `${chat.title} ${projectName} ${chat.date}`.toLowerCase();
      return searchableText.includes(normalizedAllChatsKeyword);
    });
  }, [allChatsSorted, normalizedAllChatsKeyword, projectNameById]);

  useEffect(() => {
    if (!activeChat) return;

    const targetKey = activeChat.projectId ?? 'unassigned';
    setExpandedProjects((prev) => {
      if (prev[targetKey] !== false) return prev;
      return { ...prev, [targetKey]: true };
    });
  }, [activeChat]);

  const handleOpenAllChatsModal = () => {
    setAllChatsKeyword('');
    setShowAllChatsModal(true);
  };

  const handleCloseAllChatsModal = () => {
    setShowAllChatsModal(false);
    setIsAllChatsModalScrolling(false);
    if (allChatsScrollTimerRef.current !== null) {
      window.clearTimeout(allChatsScrollTimerRef.current);
      allChatsScrollTimerRef.current = null;
    }
  };

  const handleOpenChatFromModal = (chatId: string) => {
    setShowAllChatsModal(false);
    navigate(`/chat/${chatId}`);
  };

  return (
    <div className="flex h-screen w-full bg-bgLight font-sans antialiased text-primaryText overflow-hidden relative">
      {/* 侧边栏 */}
      <aside 
        style={{ width: isSidebarOpen ? sidebarWidth : 0 }}
        className={`relative bg-bgLight flex flex-col h-full flex-shrink-0 z-20 transition-[width,opacity] duration-300 ease-in-out overflow-y-hidden overflow-x-visible ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-full flex flex-col h-full">
          {/* Logo 区域 */}
<div className="mt-2 md:mt-3 flex h-16 items-center justify-between pl-5 pr-[10px]">
<div className="-ml-[3px] flex items-center gap-2 cursor-pointer min-w-0 flex-1" onClick={() => navigate('/chat/new')}>
<img src={logoIcon} alt="Helia Logo" className="h-[20px] w-[20px] shrink-0 flex-shrink-0" style={{ display: 'flex', alignItems: 'center' }} />
<span className="text-[18px] font-bold text-primaryText tracking-tight truncate leading-none">Helia</span>
</div>
            <div className="flex items-center gap-0 shrink-0">
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-secondaryText hover:bg-bgLight rounded-full transition-colors">
                <PanelLeftClose size={16} />
              </button>
            </div>
          </div>

          {/* 新建对话按钮 */}
          <div className="px-0 mb-0.5 mt-0.5">
            <button 
              onClick={() => navigate('/chat/new')}
              className={`nav-item ${
                location.pathname === '/chat/new'
                  ? 'bg-[#E4EAF0] text-primaryText'
                  : 'text-secondaryText hover:bg-[#E4EAF0] hover:text-primaryText'
              }`}
            >
              <SquarePen size={14} />
              <span>发起新对话</span>
            </button>
          </div>

          {/* 主导航 */}
          <div className="px-0 flex flex-col gap-0.5 mb-4">
            {navItems.map(item => {
              const isActive = item.isActive;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`nav-item ${
                    isActive
                      ? 'bg-[#E4EAF0] text-primaryText'
                      : 'text-secondaryText hover:bg-[#E4EAF0] hover:text-primaryText'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* 对话历史 */}
          <div
            onScroll={handleSidebarScroll}
            className={`flex-1 overflow-y-auto px-0 relative auto-hide-scrollbar ${
              isSidebarScrolling ? 'is-scrolling is-scrolling-thin' : ''
            }`}
          >
            <div className="sticky top-0 z-20 bg-bgLight px-[10px] pb-4 pt-0.5">
              <div className="flex items-center pl-[8px] pr-4 text-sm font-normal text-secondaryText">
                <span className="opacity-60">近期对话</span>
              </div>
            </div>
            
            {visiblePinnedChats.length > 0 && (
              <div className="mb-1">
                <div className="flex flex-col gap-0.5 mt-0.5">
                  {visiblePinnedChats.map((chat) => {
                    const isActive = location.pathname === `/chat/${chat.id}`;
                    const isMenuOpen = chatMenuOpenId === chat.id;

                    return (
                      <div key={chat.id} className="relative">
                        <div
                          onClick={() => handleChatRowClick(chat.id)}
                          className={`mx-[10px] text-sm pl-[10px] pr-2 py-1.5 rounded-md cursor-pointer transition-colors flex items-center justify-between group ${
                            editingChatId === chat.id
                              ? 'text-primaryText bg-bgLight font-normal border border-[#22c55e]'
                              : isActive
                                ? 'text-primaryText bg-[#E4EAF0] font-normal'
                                : 'text-secondaryText hover:text-primaryText hover:bg-[#E4EAF0] font-normal'
                          }`}
                        >
                          {renderChatTitle(chat, sortMode !== 'time')}
                          {editingChatId !== chat.id && renderChatActionControl(chat, isMenuOpen)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mx-[10px] my-2 border-t border-borderGray/80" />
              </div>
            )}

            {sortMode === 'project' && mockProjects.map(proj => {
              const projChats = chats.filter((c) => c.projectId === proj.id && !c.isPinned);
              const isExpanded = expandedProjects[proj.id] !== false;
              
              return (
                <div key={proj.id} className="mb-0.5">
                  <div 
                    className="group mx-[10px] flex items-center gap-2 pl-[8px] pr-4 py-2 text-sm font-normal text-secondaryText cursor-pointer hover:text-primaryText rounded-md hover:bg-bgLight transition-colors"
                    onClick={() => toggleProject(proj.id)}
                  >
                    <div className="relative h-[14px] w-[14px] shrink-0">
                      <Folder size={14} className="text-secondaryText transition-opacity group-hover:opacity-0" />
                      <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                        {isExpanded ? (
                          <ChevronDown size={14} className="text-secondaryText" />
                        ) : (
                          <ChevronRight size={14} className="text-secondaryText" />
                        )}
                      </span>
                    </div>
                    <span className="truncate">{proj.name}</span>
                  </div>
                  
                  {isExpanded && (
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      {projChats.length === 0 ? (
                        <div className="mx-[10px] text-sm pl-[30px] pr-4 py-1.5 text-tertiaryText/80">暂无对话</div>
                      ) : projChats.map(chat => {
                        const isActive = location.pathname === `/chat/${chat.id}`;
                        const isMenuOpen = chatMenuOpenId === chat.id;
                        return (
                          <div key={chat.id} className="relative">
                            <div 
                              onClick={() => handleChatRowClick(chat.id)}
                              className={`mx-[10px] text-sm pl-[30px] pr-2 py-1.5 rounded-md cursor-pointer transition-colors flex items-center justify-between group ${
                                editingChatId === chat.id
                                  ? 'text-primaryText bg-bgLight font-normal border border-[#22c55e]'
                                  : isActive
                                    ? 'text-primaryText bg-[#E4EAF0] font-normal'
                                    : 'text-secondaryText hover:text-primaryText hover:bg-[#E4EAF0] font-normal'
                              }`}
                            >
                              {renderChatTitle(chat)}
                              {editingChatId !== chat.id && renderChatActionControl(chat, isMenuOpen)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 未分组对话 */}
            {sortMode === 'project' && (() => {
              const unassignedChats = chats.filter((c) => !c.projectId && !c.isPinned);
              if (unassignedChats.length === 0) return null;
              const isExpanded = expandedProjects['unassigned'] !== false;

              return (
                <div className="mb-0.5 mt-1">
                  <div 
                    className="group mx-[10px] flex items-center gap-2 pl-[8px] pr-4 py-2 text-sm font-normal text-secondaryText cursor-pointer hover:text-primaryText rounded-md hover:bg-bgLight transition-colors"
                    onClick={() => toggleProject('unassigned')}
                  >
                    <div className="relative h-[14px] w-[14px] shrink-0">
                      <Folder size={14} className="text-secondaryText transition-opacity group-hover:opacity-0" />
                      <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                        {isExpanded ? (
                          <ChevronDown size={14} className="text-secondaryText" />
                        ) : (
                          <ChevronRight size={14} className="text-secondaryText" />
                        )}
                      </span>
                    </div>
                    <span className="truncate">未分组对话</span>
                  </div>
                  
                  {isExpanded && (
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      {unassignedChats.length === 0 ? (
                        <div className="mx-[10px] text-sm pl-[30px] pr-4 py-1.5 text-tertiaryText/80">暂无对话</div>
                      ) : unassignedChats.map(chat => {
                        const isActive = location.pathname === `/chat/${chat.id}`;
                        const isMenuOpen = chatMenuOpenId === chat.id;
                        return (
                          <div key={chat.id} className="relative">
                            <div 
                              onClick={() => handleChatRowClick(chat.id)}
                              className={`mx-[10px] text-sm pl-[30px] pr-2 py-1.5 rounded-md cursor-pointer transition-colors flex items-center justify-between group ${
                                editingChatId === chat.id
                                  ? 'text-primaryText bg-bgLight font-normal border border-[#22c55e]'
                                  : isActive
                                    ? 'text-primaryText bg-[#E4EAF0] font-normal'
                                    : 'text-secondaryText hover:text-primaryText hover:bg-[#E4EAF0] font-normal'
                              }`}
                            >
                              {renderChatTitle(chat)}
                              {editingChatId !== chat.id && renderChatActionControl(chat, isMenuOpen)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 按时间排序视图 */}
            {sortMode === 'time' && (
              <div className="flex flex-col gap-0.5">
                {visibleTimeChats.map(chat => {
                  const isActive = location.pathname === `/chat/${chat.id}`;
                  const isMenuOpen = chatMenuOpenId === chat.id;
                  return (
                    <div key={chat.id} className="relative">
                      <div 
                        onClick={() => handleChatRowClick(chat.id)}
                        className={`mx-[10px] text-sm pl-[10px] pr-2 py-1.5 rounded-md cursor-pointer transition-colors flex items-center justify-between group ${
                          editingChatId === chat.id
                            ? 'text-primaryText bg-bgLight font-normal border border-[#22c55e]'
                            : isActive
                              ? 'text-primaryText bg-[#E4EAF0] font-normal'
                              : 'text-secondaryText hover:text-primaryText hover:bg-[#E4EAF0] font-normal'
                        }`}
                      >
                        {renderChatTitle(chat)}
                        {editingChatId !== chat.id && renderChatActionControl(chat, isMenuOpen)}
                      </div>
                    </div>
                  );
                })}

                {shouldShowViewAllChatsEntry && (
                  <button
                    type="button"
                    onClick={handleOpenAllChatsModal}
                    className="mx-[10px] mt-1 inline-flex items-center gap-1 rounded-md px-[10px] py-1.5 text-left text-sm text-secondaryText transition-colors hover:bg-[#E4EAF0] hover:text-primaryText"
                  >
                    <span>查看全部对话</span>
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            )}
          </div>

          {aiUsageWarningActive && !aiUsageWarningDismissed && (
            <div className="mx-3 mb-2 rounded-[12px] bg-white p-2 shadow-[0_6px_20px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
                  <AlertTriangle size={15} style={{ fill: 'var(--color-warning)', stroke: '#ffffff' }} />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-primaryText">用量即将耗尽</span>
                <button
                  type="button"
                  onClick={handleAiUsageWarningClick}
                  className="ml-auto shrink-0 whitespace-nowrap rounded-[8px] bg-[var(--color-warning)] px-3 py-1 text-xs font-medium text-white transition-colors hover:opacity-90"
                >
                  去查看
                </button>
              </div>
            </div>
          )}

          {/* 用户区域 */}
          <div className="p-3 mt-auto">
            <BaseActionMenu
              open={settingsMenuOpen}
              onOpenChange={setSettingsMenuOpen}
              placement="top-start"
              width="100%"
              trigger={
                <span className="flex w-full items-center justify-between p-2 rounded-full hover:bg-bgLight transition-colors cursor-pointer text-secondaryText">
                  <span className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-medium">
                      研
                    </span>
                    <span className="text-sm font-normal">研究员</span>
                  </span>
                  <span className="p-1 rounded-full">
                    <Settings size={18} />
                  </span>
                </span>
              }
              items={settingsMenuItems}
              onItemClick={handleSettingsMenuItemClick}
              triggerClassName="w-full justify-start"
              className="w-full"
              menuClassName="!min-w-0"
            />
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
        <div className="bg-white rounded-xl md:rounded-2xl w-full h-full shadow-sm overflow-hidden border border-borderGray/50 relative">
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
            <Outlet context={{ isSidebarOpen, setIsSidebarOpen, chats, setChats, setAiUsageWarningActive }} />
          </div>
        </div>
      </main>

      <BaseModal
        visible={showAllChatsModal}
        title="全部历史对话"
        width={640}
        footer={null}
        onCancel={handleCloseAllChatsModal}
        className="!overflow-y-hidden"
        bodyClassName="!overflow-hidden !px-6 !py-5"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tertiaryText"
            />
            <input
              type="text"
              value={allChatsKeyword}
              onChange={(event) => setAllChatsKeyword(event.target.value)}
              placeholder="搜索对话或项目"
              className="h-9 w-full rounded-lg border border-[var(--color-line-subtle)] bg-white pl-9 pr-3 text-sm text-primaryText transition-colors placeholder:text-tertiaryText hover:border-[var(--color-gray-3)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          {filteredAllChats.length > 0 ? (
            <div
              onScroll={handleAllChatsModalScroll}
              className={`max-h-[440px] overflow-y-auto auto-hide-scrollbar ${
                isAllChatsModalScrolling ? 'is-scrolling is-scrolling-thin' : ''
              }`}
            >
              {filteredAllChats.map((chat) => {
                const projectName = chat.projectId ? (projectNameById.get(chat.projectId) ?? '未分组') : '未分组';
                const isTaskChat = isTaskConversationChat(chat);

                return (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => handleOpenChatFromModal(chat.id)}
                    className="w-full rounded-lg px-4 py-3 text-left transition-colors hover:bg-[#F8FAFC]"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-medium text-primaryText">{chat.title}</span>
                      {isTaskChat && (
                        <span className="shrink-0 rounded-full bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] leading-[14px] text-[#7A869A]">
                          任务
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-tertiaryText">
                      <span className="truncate">{projectName}</span>
                      <span>·</span>
                      <span>{chat.date}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[var(--color-border-soft)]">
              <BaseEmpty description="暂无匹配的历史对话" />
            </div>
          )}
        </div>
      </BaseModal>
    </div>
  );
}