import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useOutletContext, useLocation } from 'react-router-dom';
import { Menu, Folder, ChevronDown, ChevronRight, Plus, FileText, FlaskConical, Search, X, Copy, Check } from 'lucide-react';
import MessageItem from '../components/chat/MessageItem';
import InputArea from '../components/chat/InputArea';
import type { InputAttachment, InputSendPayload } from '../components/chat/InputArea';
import QuickPrompts from '../components/chat/QuickPrompts';
import ThinkingIndicator, { type StatusPhase, type SearchStep } from '../components/chat/ThinkingIndicator';
import { ChatStreamError, streamChatResponse } from '../mock/mockApi';
import { EXPERIMENTS_BY_PROJECT, KNOWLEDGE_BY_PROJECT, mockProjects } from '../mock/projects';
import { type MockChat } from '../mock/chats';
import { BaseActionMenu, BaseButton, BaseInput, BaseModal } from '../components';
import type { BaseActionMenuItem, BaseActionMenuProps } from '../components';
import { type LayoutOutletContext } from '../components/Layout';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  attachments?: InputAttachment[];
  references?: InputSendPayload['references'];
}

type AssistantFeedback = 'like' | 'dislike';

const CHAT_MESSAGES_STORAGE_KEY = 'deeptrace-chat-messages';

function loadChatMessagesFromStorage(): Record<string, Message[]> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(CHAT_MESSAGES_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return {};

    const normalized: Record<string, Message[]> = {};

    Object.entries(parsed).forEach(([chatKey, value]) => {
      if (!Array.isArray(value)) return;

      const safeMessages = value
        .filter((item) => item && typeof item === 'object')
        .map((item) => {
          const role = (item as { role?: string }).role;
          const content = (item as { content?: string }).content;
          const attachments = (item as { attachments?: InputAttachment[] }).attachments;
          const references = (item as { references?: InputSendPayload['references'] }).references;

          if ((role === 'user' || role === 'assistant') && typeof content === 'string') {
            return {
              role,
              content,
              attachments: Array.isArray(attachments) ? attachments : [],
              references: Array.isArray(references) ? references : [],
            } as Message;
          }

          return null;
        })
        .filter((item): item is Message => item !== null);

      if (safeMessages.length > 0) {
        normalized[chatKey] = safeMessages;
      }
    });

    return normalized;
  } catch {
    return {};
  }
}

interface Project {
  id: string;
  name: string;
  desc: string;
  count: number;
  knowledge: number;
  members: number;
  visibility?: 'private' | 'public';
  privateType?: 'team' | 'personal';
}

type KnowledgeCategory = '方法' | '经验' | '文献';

interface ProjectKnowledgeDoc {
  id: string;
  category: KnowledgeCategory;
  title: string;
  source: string;
  referenceCount: number;
}

interface ProjectExperimentLog {
  id: string;
  date: string;
  status: string;
  summary: string;
}

interface ProjectExperiment {
  id: string;
  title: string;
  logs: ProjectExperimentLog[];
}

interface ProjectAttachmentContent {
  knowledgeDocs: ProjectKnowledgeDoc[];
  experiments: ProjectExperiment[];
}

interface ProjectKnowledgeListItem {
  id: string;
  title: string;
  summary: string;
  tags: string[];
}

interface ProjectExperimentListItem {
  id: string;
  title: string;
  summary: string;
  status: string;
  tags: string[];
}

interface ProjectPanelContent {
  knowledgeDocs: ProjectKnowledgeListItem[];
  experiments: ProjectExperimentListItem[];
}

type PreviewItemType = 'knowledge' | 'experiment-log';

interface PreviewItem {
  key: string;
  type: PreviewItemType;
  title: string;
  subtitle: string;
  content: string;
  status?: string;
}

interface ChatTimelineItem {
  messageIndex: number;
  preview: string;
}

const mockAttachmentByProjectId: Record<string, ProjectAttachmentContent> = {
  'p-crispr': {
    knowledgeDocs: [
      { id: 'k-crispr-1', category: '方法', title: '细胞最新的定量分析方法', source: '周妍', referenceCount: 12 },
      { id: 'k-crispr-2', category: '经验', title: '细胞股前期的实验经验总结', source: '项目组复盘会', referenceCount: 8 },
      { id: 'k-crispr-3', category: '文献', title: '细胞裂解方式对比分析', source: 'Nature Methods', referenceCount: 15 },
      { id: 'k-crispr-4', category: '文献', title: 'EOO 细胞裂解方式研究', source: 'Cell Reports', referenceCount: 9 },
    ],
    experiments: [
      {
        id: 'exp-crispr-1',
        title: '胃癌模型激活 HB 治疗方案探索',
        logs: [
          { id: 'exp-crispr-1-log-1', date: '2026.06.03', status: '实验结束', summary: '南方的实验结论总结' },
          { id: 'exp-crispr-1-log-2', date: '2026.06.02', status: '湿试验记录', summary: '南方的实验内容总结' },
          { id: 'exp-crispr-1-log-3', date: '2026.06.01', status: '湿试验记录', summary: '南方的实验内容总结' },
          { id: 'exp-crispr-1-log-4', date: '2026.05.31', status: '干试验模拟', summary: '干试验可行性论证通过' },
          { id: 'exp-crispr-1-log-5', date: '2026.05.29', status: '修改试验方案', summary: '参数阈值完成调整' },
          { id: 'exp-crispr-1-log-6', date: '2026.05.29', status: '创建试验方案', summary: '创建初版试验方案' },
        ],
      },
      {
        id: 'exp-crispr-2',
        title: '基因猪制备受体 HB 突变实验',
        logs: [
          { id: 'exp-crispr-2-log-1', date: '2026.06.04', status: '修改试验方案', summary: '新增受体对照组' },
          { id: 'exp-crispr-2-log-2', date: '2026.06.01', status: '创建试验方案', summary: '完成初版实验流程' },
        ],
      },
      {
        id: 'exp-crispr-3',
        title: 'CRISPR 修复 L3 蛋白实验',
        logs: [
          { id: 'exp-crispr-3-log-1', date: '2026.05.30', status: '干试验模拟', summary: '仿真模型验证通过' },
          { id: 'exp-crispr-3-log-2', date: '2026.05.28', status: '创建试验方案', summary: '录入试验步骤' },
        ],
      },
    ],
  },
  'p-thal': {
    knowledgeDocs: [
      { id: 'k-thal-1', category: '方法', title: '地贫基因纠偏流程规范', source: '陈枫', referenceCount: 11 },
      { id: 'k-thal-2', category: '经验', title: '血红蛋白提升案例复盘', source: '地贫项目月报', referenceCount: 6 },
      { id: 'k-thal-3', category: '文献', title: 'AAV 载体稳定性文献综述', source: 'The Lancet', referenceCount: 13 },
    ],
    experiments: [
      {
        id: 'exp-thal-1',
        title: '造血干细胞修复方案验证',
        logs: [
          { id: 'exp-thal-1-log-1', date: '2026.06.05', status: '湿试验记录', summary: '第二批样本已完成采集' },
          { id: 'exp-thal-1-log-2', date: '2026.06.02', status: '修改试验方案', summary: '调整细胞培养时长' },
        ],
      },
      {
        id: 'exp-thal-2',
        title: '脱靶风险评估实验',
        logs: [
          { id: 'exp-thal-2-log-1', date: '2026.05.27', status: '干试验模拟', summary: '风险指标低于阈值' },
        ],
      },
    ],
  },
  'p-organoid': {
    knowledgeDocs: [
      { id: 'k-organoid-1', category: '方法', title: '类器官模型培养参数指南', source: '刘璇', referenceCount: 10 },
      { id: 'k-organoid-2', category: '文献', title: '药物响应曲线对照文献', source: 'Science', referenceCount: 14 },
    ],
    experiments: [
      {
        id: 'exp-organoid-1',
        title: '类器官药敏验证实验',
        logs: [
          { id: 'exp-organoid-1-log-1', date: '2026.06.01', status: '实验结束', summary: '药敏结论已沉淀到报告' },
          { id: 'exp-organoid-1-log-2', date: '2026.05.28', status: '湿试验记录', summary: '补录第二阶段观察数据' },
        ],
      },
    ],
  },
};

const emptyAttachmentContent: ProjectAttachmentContent = {
  knowledgeDocs: [],
  experiments: [],
};

const attachmentContentFallback: ProjectAttachmentContent = {
  knowledgeDocs: [
    { id: 'k-fallback-1', category: '方法', title: '实验采样流程规范（模板）', source: '模板作者', referenceCount: 3 },
    { id: 'k-fallback-2', category: '经验', title: '常见异常处理经验汇总（模板）', source: '模板库', referenceCount: 2 },
    { id: 'k-fallback-3', category: '文献', title: '方法学对照文献（模板）', source: '模板期刊', referenceCount: 4 },
  ],
  experiments: [
    {
      id: 'exp-fallback-1',
      title: '默认实验模板',
      logs: [
        { id: 'exp-fallback-1-log-1', date: '2026.05.29', status: '创建试验方案', summary: '创建默认实验流程' },
      ],
    },
  ],
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeTimelinePreview = (content: string) => {
  const normalized = content.replace(/\s+/g, ' ').trim();
  if (!normalized) return '空白消息';
  return normalized.length > 56 ? `${normalized.slice(0, 56)}...` : normalized;
};

const PANEL_MIN_WIDTH = 200;
const PANEL_MAX_WIDTH = 440;
const MIN_CHAT_WIDTH = 320;
const DEFAULT_RIGHT_PANEL_WIDTH = 260;
const DEFAULT_PREVIEW_PANEL_WIDTH = 320;
export default function ChatPage({ isNew }: { isNew?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { isSidebarOpen, setIsSidebarOpen, chats, setChats } = useOutletContext<LayoutOutletContext>();
  
  const chatId = params.id;
  const isNewChat = !chatId;
  const currentChat = chats.find((chat) => chat.id === chatId);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>(() => loadChatMessagesFromStorage());
  const [isTyping, setIsTyping] = useState(false);
  const [hasReceivedAssistantChunk, setHasReceivedAssistantChunk] = useState(false);
  const [statusPhase, setStatusPhase] = useState<StatusPhase>('thinking');
  const [searchSteps, setSearchSteps] = useState<SearchStep[]>([]);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [rightPanelWidth, setRightPanelWidth] = useState(DEFAULT_RIGHT_PANEL_WIDTH);
  const [isRightPanelResizing, setIsRightPanelResizing] = useState(false);
  const rightPanelResizeStartXRef = useRef(0);
  const rightPanelResizeStartWidthRef = useRef(DEFAULT_RIGHT_PANEL_WIDTH);
  const [showPreviewPanel, setShowPreviewPanel] = useState(false);
  const [previewPanelWidth, setPreviewPanelWidth] = useState(DEFAULT_PREVIEW_PANEL_WIDTH);
  const [isPreviewPanelResizing, setIsPreviewPanelResizing] = useState(false);
  const previewPanelResizeStartXRef = useRef(0);
  const previewPanelResizeStartWidthRef = useRef(DEFAULT_PREVIEW_PANEL_WIDTH);
  const previewPanelContainerRef = useRef<HTMLElement | null>(null);
  const workspaceContainerRef = useRef<HTMLDivElement | null>(null);
  const [workspaceWidth, setWorkspaceWidth] = useState(0);
  const prevSidebarOpenRef = useRef(isSidebarOpen);
  const suppressAutoCollapseRef = useRef(false);
const [projects, setProjects] = useState<Project[]>(() => mockProjects.map((project) => ({ ...project })));
const [selectedProject, setSelectedProject] = useState<Project | null>(null);
const [showCreateProjectPopover, setShowCreateProjectPopover] = useState(false);
const [newProjectName, setNewProjectName] = useState('');

  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [previewTabs, setPreviewTabs] = useState<PreviewItem[]>([]);
  const [activePreviewKey, setActivePreviewKey] = useState<string | null>(null);
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const [assistantFeedbackMap, setAssistantFeedbackMap] = useState<Record<string, AssistantFeedback>>({});
  const [activeTimelineMessageIndex, setActiveTimelineMessageIndex] = useState(0);
  const [hoveredTimelineMessageIndex, setHoveredTimelineMessageIndex] = useState<number | null>(null);
  const [isTimelineHovered, setIsTimelineHovered] = useState(false);
const [timelineScrollThumbHeight, setTimelineScrollThumbHeight] = useState(0);
const [timelineScrollThumbTop, setTimelineScrollThumbTop] = useState(0);
const [isTimelineScrolling, setIsTimelineScrolling] = useState(false);
const [chatScrollThumbHeight, setChatScrollThumbHeight] = useState(0);
const [chatScrollThumbTop, setChatScrollThumbTop] = useState(0);
const [isChatScrolling, setIsChatScrolling] = useState(false);
const timelineListRef = useRef<HTMLDivElement | null>(null);
const timelineScrollHideTimerRef = useRef<number | null>(null);
const chatScrollHideTimerRef = useRef<number | null>(null);
const chatScrollContainerRef = useRef<HTMLDivElement | null>(null);

  const shouldStickToBottomRef = useRef(true);
  const hasInitializedChatChangeRef = useRef(false);
  const projectSelectorRef = useRef<HTMLDivElement | null>(null);
  const createProjectPopoverRef = useRef<HTMLDivElement | null>(null);
  const messageElementRefs = useRef<Array<HTMLDivElement | null>>([]);

  const isShareMode = useMemo(
    () => !isNewChat && new URLSearchParams(location.search).get('share') === '1',
    [isNewChat, location.search],
  );
  const [selectedShareMessageKeys, setSelectedShareMessageKeys] = useState<Set<string>>(new Set());
  const [createdShareLink, setCreatedShareLink] = useState('');
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [isShareLinkModalOpen, setIsShareLinkModalOpen] = useState(false);
  const [isEditingChatTitle, setIsEditingChatTitle] = useState(false);
  const [editingChatTitle, setEditingChatTitle] = useState('');
  const chatTitleInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isShareMode) {
      setSelectedShareMessageKeys(new Set());
      setCreatedShareLink('');
      setShareLinkCopied(false);
      setIsShareLinkModalOpen(false);
      return;
    }

    const allMessageKeys = messages.map((_, idx) => `${chatId ?? 'new'}-${idx}`);
    setSelectedShareMessageKeys(new Set(allMessageKeys));
    setCreatedShareLink('');
    setShareLinkCopied(false);
    setIsShareLinkModalOpen(false);
  }, [chatId, isShareMode, messages]);

  const toggleShareMessage = useCallback((messageKey: string) => {
    setSelectedShareMessageKeys((prev) => {
      const next = new Set(prev);
      if (next.has(messageKey)) {
        next.delete(messageKey);
      } else {
        next.add(messageKey);
      }
      return next;
    });
    setCreatedShareLink('');
    setShareLinkCopied(false);
    setIsShareLinkModalOpen(false);
  }, []);

  const selectedShareCount = selectedShareMessageKeys.size;

  const handleCancelShareMode = useCallback(() => {
    if (!chatId) return;
    navigate(`/chat/${chatId}`, { replace: true });
  }, [chatId, navigate]);

  const handleCreateShareLink = useCallback(() => {
    if (!chatId || selectedShareCount <= 0) return;
    const shareId = Math.random().toString(36).slice(2, 10);
    setCreatedShareLink(`${window.location.origin}/share/${chatId}?sid=${shareId}`);
    setShareLinkCopied(false);
    setIsShareLinkModalOpen(true);
  }, [chatId, selectedShareCount]);

  const handleCopyShareLink = useCallback(async () => {
    if (!createdShareLink) return;

    try {
      await navigator.clipboard.writeText(createdShareLink);
      setShareLinkCopied(true);
    } catch {
      // 忽略复制失败
    }
  }, [createdShareLink]);

  const startEditChatTitle = useCallback(() => {
    if (isNewChat || !chatId || !currentChat) return;
    setEditingChatTitle(currentChat.title);
    setIsEditingChatTitle(true);
  }, [chatId, currentChat, isNewChat]);

  const cancelEditChatTitle = useCallback(() => {
    setEditingChatTitle(currentChat?.title ?? '');
    setIsEditingChatTitle(false);
  }, [currentChat?.title]);

  const commitEditChatTitle = useCallback(() => {
    if (!chatId || !currentChat) {
      setIsEditingChatTitle(false);
      return;
    }

    const nextTitle = editingChatTitle.trim();
    if (!nextTitle) {
      setEditingChatTitle(currentChat.title);
      setIsEditingChatTitle(false);
      return;
    }

    if (nextTitle !== currentChat.title) {
      setChats((prevChats) =>
        prevChats.map((chat) => (chat.id === chatId ? { ...chat, title: nextTitle } : chat)),
      );
    }

    setEditingChatTitle(nextTitle);
    setIsEditingChatTitle(false);
  }, [chatId, currentChat, editingChatTitle, setChats]);

  const handleChatTitleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        commitEditChatTitle();
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        cancelEditChatTitle();
      }
    },
    [cancelEditChatTitle, commitEditChatTitle],
  );

  useEffect(() => {
    setIsEditingChatTitle(false);
    setEditingChatTitle(currentChat?.title ?? '');
  }, [chatId, currentChat?.title]);

  useEffect(() => {
    if (!isEditingChatTitle) return;

    const frameId = window.requestAnimationFrame(() => {
      const input = chatTitleInputRef.current;
      if (!input) return;
      input.focus();
      const cursorPosition = input.value.length;
      input.setSelectionRange(cursorPosition, cursorPosition);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isEditingChatTitle]);

  useEffect(() => {
    // 首次进入历史对话时状态已是默认值，跳过一次重置可避免额外重渲染抖动。
    if (!hasInitializedChatChangeRef.current) {
      hasInitializedChatChangeRef.current = true;
      return;
    }

    if (timelineScrollHideTimerRef.current !== null) {
      window.clearTimeout(timelineScrollHideTimerRef.current);
      timelineScrollHideTimerRef.current = null;
    }

    if (chatScrollHideTimerRef.current !== null) {
      window.clearTimeout(chatScrollHideTimerRef.current);
      chatScrollHideTimerRef.current = null;
    }

    setShowRightPanel(false);
    setShowPreviewPanel(false);
    setPreviewTabs([]);
    setActivePreviewKey(null);
    setFileSearchQuery('');
    setHasReceivedAssistantChunk(false);
    setIsTimelineHovered(false);
    setHoveredTimelineMessageIndex(null);
    setIsTimelineScrolling(false);
    setTimelineScrollThumbHeight(0);
    setTimelineScrollThumbTop(0);
    setIsChatScrolling(false);
    setChatScrollThumbHeight(0);
    setChatScrollThumbTop(0);
    setActiveTimelineMessageIndex(0);
    shouldStickToBottomRef.current = true;
  }, [chatId]);

  useLayoutEffect(() => {
    if (!chatId) {
      return;
    }

    setMessages(chatMessages[chatId] ?? []);
    shouldStickToBottomRef.current = true;
  }, [chatId, chatMessages]);

  // 从后端加载特定对话的消息
  useEffect(() => {
    if (!chatId || chatMessages[chatId]) {
      return;
    }

    const loadMessagesFromBackend = async () => {
      try {
        const importMetaEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
        const API_BASE_URL = importMetaEnv?.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8000';
        
        const response = await fetch(`${API_BASE_URL}/api/v1/conversations/${chatId}/messages`);
        if (!response.ok) return;
        
        const messages = await response.json();
        
        // 将后端消息转换为本地格式
        const loadedMessages: Message[] = messages.map((msg: any) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          attachments: Array.isArray(msg.attachments) ? msg.attachments : [],
          references: Array.isArray(msg.references) ? msg.references : [],
        }));
        
        if (loadedMessages.length > 0) {
          setChatMessages(prev => ({
            ...prev,
            [chatId]: loadedMessages,
          }));
        }
      } catch (error) {
        console.error('Failed to load messages from backend:', error);
      }
    };

    // 延迟加载，确保页面加载完成
    const timer = setTimeout(loadMessagesFromBackend, 300);
    return () => clearTimeout(timer);
  }, [chatId, chatMessages]);

  useEffect(() => {
    window.localStorage.setItem(CHAT_MESSAGES_STORAGE_KEY, JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    if (!isRightPanelResizing) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (!showRightPanel || workspaceWidth <= 0) return;

      const delta = rightPanelResizeStartXRef.current - event.clientX;
      const maxRightWidthBySpace = workspaceWidth - MIN_CHAT_WIDTH - (showPreviewPanel ? PANEL_MIN_WIDTH : 0);
      const nextRightWidth = clamp(
        rightPanelResizeStartWidthRef.current + delta,
        PANEL_MIN_WIDTH,
        Math.max(PANEL_MIN_WIDTH, Math.min(PANEL_MAX_WIDTH, maxRightWidthBySpace)),
      );
      setRightPanelWidth(nextRightWidth);
    };

    const handleMouseUp = () => {
      setIsRightPanelResizing(false);
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
  }, [isRightPanelResizing, showPreviewPanel, showRightPanel, workspaceWidth]);

  useEffect(() => {
    if (!isPreviewPanelResizing) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (!showPreviewPanel || workspaceWidth <= 0) return;

      const delta = previewPanelResizeStartXRef.current - event.clientX;
      const reservedRightWidth = showRightPanel ? rightPanelWidth : 0;
      const maxPreviewWidthBySpace = workspaceWidth - MIN_CHAT_WIDTH - reservedRightWidth;
      const nextWidth = clamp(
        previewPanelResizeStartWidthRef.current + delta,
        PANEL_MIN_WIDTH,
        Math.max(PANEL_MIN_WIDTH, Math.min(PANEL_MAX_WIDTH, maxPreviewWidthBySpace)),
      );
      setPreviewPanelWidth(nextWidth);
    };

    const handleMouseUp = () => {
      setIsPreviewPanelResizing(false);
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
  }, [isPreviewPanelResizing, rightPanelWidth, showPreviewPanel, showRightPanel, workspaceWidth]);

  useEffect(() => {
    if (!showRightPanel) {
      setRightPanelWidth(DEFAULT_RIGHT_PANEL_WIDTH);
      setFileSearchQuery('');
    }
  }, [showRightPanel]);

  useEffect(() => {
    if (!showPreviewPanel) {
      setPreviewPanelWidth(DEFAULT_PREVIEW_PANEL_WIDTH);
    }
  }, [showPreviewPanel]);

  useEffect(() => {
    const workspace = workspaceContainerRef.current;
    if (!workspace) return;

    const updateWidth = () => {
      const nextWidth = workspace.getBoundingClientRect().width;
      setWorkspaceWidth(nextWidth);
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });

    resizeObserver.observe(workspace);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (workspaceWidth <= 0) return;

    const maxRightBySpace = workspaceWidth - MIN_CHAT_WIDTH - (showPreviewPanel ? PANEL_MIN_WIDTH : 0);
    const nextRight = showRightPanel
      ? clamp(
          rightPanelWidth,
          PANEL_MIN_WIDTH,
          Math.max(PANEL_MIN_WIDTH, Math.min(PANEL_MAX_WIDTH, maxRightBySpace)),
        )
      : rightPanelWidth;

    const reservedRight = showRightPanel ? nextRight : 0;
    const maxPreviewBySpace = workspaceWidth - MIN_CHAT_WIDTH - reservedRight;
    const nextPreview = showPreviewPanel
      ? clamp(
          previewPanelWidth,
          PANEL_MIN_WIDTH,
          Math.max(PANEL_MIN_WIDTH, Math.min(PANEL_MAX_WIDTH, maxPreviewBySpace)),
        )
      : previewPanelWidth;

    if (showRightPanel && nextRight !== rightPanelWidth) {
      setRightPanelWidth(nextRight);
    }

    if (showPreviewPanel && nextPreview !== previewPanelWidth) {
      setPreviewPanelWidth(nextPreview);
    }
  }, [previewPanelWidth, rightPanelWidth, showPreviewPanel, showRightPanel, workspaceWidth]);

  useEffect(() => {
    const wasSidebarOpen = prevSidebarOpenRef.current;

    if (showPreviewPanel && !wasSidebarOpen && isSidebarOpen) {
      suppressAutoCollapseRef.current = true;
    }

    if (!showPreviewPanel || !isSidebarOpen) {
      suppressAutoCollapseRef.current = false;
    }

    prevSidebarOpenRef.current = isSidebarOpen;
  }, [isSidebarOpen, showPreviewPanel]);

  useEffect(() => {
    if (!showPreviewPanel) return;

    const previewContainer = previewPanelContainerRef.current;
    if (!previewContainer) return;

    const collapseSidebarIfNarrow = (width: number) => {
      if (suppressAutoCollapseRef.current) return;
      if (width < 320) {
        setIsSidebarOpen(false);
      }
    };

    collapseSidebarIfNarrow(previewContainer.getBoundingClientRect().width);

    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      collapseSidebarIfNarrow(width);
    });

    resizeObserver.observe(previewContainer);

    return () => {
      resizeObserver.disconnect();
    };
  }, [setIsSidebarOpen, showPreviewPanel]);

  useEffect(() => {
    if (!isNewChat) return;

    // 每次进入新建页都重置状态，确保不会展示历史对话内容。
    setMessages([]);
    setIsTyping(false);
    setShowProjectDropdown(false);
    setShowCreateProjectPopover(false);
    setNewProjectName('');
    shouldStickToBottomRef.current = true;

    const projectIdFromQuery = new URLSearchParams(location.search).get('projectId');
    if (!projectIdFromQuery) {
      setSelectedProject(null);
      return;
    }

    const matchedProject = projects.find((project) => project.id === projectIdFromQuery);
    setSelectedProject(matchedProject ?? null);
  }, [isNewChat, location.search, projects]);

  const currentProject = useMemo<Project | null>(() => {
    if (isNewChat) return selectedProject;
    if (!currentChat?.projectId) return null;
    return projects.find((project) => project.id === currentChat.projectId) ?? null;
  }, [currentChat?.projectId, isNewChat, projects, selectedProject]);

  const projectMenuItems = useMemo<BaseActionMenuItem[]>(() => {
    const unselectedItem: BaseActionMenuItem = {
      key: 'none',
      label: '不选择项目',
      active: !selectedProject,
    };

    const selectableItems = projects.map<BaseActionMenuItem>((project) => ({
      key: project.id,
      label: <span className="truncate">{project.name}</span>,
      active: selectedProject?.id === project.id,
    }));

    return [unselectedItem, ...selectableItems];
  }, [projects, selectedProject]);

  const projectMenuFooterItems = useMemo<BaseActionMenuItem[]>(() => [
    {
      key: 'create',
      label: '新建项目',
      icon: <Plus size={16} />,
    },
  ], []);

  const handleProjectMenuItemClick: BaseActionMenuProps['onItemClick'] = (item) => {
    if (item.key === 'create') {
      setShowCreateProjectPopover(true);
      setNewProjectName('');
      return;
    }

    if (item.key === 'none') {
      setSelectedProject(null);
      setShowProjectDropdown(false);
      if (isNewChat) {
        navigate('/chat/new', { replace: true });
      }
      return;
    }

    const matchedProject = projects.find((project) => project.id === item.key) ?? null;
    setSelectedProject(matchedProject);
    setShowProjectDropdown(false);
    if (isNewChat && matchedProject) {
      navigate(`/chat/new?projectId=${matchedProject.id}`, { replace: true });
    }
  };

  const handleCancelCreateProject = () => {
    setShowCreateProjectPopover(false);
    setNewProjectName('');
  };

  const handleConfirmCreateProject = () => {
    const trimmedName = newProjectName.trim();
    if (!trimmedName) return;

    const duplicateProject = projects.find(
      (project) => project.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );
    if (duplicateProject) {
      setSelectedProject(duplicateProject);
      setShowCreateProjectPopover(false);
      setNewProjectName('');
      navigate(`/chat/new?projectId=${duplicateProject.id}`, { replace: true });
      return;
    }

    const nextProject: Project = {
      id: `p-${Date.now()}`,
      name: trimmedName,
      desc: '新建项目',
      count: 0,
      knowledge: 0,
      members: 1,
      visibility: 'private',
      privateType: 'personal',
    };

    // 同步到全局 mock 列表，确保“目录-项目-项目列表”可见
    mockProjects.unshift({
      id: nextProject.id,
      name: nextProject.name,
      desc: nextProject.desc,
      count: nextProject.count,
      knowledge: nextProject.knowledge,
      members: nextProject.members,
      visibility: 'private',
      privateType: 'personal',
    });

    setProjects((prev) => [nextProject, ...prev]);
    setSelectedProject(nextProject);
    setShowCreateProjectPopover(false);
    setNewProjectName('');
    navigate(`/chat/new?projectId=${nextProject.id}`, { replace: true });
  };

  useEffect(() => {
    if (!showCreateProjectPopover) return;

    const handleDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (createProjectPopoverRef.current?.contains(target)) return;
      if (projectSelectorRef.current?.contains(target)) return;
      setShowCreateProjectPopover(false);
      setNewProjectName('');
      setShowProjectDropdown(false);
    };

    document.addEventListener('mousedown', handleDocumentMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown);
    };
  }, [showCreateProjectPopover]);

  const panelContent = useMemo<ProjectPanelContent>(() => {
    if (!currentProject) {
      return {
        knowledgeDocs: [],
        experiments: [],
      };
    }

    return {
      knowledgeDocs: KNOWLEDGE_BY_PROJECT[currentProject.id] ?? [],
      experiments: EXPERIMENTS_BY_PROJECT[currentProject.id] ?? [],
    };
  }, [currentProject]);

  const normalizedFileSearchQuery = fileSearchQuery.trim().toLowerCase();

  const displayedPanelContent = useMemo<ProjectPanelContent>(() => {
    if (!normalizedFileSearchQuery) return panelContent;

    const matchesQuery = (value: string) => value.toLowerCase().includes(normalizedFileSearchQuery);

    return {
      knowledgeDocs: panelContent.knowledgeDocs.filter((doc) => {
        return matchesQuery(doc.title) || matchesQuery(doc.summary) || doc.tags.some((tag) => matchesQuery(tag));
      }),
      experiments: panelContent.experiments.filter((experiment) => {
        return (
          matchesQuery(experiment.title) ||
          matchesQuery(experiment.summary) ||
          matchesQuery(experiment.status) ||
          experiment.tags.some((tag) => matchesQuery(tag))
        );
      }),
    };
  }, [panelContent, normalizedFileSearchQuery]);


  const openPreviewItem = (item: PreviewItem) => {
    setPreviewTabs((prevTabs) => {
      const existingIndex = prevTabs.findIndex((tab) => tab.key === item.key);
      if (existingIndex === -1) {
        return [...prevTabs, item];
      }

      const nextTabs = [...prevTabs];
      nextTabs[existingIndex] = item;
      return nextTabs;
    });
    setActivePreviewKey(item.key);
    setShowPreviewPanel(true);
  };

  const handleClosePreviewTab = (targetKey: string) => {
    setPreviewTabs((prevTabs) => {
      const closingIndex = prevTabs.findIndex((tab) => tab.key === targetKey);
      if (closingIndex === -1) return prevTabs;

      const nextTabs = prevTabs.filter((tab) => tab.key !== targetKey);

      setActivePreviewKey((prevActiveKey) => {
        if (prevActiveKey !== targetKey) {
          return prevActiveKey;
        }

        if (nextTabs.length === 0) {
          setShowPreviewPanel(false);
          return null;
        }

        const nextIndex = Math.min(closingIndex, nextTabs.length - 1);
        return nextTabs[nextIndex]?.key ?? null;
      });

      return nextTabs;
    });
  };

  const handleKnowledgeDocClick = (doc: ProjectKnowledgeListItem) => {
    const projectName = currentProject?.name ?? '未归属项目';
    openPreviewItem({
      key: `knowledge:${doc.id}`,
      type: 'knowledge',
      title: doc.title,
      subtitle: `${projectName} · ${doc.tags.join(' · ') || '未分类'}`,
      content: `文档标题：${doc.title}\n标签：${doc.tags.join(' / ') || '未分类'}\n\n摘要：${doc.summary}\n\n本预览用于展示文档摘要与关键信息。`,
    });
  };

  const handleExperimentClick = (experiment: ProjectExperimentListItem) => {
    const projectName = currentProject?.name ?? '未归属项目';
    openPreviewItem({
      key: `experiment:${experiment.id}`,
      type: 'experiment-log',
      title: experiment.title,
      subtitle: `${projectName} · ${experiment.tags.join(' · ') || experiment.status}`,
      content: `实验标题：${experiment.title}\n标签：${experiment.tags.join(' / ') || experiment.status}\n\n摘要：${experiment.summary}\n\n本预览用于快速查看该条实验内容，后续可接入完整详情。`,
    });
  };

  const handlePreviewPanelResizeStart = (event: React.MouseEvent<HTMLDivElement>) => {
    previewPanelResizeStartXRef.current = event.clientX;
    previewPanelResizeStartWidthRef.current = previewPanelWidth;
    setIsPreviewPanelResizing(true);
  };

  const handleRightPanelResizeStart = (event: React.MouseEvent<HTMLDivElement>) => {
    rightPanelResizeStartXRef.current = event.clientX;
    rightPanelResizeStartWidthRef.current = rightPanelWidth;
    setIsRightPanelResizing(true);
  };

  const chatTimelineItems = useMemo<ChatTimelineItem[]>(() => {
    return messages.reduce<ChatTimelineItem[]>((acc, message, messageIndex) => {
      if (message.role !== 'user') return acc;

      const preview = normalizeTimelinePreview(message.content);
      acc.push({ messageIndex, preview });
      return acc;
    }, []);
  }, [messages]);

  const syncActiveTimelineByScroll = useCallback(() => {
    const container = chatScrollContainerRef.current;
    if (!container || chatTimelineItems.length === 0) return;

    const viewportAnchor = container.scrollTop + Math.min(container.clientHeight * 0.35, 220);
    let nextActiveMessageIndex = chatTimelineItems[0].messageIndex;

    chatTimelineItems.forEach((item) => {
      const anchorElement = messageElementRefs.current[item.messageIndex];
      if (!anchorElement) return;
      if (anchorElement.offsetTop <= viewportAnchor) {
        nextActiveMessageIndex = item.messageIndex;
      }
    });

    setActiveTimelineMessageIndex((prev) => (prev === nextActiveMessageIndex ? prev : nextActiveMessageIndex));
  }, [chatTimelineItems]);

  const updateTimelineScrollThumb = useCallback(() => {
    const container = timelineListRef.current;
    if (!container) {
      setTimelineScrollThumbHeight(0);
      setTimelineScrollThumbTop(0);
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = container;
    if (scrollHeight <= clientHeight || clientHeight <= 0) {
      setTimelineScrollThumbHeight(0);
      setTimelineScrollThumbTop(0);
      return;
    }

    const nextThumbHeight = Math.max((clientHeight / scrollHeight) * clientHeight, 24);
    const maxTravel = clientHeight - nextThumbHeight;
    const progress = scrollTop / Math.max(scrollHeight - clientHeight, 1);

    setTimelineScrollThumbHeight(nextThumbHeight);
    setTimelineScrollThumbTop(maxTravel * progress);
  }, []);

  const handleTimelineListScroll = useCallback(() => {
    updateTimelineScrollThumb();
    setIsTimelineScrolling(true);

    if (timelineScrollHideTimerRef.current !== null) {
      window.clearTimeout(timelineScrollHideTimerRef.current);
    }

    timelineScrollHideTimerRef.current = window.setTimeout(() => {
      setIsTimelineScrolling(false);
    }, 650);
  }, [updateTimelineScrollThumb]);

  const setAssistantFeedback = useCallback((actionKey: string, feedback: AssistantFeedback) => {
    setAssistantFeedbackMap((prev) => {
      const current = prev[actionKey];
      if (current === feedback) {
        const next = { ...prev };
        delete next[actionKey];
        return next;
      }

      return {
        ...prev,
        [actionKey]: feedback,
      };
    });
  }, []);

  const updateChatScrollThumb = useCallback(() => {
    const container = chatScrollContainerRef.current;
    if (!container) {
      setChatScrollThumbHeight(0);
      setChatScrollThumbTop(0);
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = container;
    if (scrollHeight <= clientHeight || clientHeight <= 0) {
      setChatScrollThumbHeight(0);
      setChatScrollThumbTop(0);
      return;
    }

    const nextThumbHeight = Math.max((clientHeight / scrollHeight) * clientHeight, 36);
    const maxTravel = clientHeight - nextThumbHeight;
    const progress = scrollTop / Math.max(scrollHeight - clientHeight, 1);

    setChatScrollThumbHeight(nextThumbHeight);
    setChatScrollThumbTop(maxTravel * progress);
  }, []);

  const handleChatScroll = useCallback(() => {
    const container = chatScrollContainerRef.current;
    if (!container) return;

    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldStickToBottomRef.current = distanceToBottom <= 80;

    syncActiveTimelineByScroll();
    updateChatScrollThumb();
    setIsChatScrolling(true);

    if (chatScrollHideTimerRef.current !== null) {
      window.clearTimeout(chatScrollHideTimerRef.current);
    }

    chatScrollHideTimerRef.current = window.setTimeout(() => {
      setIsChatScrolling(false);
    }, 650);
  }, [syncActiveTimelineByScroll, updateChatScrollThumb]);

  const scrollToTimelineMessage = useCallback((messageIndex: number) => {
    const container = chatScrollContainerRef.current;
    const anchorElement = messageElementRefs.current[messageIndex];
    if (!container || !anchorElement) return;

    shouldStickToBottomRef.current = false;
    setActiveTimelineMessageIndex(messageIndex);
    container.scrollTo({
      top: Math.max(anchorElement.offsetTop - 88, 0),
      behavior: 'smooth',
    });
  }, []);

  useLayoutEffect(() => {
    if (isNewChat) return;

    const container = chatScrollContainerRef.current;
    if (!container || !shouldStickToBottomRef.current) return;

    container.scrollTop = container.scrollHeight;
  }, [chatId, hasReceivedAssistantChunk, isNewChat, isTyping, messages, statusPhase]);

  useEffect(() => {
    messageElementRefs.current.length = messages.length;
  }, [messages.length]);

  useEffect(() => {
    if (chatTimelineItems.length === 0) {
      setActiveTimelineMessageIndex(0);
      return;
    }

    const hasActiveMessage = chatTimelineItems.some((item) => item.messageIndex === activeTimelineMessageIndex);
    if (!hasActiveMessage) {
      setActiveTimelineMessageIndex(chatTimelineItems[chatTimelineItems.length - 1].messageIndex);
    }
  }, [activeTimelineMessageIndex, chatTimelineItems]);

  useLayoutEffect(() => {
    if (isNewChat || chatTimelineItems.length === 0) return;

    const container = chatScrollContainerRef.current;
    if (!container) return;

    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceToBottom <= 80) {
      setActiveTimelineMessageIndex(chatTimelineItems[chatTimelineItems.length - 1].messageIndex);
      return;
    }

    syncActiveTimelineByScroll();
  }, [chatTimelineItems, isNewChat, syncActiveTimelineByScroll]);

  useEffect(() => {
    if (!isTimelineHovered) return;

    const rafId = window.requestAnimationFrame(() => {
      updateTimelineScrollThumb();
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [chatTimelineItems.length, isTimelineHovered, updateTimelineScrollThumb]);

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      updateChatScrollThumb();
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [messages, statusPhase, hasReceivedAssistantChunk, isTyping, updateChatScrollThumb]);

  useEffect(() => {
    const handleResize = () => {
      updateChatScrollThumb();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [updateChatScrollThumb]);

  useEffect(() => {
    return () => {
      if (timelineScrollHideTimerRef.current !== null) {
        window.clearTimeout(timelineScrollHideTimerRef.current);
      }
      if (chatScrollHideTimerRef.current !== null) {
        window.clearTimeout(chatScrollHideTimerRef.current);
      }
    };
  }, []);

  // 发送首条消息时立即创建会话并绑定所选项目，确保近期对话分组正确。
  const handleSend = useCallback(async (payload: string | InputSendPayload) => {
    const normalizedPayload: InputSendPayload =
      typeof payload === 'string'
        ? { content: payload, attachments: [], references: [] }
        : payload;

    const trimmedText = normalizedPayload.content.trim();
    if (!trimmedText || isTyping) return;

    let targetChatId = chatId;
    if (isNewChat) {
      targetChatId = `c-${Date.now()}`;
      const nextTitle = trimmedText.length > 18 ? `${trimmedText.slice(0, 18)}...` : trimmedText;
      const newChat: MockChat = {
        id: targetChatId,
        title: nextTitle || '新对话',
        date: '刚刚',
        count: 1,
        projectId: selectedProject?.id,
      };

      setChats((prevChats) => [newChat, ...prevChats]);
      navigate(`/chat/${targetChatId}`, { replace: true });
    }

    const storageKey = targetChatId ? `conv_id:${targetChatId}` : 'conv_id:default';
    const fallbackConvId = targetChatId ?? crypto.randomUUID();
    const conversationId = localStorage.getItem(storageKey) || fallbackConvId;
    localStorage.setItem(storageKey, conversationId);
    localStorage.setItem('conv_id', conversationId);

    const userMessage: Message = {
      role: 'user',
      content: trimmedText,
      attachments: normalizedPayload.attachments,
      references: normalizedPayload.references,
    };
    const baseMessages = targetChatId
      ? (chatMessages[targetChatId] ?? (targetChatId === chatId ? messages : []))
      : messages;
    const requestMessages = [...baseMessages, userMessage];
    const nextMessages = [...requestMessages, { role: 'assistant', content: '' } as Message];

    setHasReceivedAssistantChunk(false);
    setIsTyping(true);
    setStatusPhase('thinking');
    setSearchSteps([]);
    shouldStickToBottomRef.current = true;
    setMessages(nextMessages);

    if (targetChatId) {
      setChatMessages((prev) => ({
        ...prev,
        [targetChatId as string]: nextMessages,
      }));
    }

    try {
      await streamChatResponse({
        conversationId,
        projectId: selectedProject?.id ?? currentChat?.projectId,
        messages: requestMessages,
        onChunk: (chunk) => {
          setHasReceivedAssistantChunk(true);
          setMessages((prevMessages) => {
            const updated = [...prevMessages];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              updated[updated.length - 1] = {
                ...lastMsg,
                content: lastMsg.content + chunk,
              };
            }
            return updated;
          });

          if (targetChatId) {
            setChatMessages((prev) => {
              const current = prev[targetChatId as string] ?? [];
              const updated = [...current];
              const lastMsg = updated[updated.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                updated[updated.length - 1] = {
                  ...lastMsg,
                  content: lastMsg.content + chunk,
                };
              }
              return {
                ...prev,
                [targetChatId as string]: updated,
              };
            });
          }
        },
        onStatusChange: (phase, steps) => {
          setStatusPhase(phase);
          setSearchSteps(steps);
        },
      });
    } catch (error) {
      let fallbackText = '后端服务暂不可用，请稍后重试。';

      if (error instanceof ChatStreamError) {
        switch (error.code) {
          case 'FIRST_EVENT_TIMEOUT':
            fallbackText = '请求已发送，但服务响应超时，请检查模型服务状态后重试。';
            break;
          case 'SERVER_ERROR':
            fallbackText = error.message || '后端处理请求失败，请稍后重试。';
            break;
          case 'HTTP_ERROR':
            fallbackText = `请求失败（${error.status ?? 'unknown'}），请稍后重试。`;
            break;
          case 'NETWORK_ERROR':
            fallbackText = '网络连接异常，请检查网络或后端服务后重试。';
            break;
          case 'ABORTED':
            fallbackText = '请求中断，请重新发送。';
            break;
          default:
            fallbackText = '后端服务暂不可用，请稍后重试。';
            break;
        }
      }

      setMessages((prevMessages) => {
        const updated = [...prevMessages];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          updated[updated.length - 1] = {
            ...lastMsg,
            content: fallbackText,
          };
        }
        return updated;
      });

      if (targetChatId) {
        setChatMessages((prev) => {
          const current = prev[targetChatId as string] ?? [];
          const updated = [...current];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            updated[updated.length - 1] = {
              ...lastMsg,
              content: fallbackText,
            };
          }
          return {
            ...prev,
            [targetChatId as string]: updated,
          };
        });
      }
    } finally {
      setIsTyping(false);
    }
  }, [chatId, chatMessages, currentChat?.projectId, isNewChat, isTyping, messages, navigate, selectedProject?.id, setChats]);

  const regenerateAssistantMessage = useCallback((assistantIndex: number) => {
    if (isTyping) return;

    const previousUserMessage = messages
      .slice(0, assistantIndex)
      .reverse()
      .find((message) => message.role === 'user');

    if (!previousUserMessage) return;

    void handleSend({ content: previousUserMessage.content, attachments: [], references: [] });
  }, [handleSend, isTyping, messages]);

  const activePreviewItem = useMemo(() => {
    if (!activePreviewKey) return null;
    return previewTabs.find((tab) => tab.key === activePreviewKey) ?? null;
  }, [activePreviewKey, previewTabs]);

  const chatContentMaxWidth: number | string = showPreviewPanel ? '100%' : 800;
  const chatInputMaxWidth: number | string = showPreviewPanel ? '100%' : 840;
  const showChatTimeline = !isShareMode && chatTimelineItems.length > 0;

  return (
    <div className="flex h-full w-full flex-col bg-white">
      {/* 顶部导航 */}
      <header className={`h-16 shrink-0 flex items-center px-6 justify-between bg-white/80 backdrop-blur-sm z-10 ${(showRightPanel || showPreviewPanel) ? 'border-b border-[#efefef]' : ''}`}>
        <div className="flex items-center gap-3 min-w-0">
          {!isSidebarOpen && (
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-secondaryText hover:bg-bgLight rounded-full transition-colors" title="展开边栏">
              <Menu size={20} />
            </button>
          )}
          {!isNewChat && (
            <div className="min-w-0">
              {isEditingChatTitle ? (
                <input
                  ref={chatTitleInputRef}
                  value={editingChatTitle}
                  onChange={(event) => setEditingChatTitle(event.target.value)}
                  onBlur={commitEditChatTitle}
                  onKeyDown={handleChatTitleKeyDown}
                  className="w-full max-w-[560px] rounded-[8px] border border-[#22c55e] bg-white px-2.5 py-1 text-[15px] md:text-[16px] font-medium text-primaryText outline-none transition-colors focus:border-[#22c55e]"
                  maxLength={80}
                  aria-label="编辑对话名称"
                />
              ) : (
                <h1
                  className="text-[15px] md:text-[16px] font-medium text-primaryText truncate cursor-pointer"
                  onClick={startEditChatTitle}
                  title="点击编辑对话名称"
                >
                  {currentChat?.title ?? ''}
                </h1>
              )}
            </div>
          )}
        </div>
        {!isNewChat && (
          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={() => setShowPreviewPanel((prev) => !prev)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 flex items-center gap-2 ${
                showPreviewPanel
                  ? 'bg-[#f3f8fc] text-primaryText'
                  : 'bg-transparent text-primaryText hover:bg-[#f3f8fc]'
              }`}
            >
              <FileText size={14} className="text-secondaryText" />
              <span>预览</span>
            </button>
            <button
              onClick={() => setShowRightPanel(!showRightPanel)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 flex items-center gap-2 ${
                showRightPanel
                  ? 'bg-[#f3f8fc] text-primaryText'
                  : 'bg-transparent text-primaryText hover:bg-[#f3f8fc]'
              }`}
            >
              <Folder size={14} className="text-secondaryText" />
              <span className="truncate max-w-[150px]">项目</span>
            </button>
          </div>
        )}
      </header>
      <div ref={workspaceContainerRef} className="flex flex-1 min-h-0 w-full overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col h-full bg-white" style={{ minWidth: 0 }}>
          {/* 聊天内容区 */}
        {isNewChat ? (
          <div className="flex-1 flex flex-col items-center justify-center w-full mx-auto px-6 overflow-y-auto">
            <h1 className="text-5xl text-primaryText mb-10 tracking-wider" style={{ fontFamily: '"Songti SC", "STSong", "Noto Serif CJK SC", serif' }}>
              研究，由此开始
            </h1>

            <div className="w-full max-w-[840px] mx-auto mb-6">
              <div ref={projectSelectorRef} className="relative">
                {showCreateProjectPopover && (
                  <div
                    ref={createProjectPopoverRef}
                    className="absolute left-[272px] bottom-[calc(100%+8px)] z-[1301] w-[300px] rounded-xl border border-[#e6ecf2] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
                  >
                    <div className="space-y-3">
                      <div>
                        <div className="mb-1.5 text-sm font-semibold text-primaryText">新建项目</div>
                        <BaseInput
                          value={newProjectName}
                          onChange={(event) => setNewProjectName(event.target.value)}
                          placeholder="请输入项目名称"
                          size="medium"
                          containerClassName="!px-3"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <BaseButton type="secondary" size="small" onClick={handleCancelCreateProject}>
                          取消
                        </BaseButton>
                        <BaseButton
                          type="primary"
                          size="small"
                          onClick={handleConfirmCreateProject}
                          disabled={!newProjectName.trim()}
                        >
                          确认
                        </BaseButton>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <InputArea
                onSend={handleSend}
                disabled={isTyping}
                leadingControls={(
                  <BaseActionMenu
                    open={showProjectDropdown}
                    onOpenChange={(open) => {
                      if (!open && showCreateProjectPopover) {
                        return;
                      }
                      setShowProjectDropdown(open);
                      if (!open) {
                        setShowCreateProjectPopover(false);
                        return;
                      }
                      setShowCreateProjectPopover(false);
                    }}
                    placement="top-start"
                    width={260}
                    trigger={
                      <span className="flex items-center gap-1.5 rounded-full border border-borderGray bg-white px-4 py-1.5 text-[14px] text-tertiaryText transition-colors hover:bg-bgLight">
                        <span className="truncate max-w-[120px]">
                          {selectedProject ? selectedProject.name : '工作项目'}
                        </span>
                        <ChevronDown size={14} />
                      </span>
                    }
                    items={projectMenuItems}
                    footerItems={projectMenuFooterItems}
                    onItemClick={handleProjectMenuItemClick}
                    className="!inline-flex"
                    listClassName="max-h-[220px] overflow-y-auto"
                  />
                )}
              />
            </div>

            <QuickPrompts onSelect={handleSend} />
          </div>
        ) : (
          <>
            <div className="relative flex-1 min-h-0">
            <div className="relative h-full">
              <div
                ref={chatScrollContainerRef}
                onScroll={handleChatScroll}
                className="flex h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-4 sm:px-8 py-8 pt-20 flex-col items-center"
              >
              <div className={`w-full flex flex-col ${isShareMode ? 'gap-3' : 'gap-8'}`} style={{ maxWidth: chatContentMaxWidth }}>
                {messages.map((msg, idx) => {
                  const actionKey = `${chatId ?? 'new'}-${idx}`;
                  const isChecked = selectedShareMessageKeys.has(actionKey);

                  return (
                    <div
                      key={actionKey}
                      ref={(element) => {
                        messageElementRefs.current[idx] = element;
                      }}
                      className={isShareMode ? 'flex w-full items-start gap-2' : ''}
                    >
                      {isShareMode && (
                        <button
                          type="button"
                          onClick={() => toggleShareMessage(actionKey)}
                          className="mt-3 shrink-0 rounded-md p-1 text-[#9aa0a6] transition-colors hover:bg-[#f3f5f7]"
                          aria-label={isChecked ? '取消选择消息' : '选择消息'}
                        >
                          {isChecked ? (
                            <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-[5px] bg-primary text-white">
                              <Check size={12} strokeWidth={2.8} />
                            </span>
                          ) : (
                            <span className="inline-flex h-[18px] w-[18px] rounded-[5px] border border-[#c9d1dc] bg-white" />
                          )}
                        </button>
                      )}
                      <div
                        className={
                          isShareMode
                            ? `min-w-0 flex-1 rounded-xl transition-colors ${
                                isChecked ? 'bg-[#f3f4f6]' : 'bg-transparent hover:bg-[#f7f8fa]'
                              } ${msg.role === 'user' ? 'py-2.5' : 'py-1.5'} px-2`
                            : ''
                        }
                      >
                        <MessageItem
                          msg={msg}
                          actionKey={actionKey}
                          feedback={assistantFeedbackMap[actionKey]}
                          onFeedback={setAssistantFeedback}
                          onRefresh={() => regenerateAssistantMessage(idx)}
                          isTyping={isTyping}
                        />
                      </div>
                    </div>
                  );
                })}
{isTyping && !(statusPhase === 'generating' && hasReceivedAssistantChunk) && (
  <div className="flex w-full justify-center px-2">
    <div className="flex w-full max-w-[860px] px-1 md:px-2 justify-start">
      <ThinkingIndicator phase={statusPhase} searchSteps={searchSteps} />
    </div>
  </div>
)}
              </div>
              </div>

              {chatScrollThumbHeight > 0 && (
                <div
                  className={`pointer-events-none absolute right-1 top-0 w-[6px] rounded-full bg-[#d3d8e0] transition-opacity duration-200 ${
                    isChatScrolling ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    height: chatScrollThumbHeight,
                    transform: `translateY(${chatScrollThumbTop}px)`,
                  }}
                />
              )}
            </div>

            {showChatTimeline && (
              <div className="pointer-events-none absolute right-6 top-1/2 z-[5] -translate-y-1/2">
                <div
                  className="pointer-events-auto relative"
                  onMouseEnter={() => setIsTimelineHovered(true)}
                  onMouseLeave={() => {
                    if (timelineScrollHideTimerRef.current !== null) {
                      window.clearTimeout(timelineScrollHideTimerRef.current);
                      timelineScrollHideTimerRef.current = null;
                    }
                    setIsTimelineHovered(false);
                    setHoveredTimelineMessageIndex(null);
                    setIsTimelineScrolling(false);
                  }}
                >
                  <div
                    ref={timelineListRef}
                    onScroll={handleTimelineListScroll}
                    className={`ml-auto max-h-[332px] overflow-y-auto rounded-[12px] border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden transition-[width,padding,background-color,border-color,box-shadow] duration-200 ${
                      isTimelineHovered
                        ? 'w-[244px] border-[#eef0f4] bg-white px-4 py-4 shadow-[0_18px_48px_rgba(15,23,42,0.12)]'
                        : 'w-[12px] border-transparent bg-transparent px-0 py-0 shadow-none'
                    }`}
                  >
                    <div className="relative">
                      <div className="flex flex-col items-end gap-5">
                        {chatTimelineItems.map((item) => {
                          const isActive = item.messageIndex === activeTimelineMessageIndex;
                          const isHovered = hoveredTimelineMessageIndex === item.messageIndex;
                          return (
                            <button
                              key={`timeline-item-${item.messageIndex}`}
                              type="button"
                              onClick={() => scrollToTimelineMessage(item.messageIndex)}
                              onMouseEnter={() => setHoveredTimelineMessageIndex(item.messageIndex)}
                              onMouseLeave={() => setHoveredTimelineMessageIndex(null)}
                              className={`flex h-4 items-center justify-end transition-[width,gap] duration-200 ${
                                isTimelineHovered ? 'w-full gap-2' : 'w-[12px] gap-0'
                              }`}
                              style={{ fontFamily: '"Inter", "PingFang SC", "Microsoft YaHei", sans-serif' }}
                              aria-label={`定位到第 ${item.messageIndex + 1} 条用户消息`}
                              title={item.preview}
                            >
                              <span
                                className={`min-w-0 overflow-hidden whitespace-nowrap text-right text-[14px] leading-4 transition-[max-width,opacity,color] duration-200 ${
                                  isTimelineHovered ? 'max-w-[190px] opacity-100' : 'max-w-0 opacity-0'
                                } ${isActive ? 'text-[#2b63ff]' : isHovered ? 'text-[#1f2937]' : 'text-[#8f95a3]'}`}
                              >
                                {item.preview}
                              </span>
                              <span
                                className={`shrink-0 rounded-full transition-colors duration-200 ${
                                  isActive
                                    ? 'h-[4px] w-[12px] bg-[#2b63ff]'
                                    : isHovered
                                      ? 'h-[2px] w-[8px] bg-[#1f2937]'
                                      : 'h-[2px] w-[8px] bg-[#d9dce3]'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>

                      {isTimelineHovered && timelineScrollThumbHeight > 0 && (
                        <div
                          className={`pointer-events-none absolute right-[-2px] top-0 h-full w-[4px] rounded-full bg-[#d3d8e0] transition-opacity duration-200 ${
                            isTimelineScrolling ? 'opacity-100' : 'opacity-0'
                          }`}
                          style={{
                            height: timelineScrollThumbHeight,
                            transform: `translateY(${timelineScrollThumbTop}px)`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
            
            {isShareMode ? (
              <>
                <div className="w-full shrink-0 border-t border-[#efefef] bg-white/95 px-6 py-3 backdrop-blur">
                  <div className="mx-auto flex w-full items-center justify-between gap-4" style={{ maxWidth: chatInputMaxWidth }}>
                    <div className="min-w-0">
                      <div className="text-sm text-secondaryText">已选择 {selectedShareCount} 条对话</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <BaseButton type="secondary" size="small" onClick={handleCancelShareMode}>
                        取消
                      </BaseButton>
                      <BaseButton
                        type="primary"
                        size="small"
                        disabled={selectedShareCount <= 0}
                        onClick={handleCreateShareLink}
                      >
                        创建分享链接
                      </BaseButton>
                    </div>
                  </div>
                </div>

                <BaseModal
                  visible={isShareLinkModalOpen}
                  title="创建分享链接"
                  width={450}
                  onCancel={() => setIsShareLinkModalOpen(false)}
                  footer={null}
                >
                  <div className="space-y-4">
                    <p className="m-0 text-[14px] leading-6 text-primaryText">
                      任何获得链接的实验室成员均可以查看你分享的对话，请检查是否包含敏感/隐私内容。
                    </p>
                    <div className="flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-[#f8fafc] p-1.5 pl-4">
                      <span className="min-w-0 flex-1 truncate text-[14px] text-secondaryText">
                        {createdShareLink}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyShareLink}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
                      >
                        {shareLinkCopied ? <Check size={14} /> : <Copy size={14} />}
                        <span>{shareLinkCopied ? '已复制' : '复制'}</span>
                      </button>
                    </div>
                  </div>
                </BaseModal>
              </>
            ) : (
              <div className="w-full mx-auto px-6 pb-6 pt-2 bg-gradient-to-t from-white via-white to-transparent shrink-0" style={{ maxWidth: chatInputMaxWidth }}>
                <InputArea onSend={handleSend} disabled={isTyping} />
                <div className="text-center text-xs text-tertiaryText mt-3">
                  AI 内容可能有误差，请在实验前核实。
                </div>
              </div>
            )}
          </>
        )}
        </div>

        {!isNewChat && (
          <aside
            ref={previewPanelContainerRef}
            style={{ width: showPreviewPanel ? previewPanelWidth : 0 }}
            className={`shrink-0 min-h-0 overflow-hidden ${
              isPreviewPanelResizing ? 'transition-none' : 'transition-[width] duration-300 ease-out'
            } ${showPreviewPanel ? 'min-w-0' : 'pointer-events-none'}`}
          >
            <div className="relative h-full w-full min-w-0 bg-white border-l border-[#efefef] flex flex-col">
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="调整项目文件预览面板宽度"
                onMouseDown={handlePreviewPanelResizeStart}
                className="absolute left-0 top-0 h-full w-1.5 cursor-col-resize bg-transparent z-10"
              />
              <div className="h-12 shrink-0 flex items-center justify-between px-3 gap-2">
                <div className="min-w-0 flex-1 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {previewTabs.map((tab) => {
                    const isActiveTab = tab.key === activePreviewKey;
                    return (
                      <div key={tab.key} className="group relative shrink-0 w-[150px]">
                        <button
                          onClick={() => setActivePreviewKey(tab.key)}
className={`w-full inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 pr-6 text-sm transition-colors ${
                                isActiveTab ? 'bg-[#fafafa] text-primaryText' : 'text-secondaryText hover:bg-[#fafafa]'
                              }`}
                        >
                          {tab.type === 'knowledge' ? (
                            <FileText size={14} className="text-tertiaryText shrink-0" />
                          ) : (
                            <FlaskConical size={14} className="text-tertiaryText shrink-0" />
                          )}
                          <span className="min-w-0 truncate text-left">{tab.title}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleClosePreviewTab(tab.key);
                          }}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-tertiaryText opacity-0 transition-opacity hover:text-primaryText group-hover:opacity-100"
                          title="关闭标签"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => {
                    setShowPreviewPanel(false);
                    setPreviewTabs([]);
                    setActivePreviewKey(null);
                  }}
                  className="p-1.5 rounded-full text-secondaryText hover:bg-bgLight transition-colors"
                  title="关闭预览"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2">
                {activePreviewItem ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <h3 className="text-base font-semibold text-primaryText break-words">{activePreviewItem.title}</h3>
                      {activePreviewItem.type === 'knowledge' && (
                        <div className="text-xs text-tertiaryText">{activePreviewItem.subtitle}</div>
                      )}
                  {activePreviewItem?.status && (
                    <div className="inline-flex items-center rounded-full bg-bgLight px-2 py-1 text-xs text-secondaryText">
                      <span>{activePreviewItem.status}</span>
                    </div>
                  )}

                    </div>
                    <div className="rounded-xl border border-borderGray bg-bgLight/40 p-3">
                      <p className="text-sm text-secondaryText leading-6 whitespace-pre-line break-words">{activePreviewItem.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-center text-sm text-secondaryText px-4">
                    点击右侧项目文件内容可在此处预览
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}

        {/* 右侧边栏 */}
        {!isNewChat && (
          <aside
            style={{ width: showRightPanel ? rightPanelWidth : 0 }}
            className={`shrink-0 min-h-0 overflow-hidden ${
              isRightPanelResizing ? 'transition-none' : 'transition-[width] duration-300 ease-out'
            } ${showRightPanel ? '' : 'pointer-events-none'}`}
          >
            <div
              style={{ width: rightPanelWidth }}
              className="relative h-full min-w-0 bg-white border-l border-[#efefef] flex flex-col"
            >
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="调整项目附件与预览区域宽度"
                onMouseDown={handleRightPanelResizeStart}
                className="absolute left-0 top-0 h-full w-3 -ml-1 cursor-col-resize bg-transparent z-10"
              />
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="space-y-6 text-sm text-primaryText">
                  <section className="space-y-2.5">
                    <div className="text-[15px] font-medium text-primaryText truncate">
                      {currentProject ? currentProject.name : '未归属项目'}
                    </div>
                    <label className="relative block">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiaryText" />
                      <input
                        value={fileSearchQuery}
                        onChange={(event) => setFileSearchQuery(event.target.value)}
                        placeholder="搜索文件"
                        className="w-full h-9 rounded-lg border border-borderGray bg-white pl-9 pr-3 text-sm text-primaryText placeholder:text-tertiaryText outline-none focus:border-borderGray/80"
                      />
                    </label>
                  </section>

                  <section>
                    <div className="space-y-1">
                      {(() => {
                        const totalItems =
                          displayedPanelContent.knowledgeDocs.length + displayedPanelContent.experiments.length;

                        if (totalItems === 0) {
                          return (
                            <div className="rounded-lg bg-bgLight px-3 py-2 text-xs text-secondaryText">
                              {normalizedFileSearchQuery ? '未找到匹配的文件' : '暂无项目文件'}
                            </div>
                          );
                        }

                        return (
                          <>
                            {displayedPanelContent.knowledgeDocs.map((doc) => {
                              const previewKey = `knowledge:${doc.id}`;
                              const isActive = activePreviewKey === previewKey;
                              const tagText = doc.tags[0] ?? '未分类';

                              return (
                                <button
                                  key={doc.id}
                                  onClick={() => handleKnowledgeDocClick(doc)}
                                  className={`w-full rounded-lg px-2 py-1.5 text-left transition-colors ${
                                    isActive ? 'bg-[#fafafa]' : 'hover:bg-[#fafafa]'
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <div className={`truncate text-sm ${isActive ? 'font-semibold text-primaryText' : 'font-normal text-primaryText'}`}>
                                      {doc.title}
                                    </div>
                                    <div className="mt-0.5 truncate text-xs text-tertiaryText">{tagText}</div>
                                  </div>
                                </button>
                              );
                            })}
                            {displayedPanelContent.experiments.map((experiment) => {
                              const previewKey = `experiment:${experiment.id}`;
                              const isActive = activePreviewKey === previewKey;
                              const tagText = experiment.tags[0] ?? experiment.status;

                              return (
                                <button
                                  key={experiment.id}
                                  onClick={() => handleExperimentClick(experiment)}
                                  className={`w-full rounded-lg px-2 py-1.5 text-left transition-colors ${
                                    isActive ? 'bg-[#fafafa]' : 'hover:bg-[#fafafa]'
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <div
                                      className={`truncate text-sm ${
                                        isActive ? 'font-semibold text-primaryText' : 'font-normal text-primaryText'
                                      }`}
                                    >
                                      {experiment.title}
                                    </div>
                                    <div className="mt-0.5 truncate text-xs text-tertiaryText">{tagText}</div>
                                  </div>
                                </button>
                              );
                            })}
                          </>
                        );
                      })()}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}