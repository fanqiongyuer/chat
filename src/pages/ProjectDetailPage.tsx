import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ChevronDown, Folder, Menu, MoreHorizontal, Plus, Search, Upload, Users } from 'lucide-react';
import { Select } from 'antd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BaseActionMenu, BaseButton, BaseDocumentUpload, BaseEmpty, BaseModal } from '../components';
import type { BaseActionMenuProps } from '../components';
import {
  EXPERIMENT_DETAILS_BY_PROJECT,
  EXPERIMENTS_BY_PROJECT,
  PROJECT_MEMBERS,
  mockProjects,
  type ProjectExperimentDetail,
} from '../mock/projects';
import { DEFAULT_TEMPLATES, type ProjectTemplate } from './ProjectsPage';
import { type LayoutOutletContext } from '../components/Layout';

type DetailTab = 'experiment' | 'chat';
type MemberPermission = '浏览' | '编辑';

interface ProjectMemberEntry {
  id: string;
  name: string;
  permission: MemberPermission;
}

interface LabMemberDirectoryEntry {
  id: string;
  name: string;
  email: string;
}

const MEMBER_PERMISSION_OPTIONS = [
  { label: '浏览', value: '浏览' },
  { label: '编辑', value: '编辑' },
];

const MEMBER_PERMISSION_ACTION_OPTIONS = [
  { label: '浏览', value: '浏览' },
  { label: '编辑', value: '编辑' },
  { label: '移除', value: '移除' },
];

const LAB_MEMBER_DIRECTORY: LabMemberDirectoryEntry[] = [
  { id: 'm-wangping', name: '王平', email: 'wangping@deptrace.ai' },
  { id: 'm-songke', name: '宋可', email: 'songke@deptrace.ai' },
  { id: 'm-wangzheyv', name: '王哲宇', email: 'wangzheyv@deptrace.ai' },
  { id: 'm-teluoke', name: '特洛克', email: 'teluoke@deptrace.ai' },
  { id: 'm-duyuesheng', name: '杜月笙', email: 'duyuesheng@deptrace.ai' },
  { id: 'm-zhouyan', name: '周妍', email: 'zhouyan@deptrace.ai' },
  { id: 'm-lijin', name: '李晋', email: 'lijin@deptrace.ai' },
  { id: 'm-chenxi', name: '陈曦', email: 'chenxi@deptrace.ai' },
  { id: 'm-hexiao', name: '何晓', email: 'hexiao@deptrace.ai' },
  { id: 'm-liting', name: '李婷', email: 'liting@deptrace.ai' },
  { id: 'm-maodan', name: '毛单', email: 'maodan@deptrace.ai' },
  { id: 'm-xuqian', name: '徐倩', email: 'xuqian@deptrace.ai' },
  { id: 'm-jiangchen', name: '蒋晨', email: 'jiangchen@deptrace.ai' },
  { id: 'm-wanghao', name: '王浩', email: 'wanghao@deptrace.ai' },
  { id: 'm-zhangmin', name: '张敏', email: 'zhangmin@deptrace.ai' },
  { id: 'm-zhaoyang', name: '赵阳', email: 'zhaoyang@deptrace.ai' },
  { id: 'm-sunli', name: '孙丽', email: 'sunli@deptrace.ai' },
  { id: 'm-qiankun', name: '钱坤', email: 'qiankun@deptrace.ai' },
];

const TAG_COLLAPSED_MAX_HEIGHT = 84;

const WEEKDAY_TO_INDEX: Record<string, number> = {
  日: 0,
  天: 0,
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
};

const pad2 = (value: number) => String(value).padStart(2, '0');

const formatDateToCnymdhm = (date: Date) =>
  `${date.getFullYear()}年${pad2(date.getMonth() + 1)}月${pad2(date.getDate())}日 ${pad2(
    date.getHours(),
  )}:${pad2(date.getMinutes())}`;

const parseHourMinute = (value: string) => {
  const matched = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!matched) return null;
  return { hours: Number(matched[1]), minutes: Number(matched[2]) };
};

const toWeekdayDate = (base: Date, targetWeekday: number, extraDaysBack = 0) => {
  const date = new Date(base);
  const baseWeekday = date.getDay();
  let diff = baseWeekday - targetWeekday;
  if (diff < 0) {
    diff += 7;
  }
  date.setDate(date.getDate() - diff - extraDaysBack);
  return date;
};

const formatChatDateTime = (rawDate: string, chatId: string) => {
  const now = new Date();
  const normalized = rawDate.trim();

  if (normalized === '刚刚') {
    return formatDateToCnymdhm(now);
  }

  const todayMatch = normalized.match(/^今天\s+(\d{1,2}:\d{2})$/);
  if (todayMatch) {
    const time = parseHourMinute(todayMatch[1]);
    if (time) {
      const date = new Date(now);
      date.setHours(time.hours, time.minutes, 0, 0);
      return formatDateToCnymdhm(date);
    }
  }

  const yesterdayMatch = normalized.match(/^昨天\s+(\d{1,2}:\d{2})$/);
  if (yesterdayMatch) {
    const time = parseHourMinute(yesterdayMatch[1]);
    if (time) {
      const date = new Date(now);
      date.setDate(date.getDate() - 1);
      date.setHours(time.hours, time.minutes, 0, 0);
      return formatDateToCnymdhm(date);
    }
  }

  const weekdayMatch = normalized.match(/^周([一二三四五六日天])\s+(\d{1,2}:\d{2})$/);
  if (weekdayMatch) {
    const weekday = WEEKDAY_TO_INDEX[weekdayMatch[1]];
    const time = parseHourMinute(weekdayMatch[2]);
    if (weekday !== undefined && time) {
      const date = toWeekdayDate(now, weekday);
      date.setHours(time.hours, time.minutes, 0, 0);
      return formatDateToCnymdhm(date);
    }
  }

  const lastWeekdayMatch = normalized.match(/^上周([一二三四五六日天])\s+(\d{1,2}:\d{2})$/);
  if (lastWeekdayMatch) {
    const weekday = WEEKDAY_TO_INDEX[lastWeekdayMatch[1]];
    const time = parseHourMinute(lastWeekdayMatch[2]);
    if (weekday !== undefined && time) {
      const date = toWeekdayDate(now, weekday, 7);
      date.setHours(time.hours, time.minutes, 0, 0);
      return formatDateToCnymdhm(date);
    }
  }

  const fullDateMatch = normalized.match(
    /^(\d{4})[.\-/年](\d{1,2})[.\-/月](\d{1,2})日?\s+(\d{1,2}):(\d{2})$/,
  );
  if (fullDateMatch) {
    const date = new Date(
      Number(fullDateMatch[1]),
      Number(fullDateMatch[2]) - 1,
      Number(fullDateMatch[3]),
      Number(fullDateMatch[4]),
      Number(fullDateMatch[5]),
      0,
      0,
    );
    return formatDateToCnymdhm(date);
  }

  const monthDayMatch = normalized.match(/^(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{2})$/);
  if (monthDayMatch) {
    const date = new Date(
      now.getFullYear(),
      Number(monthDayMatch[1]) - 1,
      Number(monthDayMatch[2]),
      Number(monthDayMatch[3]),
      Number(monthDayMatch[4]),
      0,
      0,
    );
    return formatDateToCnymdhm(date);
  }

  const timestampMatch = chatId.match(/^c-(\d{13})$/);
  if (timestampMatch) {
    const date = new Date(Number(timestampMatch[1]));
    if (!Number.isNaN(date.getTime())) {
      return formatDateToCnymdhm(date);
    }
  }

  const parsedDate = new Date(normalized);
  if (!Number.isNaN(parsedDate.getTime())) {
    return formatDateToCnymdhm(parsedDate);
  }

  return formatDateToCnymdhm(now);
};

const createLocalDocId = () => `exp-local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getFileNameWithoutExt = (fileName: string) => {
  const idx = fileName.lastIndexOf('.');
  if (idx <= 0) return fileName;
  return fileName.slice(0, idx);
};

const PROJECT_TAG_CANDIDATES = [
  '实验目标', '脱靶控制', '流程优化', '结果验证', '性能评估', '靶点研究', '设计规范',
  '数据分析', '文献研究', '实验设计', '统计评估', '机器学习', '样本管理', '项目管理',
  '科研协作', '安全合规', '伦理审查', '报告撰写', '知识沉淀', '细胞培养', '基因编辑',
  '药物筛选', '动物模型', '生物信息学', '组学研究', '蛋白表达', '免疫检测', '质控管理',
  '技术调研', '方案评审', '进度跟踪', '风险控制', '成果转化', '专利申请', '数据治理',
  '模型训练', '算法优化', '可视化分析', '论文发表', '团队协同', '设备管理', '试剂采购',
  '临床样本', '多中心研究', '随访管理', '研究备案',
];

export default function ProjectDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isSidebarOpen, setIsSidebarOpen, chats, openMoveChatModal } = useOutletContext<LayoutOutletContext>();

  const [activeTab, setActiveTab] = useState<DetailTab>('experiment');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [isTagExpanded, setIsTagExpanded] = useState(false);
  const [showTagToggle, setShowTagToggle] = useState(false);
  const [showCreateDocModal, setShowCreateDocModal] = useState(false);
  const [showTemplatePickerModal, setShowTemplatePickerModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('tpl-blank');
  const [templateDocumentTags, setTemplateDocumentTags] = useState<string[]>([]);
  const [isTemplateTagExpanded, setIsTemplateTagExpanded] = useState(false);
  const [showTemplateTagToggle, setShowTemplateTagToggle] = useState(false);
  const [isCreatingTemplateTag, setIsCreatingTemplateTag] = useState(false);
  const [templateTagSearchKeyword, setTemplateTagSearchKeyword] = useState('');
  const [customTemplateTags, setCustomTemplateTags] = useState<string[]>([]);
  const [previewTemplate, setPreviewTemplate] = useState<ProjectTemplate | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [createDocError, setCreateDocError] = useState('');
  const [chatActionMenuId, setChatActionMenuId] = useState<string | null>(null);
  const [memberModalError, setMemberModalError] = useState('');
  const [selectedInviteMemberIds, setSelectedInviteMemberIds] = useState<string[]>([]);
  const [invitePermission, setInvitePermission] = useState<MemberPermission>('浏览');
  const [projectNameDraft, setProjectNameDraft] = useState('');
  const [projectDescDraft, setProjectDescDraft] = useState('');
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [isEditingProjectDesc, setIsEditingProjectDesc] = useState(false);
  const tagFilterRef = useRef<HTMLDivElement | null>(null);
  const templateTagListRef = useRef<HTMLDivElement | null>(null);

  const project = useMemo(() => mockProjects.find((item) => item.id === id), [id]);

  const projectMembers = useMemo(() => {
    if (!id) return [];
    return PROJECT_MEMBERS[id] ?? [];
  }, [id]);

  const [managedMembers, setManagedMembers] = useState<ProjectMemberEntry[]>([]);

  useEffect(() => {
    const nextMembers: ProjectMemberEntry[] = projectMembers.map((member, index) => ({
      id: member.id,
      name: member.name,
      permission: index === 0 ? '编辑' : '浏览',
    }));
    setManagedMembers(nextMembers);
  }, [projectMembers]);

  useEffect(() => {
    if (!project) {
      setProjectNameDraft('');
      setProjectDescDraft('');
      setIsEditingProjectName(false);
      setIsEditingProjectDesc(false);
      return;
    }

    setProjectNameDraft(project.name);
    setProjectDescDraft(project.desc);
    setIsEditingProjectName(false);
    setIsEditingProjectDesc(false);
  }, [project]);

  const inviteDirectoryMap = useMemo(
    () => new Map(LAB_MEMBER_DIRECTORY.map((member) => [member.id, member])),
    [],
  );

  const inviteCandidateOptions = useMemo(() => {
    const joinedMemberIds = new Set(managedMembers.map((member) => member.id));
    return LAB_MEMBER_DIRECTORY.filter((member) => !joinedMemberIds.has(member.id)).map((member) => ({
      label: `${member.name}（${member.email}）`,
      value: member.id,
      searchText: `${member.name} ${member.email}`,
    }));
  }, [managedMembers]);

  const experimentList = useMemo(() => {
    if (!id) return [];
    return EXPERIMENTS_BY_PROJECT[id] ?? [];
  }, [id]);

  const [localDocs, setLocalDocs] = useState(() => [...experimentList]);

  useEffect(() => {
    setLocalDocs([...experimentList]);
  }, [experimentList]);

  const resetCreateDocForm = () => {
    setSelectedFiles([]);
    setCreateDocError('');
  };

  const openCreateDocModal = () => {
    resetCreateDocForm();
    setShowCreateDocModal(true);
  };

  const openMemberModal = () => {
    setMemberModalError('');
    setSelectedInviteMemberIds([]);
    setInvitePermission('浏览');
    setShowMemberModal(true);
  };

  const closeMemberModal = () => {
    setShowMemberModal(false);
    setMemberModalError('');
    setSelectedInviteMemberIds([]);
    setInvitePermission('浏览');
  };

  const handleOpenTemplatePicker = () => {
    setTemplateDocumentTags([]);
    setSelectedTemplateId('tpl-blank');
    setIsTemplateTagExpanded(false);
    setIsCreatingTemplateTag(false);
    setTemplateTagSearchKeyword('');
    setPreviewTemplate(null);
    setShowTemplatePickerModal(true);
  };

  const closeTemplatePickerModal = () => {
    setShowTemplatePickerModal(false);
    setTemplateDocumentTags([]);
    setIsTemplateTagExpanded(false);
    setIsCreatingTemplateTag(false);
    setTemplateTagSearchKeyword('');
    setPreviewTemplate(null);
  };

  const templateTagOptions = useMemo(() => {
    const tags = new Set<string>([...PROJECT_TAG_CANDIDATES, ...customTemplateTags]);
    localDocs.forEach((document) => document.tags.forEach((tag) => tags.add(tag)));
    return [...tags]
      .sort((left, right) => left.localeCompare(right, 'zh-CN'))
      .map((tag) => ({ label: tag, value: tag }));
  }, [customTemplateTags, localDocs]);

  useEffect(() => {
    const container = templateTagListRef.current;
    if (!container || !showTemplatePickerModal || previewTemplate) {
      setShowTemplateTagToggle(false);
      return;
    }

    const updateOverflow = () => setShowTemplateTagToggle(container.scrollHeight > 72);
    updateOverflow();
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(container);
    return () => observer.disconnect();
  }, [isCreatingTemplateTag, previewTemplate, showTemplatePickerModal, templateTagOptions]);

  const toggleTemplateDocumentTag = (tag: string) => {
    setTemplateDocumentTags((currentTags) =>
      currentTags.includes(tag) ? currentTags.filter((currentTag) => currentTag !== tag) : [...currentTags, tag],
    );
  };

  const createTemplateTagFromSearch = () => {
    const tag = templateTagSearchKeyword.trim();
    if (tag) {
      setCustomTemplateTags((currentTags) => currentTags.includes(tag) ? currentTags : [...currentTags, tag]);
      if (!templateDocumentTags.includes(tag)) {
        setTemplateDocumentTags((currentTags) => [...currentTags, tag]);
      }
    }
    setTemplateTagSearchKeyword('');
    setIsCreatingTemplateTag(false);
  };

  const handlePickTemplate = (template: ProjectTemplate) => {
    if (!id) return;

    const documentId = createLocalDocId();
    const documentTitle = template.name.trim() || '未命名文档';
    const now = new Date();
    const updatedAt = formatDateToCnymdhm(now);
    const ownerId = projectMembers[0]?.id ?? 'm-system';
    const document: ProjectExperimentDetail = {
      id: documentId,
      title: documentTitle,
      summary: `基于「${documentTitle}」模版创建`,
      ownerId,
      status: '进行中',
      tags: templateDocumentTags,
      subtitle: '基于项目模版创建的文档',
      updatedAt,
      timeline: [
        {
          id: `${documentId}-create`,
          date: updatedAt,
          status: '创建试验方案',
          summary: `使用「${documentTitle}」模版创建文档`,
          actor: '当前用户',
          updatedAt,
          detailTitle: documentTitle,
          detailDescription: '基于项目模版创建',
          detailSections: [],
          attachments: [],
          markdownContent: template.body,
        },
      ],
      resources: [],
    };

    EXPERIMENT_DETAILS_BY_PROJECT[id] = [document, ...(EXPERIMENT_DETAILS_BY_PROJECT[id] ?? [])];
    EXPERIMENTS_BY_PROJECT[id] = [
      {
        id: document.id,
        title: document.title,
        summary: document.summary,
        ownerId: document.ownerId,
        status: document.status,
        tags: document.tags,
      },
      ...(EXPERIMENTS_BY_PROJECT[id] ?? []),
    ];
    setLocalDocs((prev) => [
      {
        id: document.id,
        title: document.title,
        summary: document.summary,
        ownerId: document.ownerId,
        status: document.status,
        tags: document.tags,
      },
      ...prev,
    ]);
    closeTemplatePickerModal();
    navigate(`/project/${id}/experiment/${documentId}`, { state: { mode: 'edit' } });
  };

  const handlePreviewTemplate = (template: ProjectTemplate) => {
    setPreviewTemplate(template);
  };

  const closeTemplatePreviewModal = () => {
    setPreviewTemplate(null);
  };

  const handleImportDocClick = () => {
    openCreateDocModal();
  };

  const closeCreateDocModal = () => {
    setShowCreateDocModal(false);
    resetCreateDocForm();
  };

  const handlePermissionChange = (memberId: string, permission: MemberPermission) => {
    setManagedMembers((prev) =>
      prev.map((member) =>
        member.id === memberId
          ? {
              ...member,
              permission,
            }
          : member,
      ),
    );
  };

  const handleMemberPermissionActionChange = (memberId: string, action: string | number) => {
    if (action === '编辑') {
      handlePermissionChange(memberId, '编辑');
      return;
    }

    if (action === '浏览') {
      handlePermissionChange(memberId, '浏览');
      return;
    }

    if (action === '移除') {
      setManagedMembers((prev) => prev.filter((member) => member.id !== memberId));
    }
  };

  const handleInviteMember = () => {
    if (selectedInviteMemberIds.length === 0) {
      setMemberModalError('请先选择要邀请的成员');
      return;
    }

    setManagedMembers((prev) => {
      const joinedIds = new Set(prev.map((member) => member.id));
      const membersToInvite = selectedInviteMemberIds
        .map((memberId) => inviteDirectoryMap.get(memberId))
        .filter((member): member is LabMemberDirectoryEntry => !!member)
        .filter((member) => !joinedIds.has(member.id))
        .map((member) => ({
          id: member.id,
          name: member.name,
          permission: invitePermission,
        }));

      return membersToInvite.length > 0 ? [...prev, ...membersToInvite] : prev;
    });

    setSelectedInviteMemberIds([]);
    setInvitePermission('浏览');
    setMemberModalError('');
  };

  const handleCreateDocSubmit = () => {
    if (selectedFiles.length === 0) {
      setCreateDocError('请先选择至少一个文件');
      return;
    }

    const uploadedDocs = selectedFiles.map((file) => {
      const nameWithoutExt = getFileNameWithoutExt(file.name);
      const extension = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : '';

      return {
        id: createLocalDocId(),
        title: nameWithoutExt || file.name,
        summary: `上传文件：${file.name}`,
        ownerId: projectMembers[0]?.id ?? 'm-system',
        status: '进行中' as const,
        tags: extension ? ['外部导入', extension.toUpperCase()] : ['外部导入'],
      };
    });

    setLocalDocs((prev) => [...uploadedDocs, ...prev]);
    closeCreateDocModal();
  };

  const documentTagOptions = useMemo(() => {
    const uniqueTags = Array.from(new Set(localDocs.flatMap((item) => item.tags)));
    return ['all', ...uniqueTags];
  }, [localDocs]);

  const documentList = useMemo(() => {
    if (activeTab !== 'experiment') {
      return experimentList;
    }

    const keyword = searchKeyword.trim().toLowerCase();

      return localDocs.filter((item) => {
      if (selectedTag !== 'all' && !item.tags.includes(selectedTag)) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const searchableText = [item.title, item.summary, ...item.tags].join(' ').toLowerCase();
      return searchableText.includes(keyword);
    });
  }, [activeTab, localDocs, searchKeyword, selectedTag]);

  useEffect(() => {
    if (activeTab !== 'experiment') {
      return;
    }

    const checkTagOverflow = () => {
      const container = tagFilterRef.current;
      if (!container) {
        setShowTagToggle(false);
        return;
      }

      const hasOverflow = container.scrollHeight > TAG_COLLAPSED_MAX_HEIGHT + 1;
      setShowTagToggle(hasOverflow);
      if (!hasOverflow) {
        setIsTagExpanded(false);
      }
    };

    checkTagOverflow();
    window.addEventListener('resize', checkTagOverflow);
    return () => window.removeEventListener('resize', checkTagOverflow);
  }, [activeTab, documentTagOptions]);

  const conversationList = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword || activeTab !== 'chat') {
      return chats;
    }

    return chats.filter((chat) => {
      const searchableText = [chat.title, chat.date, formatChatDateTime(chat.date, chat.id)]
        .join(' ')
        .toLowerCase();
      return searchableText.includes(keyword);
    });
  }, [activeTab, chats, searchKeyword]);

  const memberCount = managedMembers.length;

  const handleProjectNameSubmit = () => {
    const normalizedName = projectNameDraft.trim();
    if (!normalizedName) {
      setProjectNameDraft(project?.name ?? '');
    } else {
      setProjectNameDraft(normalizedName);
    }
    setIsEditingProjectName(false);
  };

  const handleProjectDescSubmit = () => {
    const normalizedDesc = projectDescDraft.trim();
    if (!normalizedDesc) {
      setProjectDescDraft(project?.desc ?? '');
    } else {
      setProjectDescDraft(normalizedDesc);
    }
    setIsEditingProjectDesc(false);
  };

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <header className="z-10 flex h-16 shrink-0 items-center justify-between bg-white/80 px-4 backdrop-blur-sm">
        <div className="flex min-w-0 items-center gap-3">
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-secondaryText hover:bg-bgLight rounded-full transition-colors"
              title="展开边栏"
            >
              <Menu size={20} />
            </button>
          )}
<button
type="button"
onClick={() => navigate('/projects')}
className="inline-flex items-center gap-1 text-sm text-tertiaryText transition-colors hover:text-primaryText"
>
<ArrowLeft size={16} />
返回
</button>
        </div>

        {project && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openMemberModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-transparent px-1 py-1 text-[14px] leading-5 font-medium text-secondaryText transition-colors hover:text-primaryText"
            >
              <Users size={15} className="text-current" />
              <span>管理成员</span>
            </button>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-12 pt-4 md:px-8 lg:px-10 md:pb-12 md:pt-6">
        <div className="mx-auto max-w-[1240px]">
          {!project ? (
            <div className="rounded-lg border border-dashed border-[var(--color-border-soft)]">
              <BaseEmpty description="项目不存在或已被删除" />
            </div>
          ) : (
            <section>
              {isEditingProjectName ? (
                <input
                  type="text"
                  value={projectNameDraft}
                  onChange={(event) => setProjectNameDraft(event.target.value)}
                  onBlur={handleProjectNameSubmit}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleProjectNameSubmit();
                    }
                    if (event.key === 'Escape') {
                      setProjectNameDraft(project.name);
                      setIsEditingProjectName(false);
                    }
                  }}
                  autoFocus
                  className="w-full max-w-[560px] rounded-md border border-[var(--color-primary)] bg-white px-2 py-1 text-2xl font-semibold text-primaryText outline-none"
                />
              ) : (
                <div className="group relative block w-fit max-w-full">
                  <h2
                    className="cursor-text text-2xl font-semibold text-primaryText"
                    onClick={() => setIsEditingProjectName(true)}
                  >
                    {projectNameDraft || project.name}
                  </h2>
                  <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-1.5 w-max -translate-x-1/2 rounded-md bg-gray-7 px-2 py-1 text-xs text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                    点击编辑项目名称
                  </div>
                </div>
              )}

              {isEditingProjectDesc ? (
                <input
                  type="text"
                  value={projectDescDraft}
                  onChange={(event) => setProjectDescDraft(event.target.value)}
                  onBlur={handleProjectDescSubmit}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleProjectDescSubmit();
                    }
                    if (event.key === 'Escape') {
                      setProjectDescDraft(project.desc);
                      setIsEditingProjectDesc(false);
                    }
                  }}
                  autoFocus
                  className="mt-1 w-full max-w-[760px] rounded-md border border-[var(--color-line-subtle)] bg-white px-2 py-1 text-sm text-tertiaryText outline-none focus:border-[var(--color-primary)]"
                />
              ) : (
                <div className="group relative mt-1 block max-w-[760px]">
                  <p
                    className="cursor-text text-sm text-tertiaryText"
                    onClick={() => setIsEditingProjectDesc(true)}
                  >
                    {projectDescDraft || project.desc}
                  </p>
                  <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-1.5 w-max -translate-x-1/2 rounded-md bg-gray-7 px-2 py-1 text-xs text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                    点击编辑项目描述
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f4f7] px-2.5 py-0.5 text-[13px] font-medium text-secondaryText">
                  <Users size={13} className="text-secondaryText" />
                  <span>成员 {memberCount} 人</span>
                </span>
              </div>

              <div className="mt-10 border-b border-[var(--color-line-subtle)]">
                <div className="flex items-end gap-8">
                  <button
                    type="button"
                    onClick={() => setActiveTab('experiment')}
                    className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'experiment'
                        ? 'border-[var(--color-primary)] text-primaryText'
                        : 'border-transparent text-tertiaryText'
                    }`}
                  >
                    文档 {localDocs.length}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('chat')}
                    className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'chat'
                        ? 'border-[var(--color-primary)] text-primaryText'
                        : 'border-transparent text-tertiaryText'
                    }`}
                  >
                    对话 {chats.length}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full max-w-[320px]">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tertiaryText"
                  />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(event) => setSearchKeyword(event.target.value)}
                    placeholder={`搜索${activeTab === 'experiment' ? '文档' : '历史对话'}`}
                    className="h-9 w-full rounded-lg border border-[var(--color-line-subtle)] bg-white pl-9 pr-3 text-sm text-primaryText transition-colors placeholder:text-tertiaryText hover:border-[var(--color-gray-3)] focus:border-[var(--color-primary)] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-5">
                  {activeTab === 'experiment' ? (
                    <button
                      type="button"
                      onClick={handleOpenTemplatePicker}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-hover)]"
                    >
                      <Plus size={16} />
                      新建
                    </button>
                  ) : (
                    <BaseButton
                      type="ghost"
                      size="small"
                      rounded="large"
                      className="!h-auto !gap-1 !border-transparent !bg-transparent !px-0 !py-0 !text-sm !font-semibold !text-[var(--color-primary)] hover:!bg-transparent hover:!text-[var(--color-primary-hover)]"
                    >
                      发起对话
                    </BaseButton>
                  )}
                  {activeTab === 'experiment' && (
                    <>
                      <span className="h-4 border-l border-[var(--color-line-subtle)]" aria-hidden="true" />
                      <button
                        type="button"
                        onClick={handleImportDocClick}
                        className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-hover)] hover:underline"
                      >
                        <Upload size={14} />
                        导入
                      </button>
                    </>
                  )}
                </div>
              </div>

              {activeTab === 'experiment' && (
                <div className="mt-3">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      ref={tagFilterRef}
                      className="flex flex-1 flex-wrap gap-2 overflow-hidden transition-[max-height] duration-200"
                      style={{
                        maxHeight:
                          isTagExpanded || !showTagToggle
                            ? undefined
                            : `${TAG_COLLAPSED_MAX_HEIGHT}px`,
                      }}
                    >
                      {documentTagOptions.map((tag) => {
                        const isActive = selectedTag === tag;
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setSelectedTag(tag)}
                            className={`h-7 rounded-full border px-3 text-xs transition-colors ${
                              isActive
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                                : 'border-[var(--color-line-subtle)] bg-white text-secondaryText hover:border-[var(--color-gray-3)]'
                            }`}
                          >
                            {tag === 'all' ? '全部' : tag}
                          </button>
                        );
                      })}
                    </div>
                    {showTagToggle && (
                      <button
                        type="button"
                        onClick={() => setIsTagExpanded((prev) => !prev)}
                        className="shrink-0 text-xs text-tertiaryText transition-colors hover:text-primaryText"
                      >
                        {isTagExpanded ? '收起' : '展开'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'experiment' ? (
                documentList.length > 0 ? (
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {documentList.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigate(`/project/${project.id}/experiment/${item.id}`)}
                        className="flex min-h-[132px] flex-col rounded-lg border border-[var(--color-line-subtle)] bg-[var(--color-surface)] px-4 py-3.5 text-left transition-all hover:border-[var(--color-gray-3)] hover:shadow-sm"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <h3 className="truncate text-base font-medium text-primaryText">{item.title}</h3>
                          {item.id === 'exp-crispr-1' && (
                            <span className="shrink-0 rounded-full bg-[var(--color-primary)] px-1.5 py-[2px] text-xs font-medium leading-none text-white">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 min-h-[40px] line-clamp-2 text-sm leading-5 text-secondaryText">
                          {item.summary}
                        </p>
                        {item.tags.length > 0 && (
                          <div className="mt-auto flex flex-wrap gap-2 pt-3">
                            {item.tags.map((tag) => (
                              <span
                                key={`${item.id}-${tag}`}
                                className="inline-flex items-center rounded-lg bg-[#f3f6f9] px-3 py-1 text-xs text-secondaryText"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg border border-dashed border-[var(--color-border-soft)]">
                    <BaseEmpty description="暂无匹配的文档" />
                  </div>
                )
              ) : conversationList.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {conversationList.map((chat) => (
                    <div
                      key={chat.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/chat/${chat.id}`)}
                      onKeyDown={(event) => event.key === 'Enter' && navigate(`/chat/${chat.id}`)}
                      className="group -ml-2 flex w-[calc(100%+0.5rem)] items-center justify-between rounded-lg px-2 py-3 text-left transition-colors hover:bg-[#f8fafc]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-primaryText">{chat.title}</div>
                        <div className="mt-1 text-xs text-tertiaryText">
                          {formatChatDateTime(chat.date, chat.id)}
                        </div>
                      </div>
                      <BaseActionMenu
                        open={chatActionMenuId === chat.id}
                        onOpenChange={(open) => setChatActionMenuId(open ? chat.id : null)}
                        placement="bottom-end"
                        width={150}
                        trigger={<MoreHorizontal size={16} />}
                        onTriggerClick={(event) => event.stopPropagation()}
                        items={[{ key: 'move', label: '迁移项目', icon: <Folder size={14} /> }]}
                        onItemClick={(item, event) => {
                          event.stopPropagation();
                          if (item.key === 'move') {
                            openMoveChatModal(chat);
                          }
                          setChatActionMenuId(null);
                        }}
                        triggerClassName="hidden h-7 w-7 items-center justify-center rounded-md text-secondaryText group-hover:inline-flex hover:bg-bgLight"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-dashed border-[var(--color-border-soft)]">
                  <BaseEmpty description="暂无匹配的历史对话" />
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      <BaseModal
        visible={showCreateDocModal}
        title="导入文档"
        width={500}
        maskClosable={false}
        cancelText="取消"
        okText="导入"
        onCancel={closeCreateDocModal}
        onConfirm={handleCreateDocSubmit}
        bodyClassName="!px-6 !py-5"
      >
        <div className="space-y-4">
          <div className="space-y-3">
            <BaseDocumentUpload
              value={selectedFiles}
              maxCount={5}
              maxSize={20 * 1024 * 1024}
              onChange={setSelectedFiles}
              onError={(error) => setCreateDocError(error.message)}
            />
          </div>

          {createDocError && <div className="text-sm text-[var(--color-danger)]">{createDocError}</div>}
        </div>
      </BaseModal>

      <BaseModal
        visible={showTemplatePickerModal}
        title="新建文档"
        width={1040}
        maskClosable={false}
        footer={
          <div className="flex justify-end gap-2 px-6 py-4">
            <BaseButton type="secondary" size="medium" onClick={closeTemplatePickerModal}>
              取消
            </BaseButton>
            <BaseButton
              type="primary"
              size="medium"
              disabled={!previewTemplate && !selectedTemplateId}
              onClick={() => {
                const template = previewTemplate ?? DEFAULT_TEMPLATES.find((item) => item.id === selectedTemplateId);
                if (template) handlePickTemplate(template);
              }}
            >
              新建文档
            </BaseButton>
          </div>
        }
        onCancel={closeTemplatePickerModal}
        bodyClassName="!px-6 !py-5"
      >
        {!previewTemplate && <div className="mb-5">
          <label className="mb-2 block text-sm font-medium text-primaryText">设置项目标签</label>
          <div>
            <div
              ref={templateTagListRef}
              className={`flex flex-wrap gap-2 overflow-hidden transition-[max-height] duration-200 ${
                isTemplateTagExpanded ? 'max-h-64 overflow-y-auto pr-1' : 'max-h-[72px]'
              }`}
            >
              {isCreatingTemplateTag ? (
                <input
                  autoFocus
                  value={templateTagSearchKeyword}
                  onChange={(event) => setTemplateTagSearchKeyword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      createTemplateTagFromSearch();
                    } else if (event.key === 'Escape') {
                      setTemplateTagSearchKeyword('');
                      setIsCreatingTemplateTag(false);
                    }
                  }}
                  onBlur={() => {
                    if (!templateTagSearchKeyword.trim()) setIsCreatingTemplateTag(false);
                  }}
                  placeholder="输入标签名称"
                  className="box-border h-8 w-32 shrink-0 rounded-md border border-[var(--color-primary)] px-2 text-sm text-primaryText outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingTemplateTag(true);
                    setIsTemplateTagExpanded(true);
                  }}
                  className="inline-flex box-border h-[30px] shrink-0 items-center gap-1 self-center rounded-md border border-dashed border-[var(--color-gray-3)] px-2.5 text-sm text-tertiaryText transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                >
                  <Plus size={14} />
                  新建标签
                </button>
              )}
              {templateTagOptions.map((tag) => {
                const isSelected = templateDocumentTags.includes(tag.value);
                return (
                  <button
                    key={tag.value}
                    type="button"
                    onClick={() => toggleTemplateDocumentTag(tag.value)}
                    className={`inline-flex h-8 items-center rounded-md px-2.5 text-sm transition-colors ${
                      isSelected
                        ? 'bg-primary-soft font-semibold text-[var(--color-primary)]'
                        : 'bg-bgLight text-secondaryText hover:bg-primary-soft hover:font-semibold hover:text-[var(--color-primary)]'
                    }`}
                    aria-pressed={isSelected}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
            {showTemplateTagToggle && (
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={() => setIsTemplateTagExpanded((expanded) => !expanded)}
                  className="inline-flex items-center gap-1.5 text-sm text-[var(--color-gray-5)] transition-colors hover:text-tertiaryText"
                >
                  {isTemplateTagExpanded ? '收起标签' : '展开全部标签'}
                  <ChevronDown size={13} className={`transition-transform ${isTemplateTagExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
          </div>
        </div>}

        {previewTemplate ? (
          <div className="flex h-[690px] flex-col">
            <button
              type="button"
              onClick={closeTemplatePreviewModal}
              className="mb-4 inline-flex shrink-0 items-center gap-1 text-sm text-secondaryText transition-colors hover:text-primaryText"
            >
              <ArrowLeft size={16} />
              退出预览
            </button>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="prose prose-slate max-w-none pb-2 text-primaryText prose-p:my-3 prose-p:text-sm prose-p:leading-7 prose-li:text-sm prose-li:leading-7 prose-headings:text-primaryText prose-headings:tracking-[-0.01em] prose-h2:mt-4 prose-h2:mb-2 prose-h2:text-[16px] prose-h2:font-semibold prose-h3:mt-4 prose-h3:mb-2 prose-h3:text-base prose-h3:font-semibold prose-strong:text-primaryText prose-code:before:content-none prose-code:after:content-none prose-hr:my-5 prose-li:my-1 prose-li:marker:text-secondaryText prose-ol:pl-6 prose-ul:pl-6 prose-blockquote:border-l-2 prose-blockquote:border-[var(--color-line-subtle)] prose-blockquote:pl-3 prose-blockquote:text-secondaryText">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{previewTemplate.body}</ReactMarkdown>
              </div>
            </div>
          </div>
        ) : (
          <section>
            <h3 className="mb-3 text-sm font-medium text-primaryText">选择项目模版</h3>
            <div className="grid grid-cols-4 gap-4">
            {DEFAULT_TEMPLATES.map((tpl) => {
              const isSelected = selectedTemplateId === tpl.id;
              return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setSelectedTemplateId(tpl.id)}
                className={`group relative flex flex-col overflow-hidden rounded-lg border bg-[var(--color-surface-muted)] text-left transition-all ${
                  isSelected
                    ? 'border-[var(--color-primary)] ring-2 ring-[color-mix(in_srgb,var(--color-primary)_16%,transparent)]'
                    : 'border-[var(--color-line-subtle)] hover:border-[var(--color-gray-3)]'
                }`}
              >
                <span className={`absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full border ${isSelected ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--color-gray-3)] bg-white text-transparent'}`}>
                  <Check size={13} strokeWidth={3} />
                </span>
                <div className="px-3 pt-3">
                  <span className="truncate text-sm font-semibold text-primaryText">{tpl.name}</span>
                </div>

                <div className="relative mx-3 mb-3 mt-2.5 aspect-[4/5] overflow-hidden rounded-md bg-white">
                  <div className="pointer-events-none origin-top-left scale-[0.62] px-3 py-2.5" style={{ width: '161%' }}>
                    <div className="prose prose-slate max-w-none text-primaryText prose-p:my-1.5 prose-p:text-xs prose-p:leading-5 prose-li:text-xs prose-li:leading-5 prose-headings:text-primaryText prose-h2:mt-0 prose-h2:mb-1.5 prose-h2:text-sm prose-h2:font-semibold prose-h3:mt-2 prose-h3:mb-1 prose-h3:text-xs prose-h3:font-semibold prose-strong:text-primaryText prose-hr:my-2 prose-li:my-0.5 prose-ol:pl-4 prose-ul:pl-4 prose-table:text-xs prose-th:py-1 prose-td:py-1 prose-blockquote:border-l-2 prose-blockquote:pl-2 prose-blockquote:text-secondaryText">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{tpl.body}</ReactMarkdown>
                    </div>
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />

                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/70 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                    {tpl.id !== 'tpl-blank' && (
                      <BaseButton
                        type="secondary"
                        size="small"
                        rounded="large"
                        onClick={(event) => {
                          event.stopPropagation();
                          handlePreviewTemplate(tpl);
                        }}
                      >
                        预览
                      </BaseButton>
                    )}
                  </div>
                </div>
              </button>
              );
            })}
            </div>
          </section>
        )}
      </BaseModal>

      <BaseModal
        visible={showMemberModal}
        title="管理成员"
        width={560}
        maskClosable={false}
        footer={null}
        onCancel={closeMemberModal}
        bodyClassName="!px-6 !py-5"
      >
        <div className="space-y-5">
          <section className="space-y-3">
            <div className="text-sm font-medium text-primaryText">加入新成员</div>
            <div className="flex items-center gap-3">
              <div className="flex flex-1 items-center rounded-lg border border-[var(--color-line-subtle)] bg-white px-2.5 py-1">
                <div className="min-w-0 flex-1">
                  <Select
                    mode="multiple"
                    showSearch
                    bordered={false}
                    value={selectedInviteMemberIds}
                    options={inviteCandidateOptions}
                    optionFilterProp="searchText"
                    popupClassName="project-invite-member-dropdown"
                    suffixIcon={null}
                    placeholder="搜索姓名/邮箱并选择成员"
                    onChange={(values) => {
                      setSelectedInviteMemberIds(values as string[]);
                      if (memberModalError) {
                        setMemberModalError('');
                      }
                    }}
                    className="w-full"
                  />
                </div>
                <div className="mx-2 h-5 w-px bg-[var(--color-line-soft)]" />
                <Select
                  bordered={false}
                  value={invitePermission}
                  options={MEMBER_PERMISSION_OPTIONS}
                  onChange={(value) => setInvitePermission((value as MemberPermission) ?? '浏览')}
                  className="w-[76px]"
                  popupClassName="project-member-permission-dropdown"
                />
              </div>
              <BaseButton type="primary" size="medium" onClick={handleInviteMember}>
                邀请成员
              </BaseButton>
            </div>
            {memberModalError && <div className="text-sm text-[var(--color-danger)]">{memberModalError}</div>}
          </section>

          <section className="space-y-3 border-t border-[var(--color-line-soft)] pt-4">
            {managedMembers.length > 0 ? (
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {managedMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-line-subtle)] bg-[var(--color-surface)] px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-primaryText">{member.name}</div>
                      <div className="mt-0.5 text-xs text-tertiaryText">项目成员</div>
                    </div>
                    <Select
                      bordered={false}
                      value={member.permission}
                      options={MEMBER_PERMISSION_ACTION_OPTIONS}
                      onChange={(value) => handleMemberPermissionActionChange(member.id, value)}
                      className="member-permission-action-select w-[84px]"
                      popupClassName="project-member-permission-dropdown"
                      getPopupContainer={() => document.body}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--color-border-soft)] px-3 py-5 text-center text-sm text-tertiaryText">
                暂无成员
              </div>
            )}
          </section>
        </div>
      </BaseModal>
    </div>
  );
}