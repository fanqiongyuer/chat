import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLocation, useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, ChevronDown, Menu, MoreHorizontal, Plus, Trash2, X } from 'lucide-react';
import { BaseActionMenu, BaseButton, BaseEmpty, BaseInput, BaseModal, ShareModal } from '../components';
import type { BaseActionMenuItem, BaseActionMenuProps } from '../components';
import {
  EXPERIMENT_DETAILS_BY_PROJECT,
  PROJECT_MEMBERS,
  findProjectExperimentDetail,
  mockProjects,
  type ExperimentTimelineEntry,
} from '../mock/projects';
import { type LayoutOutletContext } from '../components/Layout';
import type { ProjectTemplate } from './ProjectsPage';

const getDefaultTimelineEntry = (timeline: ExperimentTimelineEntry[]) =>
  timeline.find((entry) => entry.status !== '实验结束') ?? timeline[0] ?? null;

export default function ExperimentDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId, experimentId } = useParams<{
    projectId: string;
    experimentId: string;
  }>();
  const [searchParams] = useSearchParams();
  const isSharedView = searchParams.get('shared') === 'true';
  const [saveToLibraryDone, setSaveToLibraryDone] = useState(false);
  const [showSaveToProjectModal, setShowSaveToProjectModal] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [targetProjectId, setTargetProjectId] = useState('');
  const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<LayoutOutletContext>();
  const [isContentScrolling, setIsContentScrolling] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDocActionMenu, setShowDocActionMenu] = useState(false);
  const [showMoveDocumentModal, setShowMoveDocumentModal] = useState(false);
  const [moveTargetProjectId, setMoveTargetProjectId] = useState('');
  const [showCreateMoveProjectPopover, setShowCreateMoveProjectPopover] = useState(false);
  const [newMoveProjectName, setNewMoveProjectName] = useState('');
  const [moveProjectError, setMoveProjectError] = useState('');
  const [movableProjects, setMovableProjects] = useState(mockProjects);
  const [mode, setMode] = useState<'view' | 'edit'>(
    (location.state as { mode?: 'view' | 'edit' } | null)?.mode ?? 'view',
  );
  const [docTitle, setDocTitle] = useState('');
  const [docTags, setDocTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
  const [editingTagValue, setEditingTagValue] = useState('');
  const [docContent, setDocContent] = useState('');
  const [saveHint, setSaveHint] = useState<'' | 'saving' | 'saved'>('');
  const [uploadedAttachments, setUploadedAttachments] = useState<Array<{ id: string; name: string; progress: number }>>([]);
  const contentScrollTimerRef = useRef<number | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentUploadTimersRef = useRef<Record<string, number>>({});
  const tagInputRef = useRef<HTMLInputElement | null>(null);
  const autoSaveTimerRef = useRef<number | null>(null);
  const savedContentRef = useRef({ title: '', tags: [] as string[], content: '' });

  const project = useMemo(
    () => mockProjects.find((item) => item.id === projectId),
    [projectId],
  );
  const targetProject = useMemo(
    () => mockProjects.find((item) => item.id === targetProjectId),
    [targetProjectId],
  );
  const saveToProjectMenuItems = useMemo<BaseActionMenuItem[]>(
    () => mockProjects.map((item) => ({
      key: item.id,
      label: <span className="block truncate">{item.name}</span>,
      active: item.id === targetProjectId,
    })),
    [targetProjectId],
  );
  const moveTargetProject = useMemo(
    () => movableProjects.find((item) => item.id === moveTargetProjectId),
    [movableProjects, moveTargetProjectId],
  );
  const experiment = useMemo(() => {
    if (!projectId || !experimentId) return null;
    return findProjectExperimentDetail(projectId, experimentId) ?? null;
  }, [projectId, experimentId]);
  const ownerName = useMemo(() => {
    if (!projectId || !experiment) return '未知成员';
    return (
      PROJECT_MEMBERS[projectId]?.find((member) => member.id === experiment.ownerId)?.name ??
      '未知成员'
    );
  }, [experiment, projectId]);

  const activeTimeline = useMemo(() => {
    if (!experiment) return null;
    return getDefaultTimelineEntry(experiment.timeline);
  }, [experiment]);

  const originalMarkdown = useMemo(() => {
    if (!activeTimeline) return '';
    const sectionsMd = (activeTimeline.detailSections ?? [])
      .map((section) => `## ${section.title}\n\n${section.content}`)
      .join('\n\n');
    return activeTimeline.markdownContent ?? sectionsMd ?? '';
  }, [activeTimeline]);

  const originalTitle = useMemo(
    () => activeTimeline?.detailTitle ?? experiment?.title ?? '',
    [activeTimeline, experiment],
  );
  const originalTags = useMemo(() => experiment?.tags ?? [], [experiment]);

  useEffect(() => {
    setDocTitle(originalTitle);
    setDocTags(originalTags);
    setDocContent(originalMarkdown);
    savedContentRef.current = {
      title: originalTitle,
      tags: originalTags,
      content: originalMarkdown,
    };
  }, [originalTitle, originalTags, originalMarkdown]);

  const persistDoc = useCallback(
    (next: { title: string; tags: string[]; content: string }) => {
      // TODO: 对接后端保存接口，此处仅做本地保存演示
      savedContentRef.current = next;
      if (activeTimeline) {
        activeTimeline.detailTitle = next.title;
        activeTimeline.markdownContent = next.content;
      }
      if (experiment) {
        experiment.tags = next.tags;
      }
      setSaveHint('saved');
      window.setTimeout(() => setSaveHint(''), 1500);
    },
    [activeTimeline, experiment],
  );

  const scheduleAutoSave = useCallback(
    (next: { title: string; tags: string[]; content: string }) => {
      setSaveHint('saving');
      if (autoSaveTimerRef.current !== null) {
        window.clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = window.setTimeout(() => {
        persistDoc(next);
      }, 800);
    },
    [persistDoc],
  );

  const handleDocContentChange = (value: string) => {
    setDocContent(value);
    scheduleAutoSave({ title: docTitle, tags: docTags, content: value });
  };

  const handleDocTitleChange = (value: string) => {
    setDocTitle(value);
    scheduleAutoSave({ title: value, tags: docTags, content: docContent });
  };

  const handleStartAddTag = () => {
    setIsAddingTag(true);
    setTagInput('');
  };

  const handleCommitAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !docTags.includes(trimmed)) {
      const nextTags = [...docTags, trimmed];
      setDocTags(nextTags);
      scheduleAutoSave({ title: docTitle, tags: nextTags, content: docContent });
    }
    setTagInput('');
    setIsAddingTag(false);
  };

  const handleCancelAddTag = () => {
    setTagInput('');
    setIsAddingTag(false);
  };

  const handleAddTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      handleCommitAddTag();
    } else if (event.key === 'Backspace' && tagInput === '') {
      event.preventDefault();
      handleCancelAddTag();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      handleCancelAddTag();
    }
  };

  const handleRemoveTag = (tag: string) => {
    const nextTags = docTags.filter((item) => item !== tag);
    setDocTags(nextTags);
    scheduleAutoSave({ title: docTitle, tags: nextTags, content: docContent });
  };

  const handleStartEditTag = (index: number) => {
    setEditingTagIndex(index);
    setEditingTagValue(docTags[index] ?? '');
  };

  const handleCommitEditTag = () => {
    if (editingTagIndex === null) return;
    const trimmed = editingTagValue.trim();
    if (!trimmed || docTags.includes(trimmed)) {
      setEditingTagIndex(null);
      setEditingTagValue('');
      return;
    }
    const nextTags = [...docTags];
    nextTags[editingTagIndex] = trimmed;
    setDocTags(nextTags);
    setEditingTagIndex(null);
    setEditingTagValue('');
    scheduleAutoSave({ title: docTitle, tags: nextTags, content: docContent });
  };

  const handleCancelEditTag = () => {
    setEditingTagIndex(null);
    setEditingTagValue('');
  };

  const handleEditTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleCommitEditTag();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      handleCancelEditTag();
    }
  };

  const createdByName = useMemo(() => {
    if (!activeTimeline) return ownerName;
    return activeTimeline.actor || ownerName;
  }, [activeTimeline, ownerName]);

  const modifiedByName = useMemo(() => {
    if (!activeTimeline) return ownerName;
    return activeTimeline.actor || ownerName;
  }, [activeTimeline, ownerName]);

  const parentPath = useMemo(() => {
    if (!projectId) return null;
    return `/project/${projectId}`;
  }, [projectId]);

  const handleContentScroll = () => {
    setIsContentScrolling(true);
    if (contentScrollTimerRef.current !== null) {
      window.clearTimeout(contentScrollTimerRef.current);
    }
    contentScrollTimerRef.current = window.setTimeout(() => {
      setIsContentScrolling(false);
    }, 700);
  };

  const openDeleteConfirmModal = () => {
    setShowDeleteConfirmModal(true);
  };

  const handleSaveAsTemplate = () => {
    setShowDocActionMenu(false);
    const template: ProjectTemplate = {
      id: `tpl-local-${Date.now()}`,
      name: docTitle.trim() || experiment?.title || '未命名模版',
      content: '由现有文档保存',
      body: docContent,
      scope: 'personal',
      creator: '当前用户',
      modifier: '当前用户',
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    navigate('/projects', {
      state: {
        reopenTemplateModal: true,
        templateScope: 'personal',
        newTemplate: template,
      },
    });
  };

  const handleUploadAttachmentClick = () => {
    setShowDocActionMenu(false);
    importInputRef.current?.click();
  };

  const handleUploadAttachmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const id = `${file.name}-${file.size}-${file.lastModified}`;
      setUploadedAttachments((attachments) => attachments.some((attachment) => attachment.id === id)
        ? attachments
        : [...attachments, { id, name: file.name, progress: 0 }]);

      const timer = window.setInterval(() => {
        setUploadedAttachments((attachments) => attachments.map((attachment) => {
          if (attachment.id !== id || attachment.progress >= 100) return attachment;
          const progress = Math.min(100, attachment.progress + Math.max(8, Math.ceil((100 - attachment.progress) / 4)));
          if (progress === 100) {
            window.clearInterval(attachmentUploadTimersRef.current[id]);
            delete attachmentUploadTimersRef.current[id];
            if (activeTimeline && !activeTimeline.attachments.includes(file.name)) activeTimeline.attachments.push(file.name);
          }
          return { ...attachment, progress };
        }));
      }, 180);
      attachmentUploadTimersRef.current[id] = timer;
    });

    event.target.value = '';
  }; 

  const handleShareClick = () => {
    setShowDocActionMenu(false);
    setShowShareModal(true);
  };

  const docActionMenuItems = useMemo<BaseActionMenuItem[]>(
    () => [
      { key: 'uploadAttachment', label: '上传附件' },
      { key: 'moveDocument', label: '移动文档' },
      { key: 'saveAsTemplate', label: '保存为模版' },
      { key: 'share', label: '分享文档' },
    ],
    [],
  );

  const handleDocActionMenuItemClick: BaseActionMenuProps['onItemClick'] = (item) => {
    if (item.key === 'uploadAttachment') {
      handleUploadAttachmentClick();
    } else if (item.key === 'moveDocument') {
      setShowDocActionMenu(false);
      setMoveTargetProjectId('');
      setShowCreateMoveProjectPopover(false);
      setNewMoveProjectName('');
      setMoveProjectError('');
      setShowMoveDocumentModal(true);
    } else if (item.key === 'saveAsTemplate') {
      handleSaveAsTemplate();
    } else if (item.key === 'share') {
      handleShareClick();
    }
  };

  const closeMoveDocumentModal = () => {
    setShowMoveDocumentModal(false);
    setShowCreateMoveProjectPopover(false);
    setMoveProjectError('');
  };

  const handleCreateMoveProject = () => {
    const name = newMoveProjectName.trim();
    if (!name) {
      setMoveProjectError('请输入项目名称');
      return;
    }
    const duplicateProject = movableProjects.find(
      (item) => item.name.trim().toLowerCase() === name.toLowerCase(),
    );
    if (duplicateProject) {
      setMoveTargetProjectId(duplicateProject.id);
    } else {
      const newProject = {
        id: `p-local-${Date.now()}`,
        name,
        desc: '暂无项目描述',
        count: 0,
        knowledge: 0,
        members: 1,
        visibility: 'private' as const,
        privateType: 'team' as const,
      };
      setMovableProjects((current) => [newProject, ...current]);
      setMoveTargetProjectId(newProject.id);
    }
    setNewMoveProjectName('');
    setMoveProjectError('');
    setShowCreateMoveProjectPopover(false);
  };

  const handleConfirmMoveDocument = () => {
    if (!moveTargetProject) {
      setMoveProjectError('请选择要迁移到的项目');
      return;
    }
    setShowMoveDocumentModal(false);
    navigate(`/project/${moveTargetProject.id}`);
  };

  const closeDeleteConfirmModal = () => {
    setShowDeleteConfirmModal(false);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteConfirmModal(false);
    navigate(parentPath ?? '/projects');
  };

  // 新建文档可直接进入编辑状态；被分享者打开时始终只读。
  useEffect(() => {
    if (isSharedView) {
      setMode('view');
      return;
    }
    const requestedMode = (location.state as { mode?: 'view' | 'edit' } | null)?.mode;
    if (requestedMode) {
      setMode(requestedMode);
    }
  }, [isSharedView, location.state]);

  const handleSwitchMode = (nextMode: 'view' | 'edit') => {
    if (nextMode === mode) return;
    if (nextMode === 'view') {
      // 切换到浏览时，立即保存最后修改内容
      if (autoSaveTimerRef.current !== null) {
        window.clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      const snapshot = { title: docTitle, tags: docTags, content: docContent };
      const saved = savedContentRef.current;
      if (
        snapshot.title !== saved.title ||
        snapshot.content !== saved.content ||
        snapshot.tags.join('|') !== saved.tags.join('|')
      ) {
        persistDoc(snapshot);
      } else {
        setSaveHint('');
      }
    }
    setMode(nextMode);
  };

  useEffect(() => {
    return () => {
      if (contentScrollTimerRef.current !== null) {
        window.clearTimeout(contentScrollTimerRef.current);
      }
      if (autoSaveTimerRef.current !== null) {
        window.clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <header className="z-10 flex h-16 shrink-0 items-center justify-between bg-white/80 px-4 backdrop-blur-sm">
        <div className="flex min-w-0 items-center gap-3">
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="-ml-2 rounded-full p-2 text-secondaryText transition-colors hover:bg-bgLight"
              title="展开边栏"
            >
              <Menu size={20} />
            </button>
          )}
          {isSharedView ? (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1 text-sm text-tertiaryText transition-colors hover:text-primaryText"
            >
              <X size={16} />
              关闭分享
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate(parentPath ?? '/projects')}
              className="inline-flex items-center gap-1 text-sm text-tertiaryText transition-colors hover:text-primaryText"
            >
              <ArrowLeft size={16} />
              返回
            </button>
          )}
        </div>

        {!isSharedView && (
          <div className="flex items-center gap-2">
            <input
              ref={importInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleUploadAttachmentChange}
            />
            <div className="inline-flex items-center gap-1 rounded-lg bg-bgLight p-0.5">
              <button
                type="button"
                onClick={() => handleSwitchMode('view')}
                className={`rounded-md px-3 py-1 text-sm transition-colors ${
                  mode === 'view'
                    ? 'bg-white text-primaryText shadow-sm'
                    : 'text-secondaryText hover:text-primaryText'
                }`}
              >
                浏览
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode('edit')}
                className={`rounded-md px-3 py-1 text-sm transition-colors ${
                  mode === 'edit'
                    ? 'bg-white text-primaryText shadow-sm'
                    : 'text-secondaryText hover:text-primaryText'
                }`}
              >
                编辑
              </button>
            </div>
            {saveHint === 'saving' && (
              <span className="text-xs text-tertiaryText">保存中…</span>
            )}
            {saveHint === 'saved' && (
              <span className="text-xs text-tertiaryText">已保存</span>
            )}
            <button
              type="button"
              onClick={openDeleteConfirmModal}
              className="inline-flex rounded-md p-1.5 text-secondaryText transition-colors hover:bg-bgLight hover:text-primaryText"
              title="删除"
            >
              <Trash2 size={18} />
            </button>
            <BaseActionMenu
              open={showDocActionMenu}
              onOpenChange={setShowDocActionMenu}
              placement="bottom-end"
              width={140}
              trigger={
                <span className="inline-flex rounded-md p-1.5 text-secondaryText transition-colors hover:bg-bgLight hover:text-primaryText">
                  <MoreHorizontal size={20} />
                </span>
              }
              items={docActionMenuItems}
              onItemClick={handleDocActionMenuItemClick}
            />
          </div>
        )}
      </header>

      {isSharedView && (
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-line-subtle)] bg-[var(--color-primary-50,#fef9e6)] px-4 py-2.5 md:px-8 lg:px-10">
          <span className="text-sm text-secondaryText">你正在查看分享的文档</span>
          <BaseButton
            type={saveToLibraryDone ? 'secondary' : 'primary'}
            size="small"
            rounded="large"
            disabled={saveToLibraryDone}
            icon={saveToLibraryDone ? <Check size={16} /> : undefined}
            onClick={() => {
              setShowProjectPicker(false);
              setShowSaveToProjectModal(true);
            }}
          >
            {saveToLibraryDone ? '已保存成功' : '保存到我的项目'}
          </BaseButton>
        </div>
      )}

      <BaseModal
        show={showMoveDocumentModal}
        title="移动文档"
        okText="确定迁移"
        cancelText="取消"
        width={520}
        okButtonProps={{ disabled: !moveTargetProjectId }}
        onCancel={closeMoveDocumentModal}
        onClose={closeMoveDocumentModal}
        onConfirm={handleConfirmMoveDocument}
      >
        <div className="py-2">
          <div className="mb-4 flex items-center justify-between gap-3 text-sm">
            <span className="text-secondaryText">选择文档要迁移到的项目</span>
            <button
              type="button"
              onClick={() => {
                setNewMoveProjectName('');
                setMoveProjectError('');
                setShowCreateMoveProjectPopover(true);
              }}
              className="shrink-0 font-semibold text-primary transition-colors hover:text-[var(--color-primary-hover)]"
            >
              新建项目
            </button>
          </div>
          <div className="space-y-2">
            {movableProjects
              .filter((item) => item.id !== projectId)
              .map((item) => {
                const isSelected = moveTargetProjectId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setMoveTargetProjectId(item.id);
                      setMoveProjectError('');
                    }}
                    className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                      isSelected
                        ? 'border-primary bg-[var(--color-primary-soft)] font-semibold text-primary'
                        : 'border-[var(--color-line-subtle)] text-primaryText hover:bg-bgLight'
                    }`}
                  >
                    <span className="truncate">{item.name}</span>
                    {isSelected && <Check size={16} />}
                  </button>
                );
              })}
          </div>
          {showCreateMoveProjectPopover && (
            <div className="absolute top-[88px] right-5 z-10 w-[300px] rounded-xl border border-[#e6ecf2] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
                <div className="space-y-3">
                  <div>
                    <div className="mb-1.5 text-sm font-semibold text-primaryText">新建项目</div>
                    <BaseInput
                      autoFocus
                      value={newMoveProjectName}
                      placeholder="请输入项目名称"
                      error={Boolean(moveProjectError)}
                      onChange={(event) => {
                        setNewMoveProjectName(event.target.value);
                        setMoveProjectError('');
                      }}
                      size="medium"
                      containerClassName="!px-3"
                    />
                    {moveProjectError && <p className="mt-1.5 text-sm text-[var(--color-danger)]">{moveProjectError}</p>}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <BaseButton
                      type="secondary"
                      size="small"
                      onClick={() => {
                        setShowCreateMoveProjectPopover(false);
                        setMoveProjectError('');
                      }}
                    >
                      取消
                    </BaseButton>
                    <BaseButton
                      type="primary"
                      size="small"
                      onClick={handleCreateMoveProject}
                      disabled={!newMoveProjectName.trim()}
                    >
                      确认
                    </BaseButton>
                  </div>
                </div>
              </div>
            )}
        </div>
      </BaseModal>

      <BaseModal
        show={showSaveToProjectModal}
        title="保存到我的项目"
        okText="确认保存"
        cancelText="取消"
        okButtonProps={{ disabled: !targetProjectId }}
        onCancel={() => {
          setShowProjectPicker(false);
          setShowSaveToProjectModal(false);
        }}
        onClose={() => {
          setShowProjectPicker(false);
          setShowSaveToProjectModal(false);
        }}
        onConfirm={() => {
          setSaveToLibraryDone(true);
          setShowSaveToProjectModal(false);
        }}
      >
        <div className="py-2">
          <p className="mb-4 text-sm text-secondaryText">请选择文档要保存到的归属项目</p>
          <BaseActionMenu
            open={showProjectPicker}
            onOpenChange={setShowProjectPicker}
            placement="bottom-start"
            width={400}
            portal
            items={saveToProjectMenuItems}
            onItemClick={(item) => {
              setTargetProjectId(item.key);
              setShowProjectPicker(false);
            }}
            trigger={
              <span className="flex w-full items-center justify-between gap-3 rounded-lg border border-borderGray bg-white px-3 py-2.5 text-sm text-secondaryText transition-colors hover:bg-bgLight">
                <span className="min-w-0 truncate text-left">
                  {targetProject?.name ?? '请选择项目'}
                </span>
                <ChevronDown size={16} className="shrink-0" />
              </span>
            }
            className="!flex w-full"
            triggerClassName="w-full"
            listClassName="max-h-[220px] overflow-y-auto"
          />
        </div>
      </BaseModal>

      <div className="flex-1 min-h-0 overflow-hidden px-4 pb-8 pt-4 md:px-8 lg:px-10 md:pt-6">
        <div className="mx-auto flex h-full min-h-0 max-w-[1240px] flex-col">
          {!project || !experiment ? (
            <div className="w-full rounded-lg border border-dashed border-[var(--color-border-soft)]">
              <BaseEmpty description="实验不存在或已被删除" />
            </div>
          ) : (
            <>
              <section className="mb-4 shrink-0">
                {mode === 'edit' ? (
                  <input
                    value={docTitle}
                    onChange={(event) => handleDocTitleChange(event.target.value)}
                    placeholder="请输入文档标题"
                    className="w-full border-none bg-transparent text-2xl font-semibold text-primaryText outline-none placeholder:text-tertiaryText"
                  />
                ) : (
                  <h1 className="text-2xl font-semibold text-primaryText">
                    {docTitle || '未命名文档'}
                  </h1>
                )}

                {mode === 'view' && (
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-tertiaryText">
                      <span>创建人: {createdByName}</span>
                      <span>最近修改: {modifiedByName}</span>
                      <span>{activeTimeline?.updatedAt ?? experiment.updatedAt}</span>
                    </div>
                  </div>
                )}

                {mode === 'edit' ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {docTags.map((tag, index) =>
                      editingTagIndex === index ? (
                        <input
                          key={`edit-${index}`}
                          value={editingTagValue}
                          onChange={(event) => setEditingTagValue(event.target.value)}
                          onKeyDown={handleEditTagKeyDown}
                          onBlur={handleCommitEditTag}
                          autoFocus
                          className="min-w-[80px] rounded-full border border-[var(--color-line-subtle)] bg-bgLight px-2.5 py-1 text-xs text-primaryText outline-none"
                        />
                      ) : (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-full border border-[var(--color-line-subtle)] bg-bgLight px-2.5 py-1 text-xs text-secondaryText"
                        >
                          <button
                            type="button"
                            onClick={() => handleStartEditTag(index)}
                            className="transition-colors hover:text-primaryText"
                          >
                            {tag}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="text-tertiaryText transition-colors hover:text-danger"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ),
                    )}
                    {isAddingTag ? (
                      <input
                        ref={tagInputRef}
                        value={tagInput}
                        onChange={(event) => setTagInput(event.target.value)}
                        onKeyDown={handleAddTagKeyDown}
                        onBlur={handleCommitAddTag}
                        autoFocus
                        placeholder="输入标签后回车"
                        className="min-w-[100px] rounded-full border border-dashed border-[var(--color-line-subtle)] bg-bgLight px-2.5 py-1 text-xs text-primaryText outline-none placeholder:text-tertiaryText"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={handleStartAddTag}
                        className="inline-flex items-center gap-1 rounded-full border border-dashed border-[var(--color-line-subtle)] px-2.5 py-1 text-xs text-tertiaryText transition-colors hover:border-[var(--color-primary)] hover:text-primaryText"
                      >
                        <Plus size={12} />
                        {docTags.length === 0 ? '添加标签' : '继续添加'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {docTags.length > 0 ? (
                      docTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full border border-[var(--color-line-subtle)] bg-bgLight px-2.5 py-1 text-xs text-secondaryText"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-tertiaryText">暂无标签</span>
                    )}
                  </div>
                )}
                <div className="mt-4 h-px bg-[var(--color-line-subtle)]" />
              </section>

              <section
                onScroll={handleContentScroll}
                className={`min-h-0 flex-1 overflow-y-auto pr-1 auto-hide-scrollbar ${
                  isContentScrolling ? 'is-scrolling' : ''
                }`}
              >
                {mode === 'edit' ? (
                  <textarea
                    value={docContent}
                    onChange={(event) => handleDocContentChange(event.target.value)}
                    placeholder="请输入文档内容，支持 Markdown 语法"
                    className="h-full min-h-[400px] w-full resize-none border-none bg-transparent text-sm leading-7 text-primaryText outline-none placeholder:text-tertiaryText"
                  />
                ) : (
                  <div className="prose prose-slate max-w-none text-primaryText prose-p:my-3 prose-p:text-sm prose-p:leading-7 prose-li:text-sm prose-li:leading-7 prose-headings:text-primaryText prose-headings:tracking-[-0.01em] prose-h2:mt-4 prose-h2:mb-2 prose-h2:text-[16px] prose-h2:font-semibold prose-h3:mt-4 prose-h3:mb-2 prose-h3:text-base prose-h3:font-semibold prose-strong:text-primaryText prose-code:before:content-none prose-code:after:content-none prose-hr:my-5 prose-li:my-1 prose-li:marker:text-secondaryText prose-ol:pl-6 prose-ul:pl-6 prose-blockquote:border-l-2 prose-blockquote:border-[var(--color-line-subtle)] prose-blockquote:pl-3 prose-blockquote:text-secondaryText prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
                    {docContent.trim() ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {docContent}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-sm text-tertiaryText">暂无内容</p>
                    )}
                  </div>
                )}

                <div className="mt-8 border-t border-[var(--color-line-subtle)] pt-6">
                  <div className="text-sm font-medium text-primaryText">记录摘要</div>
                  <p className="mt-2 text-sm leading-6 text-secondaryText">
                    {activeTimeline?.summary}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-tertiaryText">
                    <span>更新人 {activeTimeline?.actor}</span>
                    <span>更新时间 {activeTimeline?.updatedAt}</span>
                  </div>
                </div>
              </section>

              <section className="shrink-0 border-t border-[var(--color-line-subtle)] pt-5 pb-2">
                <div className="text-sm font-medium text-primaryText">附件</div>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {(activeTimeline?.attachments ?? []).map((attachment) => (
                    <span
                      key={attachment}
                      className="inline-flex items-center rounded-full border border-[var(--color-line-subtle)] bg-white px-3 py-1.5 text-sm text-secondaryText"
                    >
                      {attachment}
                    </span>
                  ))}
                  {uploadedAttachments.filter((attachment) => attachment.progress < 100).map((attachment) => (
                    <span key={attachment.id} className="relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-[var(--color-line-subtle)] bg-white px-3 py-1.5 text-sm text-secondaryText">
                      <span className="max-w-[200px] truncate">{attachment.name}</span>
                      <span className="tabular-nums text-xs text-tertiaryText">{attachment.progress}%</span>
                      <span className="absolute inset-x-3 bottom-0 h-0.5 overflow-hidden rounded-full bg-[#edf0f3]"><span className="block h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-150" style={{ width: `${attachment.progress}%` }} /></span>
                    </span>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>

      <ShareModal
        visible={showShareModal}
        title="分享文档"
        shareUrl={`${window.location.origin}/project/${projectId}/experiment/${experimentId}?shared=true`}
        onClose={() => setShowShareModal(false)}
      />

      <BaseModal
        visible={showDeleteConfirmModal}
        title="删除文档"
        width={420}
        maskClosable={false}
        onCancel={closeDeleteConfirmModal}
        footer={(
          <div className="flex justify-end gap-2 border-t border-[var(--color-line-soft)] px-5 py-3">
            <BaseButton type="secondary" size="medium" onClick={closeDeleteConfirmModal}>
              取消
            </BaseButton>
            <BaseButton type="danger" size="medium" onClick={handleDeleteConfirm}>
              删除
            </BaseButton>
          </div>
        )}
      >
        <div className="text-sm leading-6 text-secondaryText">
          删除文档后将不可回复，确认删除当前文档吗？
        </div>
      </BaseModal>
    </div>
  );
}