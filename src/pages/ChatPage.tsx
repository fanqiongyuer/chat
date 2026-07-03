import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useOutletContext, useLocation } from 'react-router-dom';
import { Menu, Folder, ChevronDown, ChevronRight, Plus, Send, FileText, FlaskConical, Pencil, CheckCircle2, LineChart, Search, X, Paperclip } from 'lucide-react';
import MessageItem from '../components/chat/MessageItem';
import InputArea from '../components/chat/InputArea';
import QuickPrompts from '../components/chat/QuickPrompts';
import ThinkingIndicator, { type StatusPhase, type SearchStep } from '../components/chat/ThinkingIndicator';
import { ChatStreamError, streamChatResponse } from '../mock/mockApi';
import { mockProjects } from '../mock/projects';
import { type MockChat } from '../mock/chats';
import { type LayoutOutletContext } from '../components/Layout';

interface Message {
  role: 'user' | 'assistant';
  content: string;
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

          if ((role === 'user' || role === 'assistant') && typeof content === 'string') {
            return { role, content } as Message;
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
}

type KnowledgeCategory = '方法' | '经验' | '文献';

type ExperimentStatus =
  | '创建试验方案'
  | '修改试验方案'
  | '干试验模拟'
  | '湿试验记录'
  | '实验结束';

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
  status: ExperimentStatus;
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

type PreviewItemType = 'knowledge' | 'experiment-log';

interface PreviewItem {
  key: string;
  type: PreviewItemType;
  title: string;
  subtitle: string;
  content: string;
  status?: ExperimentStatus;
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

const getExperimentStatusMeta = (status: ExperimentStatus) => {
  switch (status) {
    case '创建试验方案':
      return {
        icon: <Plus size={10} strokeWidth={2.6} />,
        className: 'bg-primary-soft text-primary',
      };
    case '修改试验方案':
      return {
        icon: <Pencil size={10} strokeWidth={2.4} />,
        className: 'bg-violet-50 text-violet-600',
      };
    case '干试验模拟':
      return {
        icon: <LineChart size={10} strokeWidth={2.3} />,
        className: 'bg-indigo-50 text-indigo-600',
      };
    case '湿试验记录':
      return {
        icon: <FlaskConical size={10} strokeWidth={2.4} />,
        className: 'bg-cyan-50 text-cyan-600',
      };
    case '实验结束':
      return {
        icon: <CheckCircle2 size={10} strokeWidth={2.4} />,
        className: 'bg-emerald-50 text-emerald-600',
      };
    default:
      return {
        icon: <FlaskConical size={10} strokeWidth={2.4} />,
        className: 'bg-gray-100 text-secondaryText',
      };
  }
};

const PANEL_MIN_WIDTH = 200;
const PANEL_MAX_WIDTH = 440;
const DEFAULT_RIGHT_PANEL_WIDTH = 260;
const DEFAULT_PREVIEW_PANEL_WIDTH = 320;
const CHAT_MIN_WIDTH_WITH_PREVIEW = 320;

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
  const rightPanelResizeStartPreviewWidthRef = useRef(DEFAULT_PREVIEW_PANEL_WIDTH);
  const [showPreviewPanel, setShowPreviewPanel] = useState(false);
  const [previewPanelWidth, setPreviewPanelWidth] = useState(DEFAULT_PREVIEW_PANEL_WIDTH);
  const [isPreviewPanelResizing, setIsPreviewPanelResizing] = useState(false);
  const previewPanelResizeStartXRef = useRef(0);
  const previewPanelResizeStartWidthRef = useRef(DEFAULT_PREVIEW_PANEL_WIDTH);
  const previewPanelContainerRef = useRef<HTMLElement | null>(null);
  const prevSidebarOpenRef = useRef(isSidebarOpen);
  const suppressAutoCollapseRef = useRef(false);
  const [inputVal, setInputVal] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [isKnowledgeExpanded, setIsKnowledgeExpanded] = useState(true);
  const [isExperimentsExpanded, setIsExperimentsExpanded] = useState(true);
  const [expandedExperiments, setExpandedExperiments] = useState<Record<string, boolean>>({});
  const [previewTabs, setPreviewTabs] = useState<PreviewItem[]>([]);
  const [activePreviewKey, setActivePreviewKey] = useState<string | null>(null);
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const [assistantFeedbackMap, setAssistantFeedbackMap] = useState<Record<string, AssistantFeedback>>({});
  const chatScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const hasInitializedChatChangeRef = useRef(false);

  useEffect(() => {
    // 首次进入历史对话时状态已是默认值，跳过一次重置可避免额外重渲染抖动。
    if (!hasInitializedChatChangeRef.current) {
      hasInitializedChatChangeRef.current = true;
      return;
    }

    setShowRightPanel(false);
    setShowPreviewPanel(false);
    setPreviewTabs([]);
    setActivePreviewKey(null);
    setFileSearchQuery('');
    setHasReceivedAssistantChunk(false);
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
      const delta = rightPanelResizeStartXRef.current - event.clientX;

      if (showPreviewPanel) {
        // 右侧附件面板左边分割线拖拽时，优先在附件区和中间预览区之间分配空间。
        const linkedWidth = rightPanelResizeStartWidthRef.current + rightPanelResizeStartPreviewWidthRef.current;
        const minRightWidth = Math.max(PANEL_MIN_WIDTH, linkedWidth - PANEL_MAX_WIDTH);
        const maxRightWidth = Math.min(PANEL_MAX_WIDTH, linkedWidth - PANEL_MIN_WIDTH);
        const nextRightWidth = Math.min(maxRightWidth, Math.max(minRightWidth, rightPanelResizeStartWidthRef.current + delta));

        setRightPanelWidth(nextRightWidth);
        setPreviewPanelWidth(linkedWidth - nextRightWidth);
        return;
      }

      const nextWidth = Math.min(PANEL_MAX_WIDTH, Math.max(PANEL_MIN_WIDTH, rightPanelResizeStartWidthRef.current + delta));
      setRightPanelWidth(nextWidth);
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
  }, [isRightPanelResizing, showPreviewPanel]);

  useEffect(() => {
    if (!isPreviewPanelResizing) return;

    const handleMouseMove = (event: MouseEvent) => {
      const delta = previewPanelResizeStartXRef.current - event.clientX;
      const nextWidth = Math.min(PANEL_MAX_WIDTH, Math.max(PANEL_MIN_WIDTH, previewPanelResizeStartWidthRef.current + delta));
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
  }, [isPreviewPanelResizing]);

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
    if (showPreviewPanel && showRightPanel) {
      setPreviewPanelWidth(DEFAULT_PREVIEW_PANEL_WIDTH);
    }
  }, [showPreviewPanel, showRightPanel]);

  useEffect(() => {
    if (!isNewChat) return;

    // 每次进入新建页都重置输入态，确保不会展示历史对话内容。
    setMessages([]);
    setInputVal('');
    setIsTyping(false);
    setShowProjectDropdown(false);
    shouldStickToBottomRef.current = true;

    const projectIdFromQuery = new URLSearchParams(location.search).get('projectId');
    if (!projectIdFromQuery) {
      setSelectedProject(null);
      return;
    }

    const matchedProject = mockProjects.find((project) => project.id === projectIdFromQuery);
    setSelectedProject(matchedProject ?? null);
  }, [isNewChat, location.search]);

  const currentProject = useMemo<Project | null>(() => {
    if (isNewChat) return selectedProject;
    if (!currentChat?.projectId) return null;
    return mockProjects.find((project) => project.id === currentChat.projectId) ?? null;
  }, [currentChat?.projectId, isNewChat, selectedProject]);

  const attachmentContent = useMemo<ProjectAttachmentContent>(() => {
    if (!currentProject) return attachmentContentFallback;
    return mockAttachmentByProjectId[currentProject.id] ?? attachmentContentFallback;
  }, [currentProject]);

  const normalizedFileSearchQuery = fileSearchQuery.trim().toLowerCase();

  const displayedAttachmentContent = useMemo<ProjectAttachmentContent>(() => {
    if (!normalizedFileSearchQuery) return attachmentContent;

    const matchesQuery = (value: string) => value.toLowerCase().includes(normalizedFileSearchQuery);

    const knowledgeDocs = attachmentContent.knowledgeDocs.filter((doc) => {
      return matchesQuery(doc.title) || matchesQuery(doc.category);
    });

    const experiments: ProjectExperiment[] = [];

    attachmentContent.experiments.forEach((experiment) => {
      const matchesTitle = matchesQuery(experiment.title);
      const filteredLogs = matchesTitle
        ? experiment.logs
        : experiment.logs.filter((log) => {
            return matchesQuery(log.summary) || matchesQuery(log.status) || matchesQuery(log.date);
          });

      if (matchesTitle || filteredLogs.length > 0) {
        experiments.push({
          ...experiment,
          logs: filteredLogs,
        });
      }
    });

    return {
      knowledgeDocs,
      experiments,
    };
  }, [attachmentContent, normalizedFileSearchQuery]);

  useEffect(() => {
    setIsKnowledgeExpanded(true);
    setIsExperimentsExpanded(true);

    const firstExperimentId = attachmentContent.experiments[0]?.id;
    setExpandedExperiments(firstExperimentId ? { [firstExperimentId]: true } : {});
  }, [attachmentContent.experiments, chatId]);

  const toggleExperiment = (experimentId: string) => {
    setExpandedExperiments((prev) => ({
      ...prev,
      [experimentId]: !prev[experimentId],
    }));
  };

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

  const handleKnowledgeDocClick = (doc: ProjectKnowledgeDoc) => {
    const projectName = currentProject?.name ?? '未归属项目';
    openPreviewItem({
      key: `knowledge:${doc.id}`,
      type: 'knowledge',
      title: doc.title,
      subtitle: `${doc.category} · ${doc.source} · 引用 ${doc.referenceCount} 次`,
      content: `【${doc.category}】${doc.title}\n来源：${doc.source}\n引用次数：${doc.referenceCount} 次\n\n本预览用于展示文档摘要与关键信息。\n你可以在这里继续补充背景、方法步骤、结论要点与后续行动。`,
    });
  };

  const handleExperimentLogClick = (experiment: ProjectExperiment, log: ProjectExperimentLog) => {
    const projectName = currentProject?.name ?? '未归属项目';
    openPreviewItem({
      key: `experiment-log:${log.id}`,
      type: 'experiment-log',
      title: `${experiment.title} · ${log.date}`,
      subtitle: `${projectName} · ${log.status}`,
      status: log.status,
      content: `记录摘要：${log.summary}\n\n实验名称：${experiment.title}\n记录日期：${log.date}\n状态：${log.status}\n\n本预览用于快速查看该条实验记录，后续可接入完整详情内容。`,
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
    rightPanelResizeStartPreviewWidthRef.current = previewPanelWidth;
    setIsRightPanelResizing(true);
  };

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

  const handleChatScroll = useCallback(() => {
    const container = chatScrollContainerRef.current;
    if (!container) return;

    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldStickToBottomRef.current = distanceToBottom <= 80;
  }, []);

  useLayoutEffect(() => {
    if (isNewChat) return;

    const container = chatScrollContainerRef.current;
    if (!container || !shouldStickToBottomRef.current) return;

    container.scrollTop = container.scrollHeight;
  }, [chatId, hasReceivedAssistantChunk, isNewChat, isTyping, messages, statusPhase]);

  // 发送首条消息时立即创建会话并绑定所选项目，确保近期对话分组正确。
  const handleSend = useCallback(async (text: string) => {
    const trimmedText = text.trim();
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

    const userMessage: Message = { role: 'user', content: trimmedText };
    const baseMessages = targetChatId
      ? (chatMessages[targetChatId] ?? (targetChatId === chatId ? messages : []))
      : messages;
    const requestMessages = [...baseMessages, userMessage];
    const nextMessages = [...requestMessages, { role: 'assistant', content: '' } as Message];

    setInputVal('');
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

    void handleSend(previousUserMessage.content);
  }, [handleSend, isTyping, messages]);

  const activePreviewItem = useMemo(() => {
    if (!activePreviewKey) return null;
    return previewTabs.find((tab) => tab.key === activePreviewKey) ?? null;
  }, [activePreviewKey, previewTabs]);

  const previewStatusMeta = activePreviewItem?.status
    ? getExperimentStatusMeta(activePreviewItem.status)
    : null;
  const chatContentMaxWidth: number | string = showPreviewPanel ? '100%' : 800;
  const chatInputMaxWidth: number | string = showPreviewPanel ? '100%' : 840;

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
            <h1 className="text-[15px] md:text-[16px] font-medium text-primaryText truncate">
              {currentChat?.title ?? ''}
            </h1>
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
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        <div
          className={`${showPreviewPanel ? 'shrink-0 min-w-[320px]' : 'flex-1 min-w-0'} flex flex-col h-full bg-white`}
          style={showPreviewPanel ? { width: CHAT_MIN_WIDTH_WITH_PREVIEW } : undefined}
        >
          {/* 聊天内容区 */}
        {isNewChat ? (
          <div className="flex-1 flex flex-col items-center justify-center w-full mx-auto px-6 overflow-y-auto">
            <h1 className="text-5xl text-primaryText mb-10 tracking-wider" style={{ fontFamily: '"Songti SC", "STSong", "Noto Serif CJK SC", serif' }}>
              研究，由此开始
            </h1>
            
            <div className="w-full max-w-[840px] mx-auto mb-6">
              <div className="relative bg-white rounded-3xl shadow-sm border border-borderGray flex flex-col transition-all focus-within:shadow-lg focus-within:border-borderGray">
                <textarea
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(inputVal);
                    }
                  }}
                  placeholder="输入你的科研问题..."
                  className="w-full min-h-[90px] max-h-[200px] p-5 outline-none resize-none text-lg bg-transparent text-primaryText placeholder:text-tertiaryText leading-relaxed"
                />
                <div className="flex justify-between items-center p-3 pt-0">
                  <div className="flex items-center gap-2 pl-1 relative">
                    <button 
                      onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-borderGray text-base text-tertiaryText hover:bg-bgLight transition-colors bg-white"
                    >
                      <span className="truncate max-w-[120px]">
                        {selectedProject ? selectedProject.name : 'Work in a project'}
                      </span>
                      <ChevronDown size={14} />
                    </button>
                    
                    {/* 项目选择下拉菜单 */}
                    {showProjectDropdown && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setShowProjectDropdown(false)}></div>
<div className="absolute bottom-full left-0 mb-2 w-60 bg-white rounded-xl shadow-popover z-40 overflow-hidden py-2 animate-in fade-in slide-in-from-bottom-2">
<div className="max-h-[200px] overflow-y-auto">
                            {mockProjects.map(p => (
                              <div 
                                key={p.id} 
                                className={`px-4 py-2.5 text-base cursor-pointer flex items-center justify-between rounded-lg mx-2 transition-colors ${
                                  selectedProject?.id === p.id 
                                    ? 'bg-green-100 text-green-700 font-medium' 
                                    : 'text-primaryText hover:bg-bgLight'
                                }`}
                                onClick={() => { setSelectedProject(p); setShowProjectDropdown(false); }}
                              >
                                <span className="truncate">{p.name}</span>
                              </div>
                            ))}
                          </div>
                          <div 
                            className="px-4 py-2.5 text-base text-green-600 hover:bg-green-50 cursor-pointer flex items-center gap-2 font-medium rounded-lg mx-2 transition-colors"
                            onClick={() => {
                              setShowProjectDropdown(false);
                            }}
                          >
                            <Plus size={16} /> 新建项目
                          </div>
                        </div>
                      </>
                    )}

                    <button className="w-8 h-8 rounded-full border border-borderGray flex items-center justify-center text-tertiaryText hover:bg-bgLight transition-colors bg-white">
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="w-8 h-8 rounded-full border border-borderGray flex items-center justify-center text-tertiaryText hover:bg-bgLight transition-colors bg-white">
                      <Paperclip size={16} />
                    </button>
                    <button 
                      onClick={() => handleSend(inputVal)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${inputVal.trim() && !isTyping ? 'bg-green-600 text-white shadow-md hover:bg-green-700' : 'bg-tertiaryText text-white'}`}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <QuickPrompts onSelect={handleSend} />
          </div>
        ) : (
          <>
            <div
              ref={chatScrollContainerRef}
              onScroll={handleChatScroll}
              className="flex-1 overflow-y-auto [scrollbar-gutter:stable_both-edges] px-4 sm:px-8 py-8 pt-20 flex flex-col items-center"
            >
              <div className="w-full flex flex-col gap-8" style={{ maxWidth: chatContentMaxWidth }}>
                {messages.map((msg, idx) => {
                  const actionKey = `${chatId ?? 'new'}-${idx}`;

                  return (
                    <MessageItem
                      key={idx}
                      msg={msg}
                      actionKey={actionKey}
                      feedback={assistantFeedbackMap[actionKey]}
                      onFeedback={setAssistantFeedback}
                      onRefresh={() => regenerateAssistantMessage(idx)}
                      isTyping={isTyping}
                    />
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
            
            {/* 底部悬浮输入区域 */}
            <div className="w-full mx-auto px-6 pb-6 pt-2 bg-gradient-to-t from-white via-white to-transparent shrink-0" style={{ maxWidth: chatInputMaxWidth }}>
              <InputArea onSend={handleSend} disabled={isTyping} />
              <div className="text-center text-xs text-tertiaryText mt-3">
                AI 内容可能有误差，请在实验前核实。
              </div>
            </div>
          </>
        )}
        </div>

        {!isNewChat && (
          <aside
            ref={previewPanelContainerRef}
            style={{ flexBasis: showPreviewPanel ? previewPanelWidth : 0 }}
            className={`min-h-0 overflow-hidden ${
              isPreviewPanelResizing ? 'transition-none' : 'transition-[flex-basis] duration-300 ease-out'
            } ${showPreviewPanel ? 'flex-1 min-w-[200px]' : 'shrink-0 pointer-events-none'}`}
          >
            <div
              className={`relative h-full w-full bg-white border-l border-[#efefef] flex flex-col transform-gpu ${
                isPreviewPanelResizing ? 'transition-none' : 'transition-transform duration-300 ease-out'
              } ${showPreviewPanel ? 'translate-x-0' : 'translate-x-full'}`}
            >
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
                            isActiveTab ? 'bg-[#f3f8fc] text-primaryText' : 'text-secondaryText hover:bg-bgLight'
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
                      {previewStatusMeta && (
                        <div className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${previewStatusMeta.className}`}>
                          {previewStatusMeta.icon}
                          <span>{activePreviewItem.status}</span>
                        </div>
                      )}
                    </div>
                    <div className="rounded-xl border border-borderGray bg-bgLight/40 p-3">
                      <p className="text-sm text-secondaryText leading-6 whitespace-pre-line">{activePreviewItem.content}</p>
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
              className="relative h-full bg-white border-l border-[#efefef] flex flex-col"
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
                    <div className="flex items-center justify-between mb-1.5">
                      <button
                        onClick={() => setIsKnowledgeExpanded((prev) => !prev)}
                        className="flex items-center gap-1 text-sm font-medium text-primaryText hover:text-black"
                      >
                        {isKnowledgeExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <span>知识 {displayedAttachmentContent.knowledgeDocs.length}</span>
                      </button>
                      <button className="text-xs text-secondaryText hover:text-primaryText transition-colors">添加</button>
                    </div>

                    {isKnowledgeExpanded && (
                      displayedAttachmentContent.knowledgeDocs.length > 0 ? (
                        <div className="space-y-1">
                          {displayedAttachmentContent.knowledgeDocs.map((doc) => {
                            const previewKey = `knowledge:${doc.id}`;
                            const isActive = activePreviewKey === previewKey;

                            return (
                              <button
                                key={doc.id}
                                onClick={() => handleKnowledgeDocClick(doc)}
                                className={`w-full flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-sm text-primaryText transition-colors ${
                                  isActive ? 'bg-[#f3f8fc]' : 'hover:bg-bgLight'
                                }`}
                              >
                                <FileText size={13} className="text-tertiaryText shrink-0" />
                                <span className="text-secondaryText shrink-0">【{doc.category}】</span>
                                <span className="truncate">{doc.title}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-lg bg-bgLight px-3 py-2 text-xs text-secondaryText">
                          {normalizedFileSearchQuery ? '未找到匹配的知识文档' : '暂无知识文档，点击“添加”补充'}
                        </div>
                      )
                    )}
                  </section>

                  <section>
                    <div className="flex items-center justify-between mb-1.5">
                      <button
                        onClick={() => setIsExperimentsExpanded((prev) => !prev)}
                        className="flex items-center gap-1 text-sm font-medium text-primaryText hover:text-black"
                      >
                        {isExperimentsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <span>实验 {displayedAttachmentContent.experiments.length}</span>
                      </button>
                      <button className="text-xs text-secondaryText hover:text-primaryText transition-colors">添加</button>
                    </div>

                    {isExperimentsExpanded && (
                      displayedAttachmentContent.experiments.length > 0 ? (
                        <div className="space-y-1.5">
                          {displayedAttachmentContent.experiments.map((experiment) => {
                            const isExpanded = expandedExperiments[experiment.id] === true;

                            return (
                              <div key={experiment.id} className="rounded-lg">
                                <button
                                  onClick={() => toggleExperiment(experiment.id)}
                                  className="w-full flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-sm text-primaryText hover:bg-bgLight transition-colors"
                                >
                                  {isExpanded ? (
                                    <ChevronDown size={13} className="text-tertiaryText shrink-0" />
                                  ) : (
                                    <ChevronRight size={13} className="text-tertiaryText shrink-0" />
                                  )}
                                  <FlaskConical size={13} className="text-tertiaryText shrink-0" />
                                  <span className="truncate">{experiment.title}</span>
                                </button>

                                {isExpanded && (
                                  <div className="ml-7 mt-0.5 space-y-1">
                                    {experiment.logs.length > 0 ? (
                                      experiment.logs.map((log, logIndex) => {
                                        const statusMeta = getExperimentStatusMeta(log.status);
                                        const showConnector = logIndex < experiment.logs.length - 1;

                                        const previewKey = `experiment-log:${log.id}`;
                                        const isActive = activePreviewKey === previewKey;

                                        return (
                                          <div
                                            key={log.id}
                                            onClick={() => handleExperimentLogClick(experiment, log)}
                                            className={`relative pl-7 pb-2 last:pb-0 rounded-lg cursor-pointer transition-colors ${
                                              isActive ? 'bg-[#f3f8fc]' : 'hover:bg-bgLight/70'
                                            }`}
                                          >
                                            {showConnector && (
                                              <div className="absolute left-2 top-[8px] bottom-[-8px] w-px -translate-x-1/2 bg-borderGray/80" />
                                            )}
                                            <div
                                              title={log.status}
                                              className={`absolute left-0 top-0 flex h-4 w-4 items-center justify-center rounded-full ${statusMeta.className}`}
                                            >
                                              {statusMeta.icon}
                                            </div>
                                            <div className="text-sm font-medium text-primaryText leading-5">{log.date}</div>
                                            <div className="text-sm text-secondaryText mt-0.5 leading-5 truncate">{log.summary}</div>
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <div className="text-xs text-secondaryText px-2 py-1">暂无实验记录</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-lg bg-bgLight px-3 py-2 text-xs text-secondaryText">
                          {normalizedFileSearchQuery ? '未找到匹配的实验内容' : '暂无实验，点击“添加”创建实验'}
                        </div>
                      )
                    )}
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