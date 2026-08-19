import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLocation, useNavigate, useParams, useOutletContext, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Menu, MoreHorizontal, Trash2, X } from 'lucide-react';
import { BaseActionMenu, BaseButton, BaseModal, ShareModal } from '../components';
import type { BaseActionMenuItem, BaseActionMenuProps } from '../components';
import { type LayoutOutletContext } from '../components/Layout';
import { DEFAULT_TEMPLATES } from './ProjectsPage';

const DEFAULT_MARKDOWN = `## 项目简介

请输入项目模版的详细内容，支持 Markdown 语法。

## 目标与范围

- 明确项目目标
- 界定项目范围

## 关键里程碑

1. 启动与调研
2. 方案设计
3. 执行与交付
`;

export default function ProjectTemplateEditPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<LayoutOutletContext>();
  const [searchParams] = useSearchParams();
  const isSharedView = searchParams.get('shared') === 'true';
  const [saveToLibraryDone, setSaveToLibraryDone] = useState(false);

  const isNew = id === 'new';
  const matchedTemplate = !isNew ? DEFAULT_TEMPLATES.find((tpl) => tpl.id === id) : undefined;
  const routeState = location.state as { mode?: 'edit' | 'preview'; initialTitle?: string; initialContent?: string } | null;
  const initialTitle = isNew
    ? (routeState?.initialTitle ?? '')
    : (matchedTemplate?.name ?? `模版 ${id}`);
  const initialContent = isNew
    ? (routeState?.initialContent ?? '')
    : (matchedTemplate?.body ?? DEFAULT_MARKDOWN);
  const initialMode = routeState?.mode;
  const creatorName = matchedTemplate?.creator ?? (isNew ? '当前用户' : '未知');
  const modifierName = matchedTemplate?.modifier ?? creatorName;
  const updatedAtText = matchedTemplate?.updatedAt ?? '';
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [mode, setMode] = useState<'preview' | 'edit'>(isNew ? 'edit' : (initialMode ?? 'preview'));
  const [error, setError] = useState('');
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [saveHint, setSaveHint] = useState<'' | 'saving' | 'saved'>('');
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const autoSaveTimerRef = useRef<number | null>(null);
  const savedSnapshotRef = useRef({ title: initialTitle, content: initialContent });

  const persistTemplate = useCallback(
    (next: { title: string; content: string }) => {
      // TODO: 对接后端保存接口
      savedSnapshotRef.current = next;
      if (matchedTemplate) {
        matchedTemplate.name = next.title;
        matchedTemplate.body = next.content;
      }
      setSaveHint('saved');
      window.setTimeout(() => setSaveHint(''), 1500);
    },
    [matchedTemplate],
  );

  const scheduleAutoSave = useCallback(
    (next: { title: string; content: string }) => {
      setSaveHint('saving');
      if (autoSaveTimerRef.current !== null) {
        window.clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = window.setTimeout(() => {
        persistTemplate(next);
      }, 800);
    },
    [persistTemplate],
  );

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (error) setError('');
    scheduleAutoSave({ title: value, content });
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    scheduleAutoSave({ title, content: value });
  };

  const goBackToProjects = () => {
    navigate('/projects', { replace: true, state: { reopenTemplateModal: true } });
  };

  // 被分享者打开时强制只读模式
  useEffect(() => {
    if (isSharedView) {
      setMode('preview');
    }
  }, [isSharedView]);

  const handleSwitchMode = (nextMode: 'preview' | 'edit') => {
    if (nextMode === mode) return;
    if (nextMode === 'preview') {
      const trimmed = title.trim();
      if (!trimmed) {
        setError('请输入模版标题');
        return;
      }
      // 切换到浏览时，立即保存最后修改内容
      if (autoSaveTimerRef.current !== null) {
        window.clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      const snapshot = { title, content };
      const saved = savedSnapshotRef.current;
      if (snapshot.title !== saved.title || snapshot.content !== saved.content) {
        persistTemplate(snapshot);
      } else {
        setSaveHint('');
      }
    }
    setMode(nextMode);
  };

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current !== null) {
        window.clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const handleDeleteConfirm = () => {
    // TODO: 对接后端删除接口
    setShowDeleteConfirmModal(false);
    goBackToProjects();
  };

  const handleImportClick = () => {
    setShowActionMenu(false);
    setMode('edit');
    importInputRef.current?.click();
  };

  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      setContent(text);
      if (!title.trim()) {
        const derivedTitle = file.name.replace(/\.[^.]+$/, '');
        setTitle(derivedTitle);
        if (error) setError('');
        scheduleAutoSave({ title: derivedTitle, content: text });
      } else {
        scheduleAutoSave({ title, content: text });
      }
    };
    reader.readAsText(file);

    // 允许重复导入同一个文件
    event.target.value = '';
  };

  const handleShareClick = () => {
    setShowActionMenu(false);
    setShowShareModal(true);
  };

  const actionMenuItems: BaseActionMenuItem[] = [
    { key: 'import', label: '导入' },
    { key: 'share', label: '分享模版' },
  ];

  const handleActionMenuItemClick: BaseActionMenuProps['onItemClick'] = (item) => {
    if (item.key === 'import') {
      handleImportClick();
    } else if (item.key === 'share') {
      handleShareClick();
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <header className="z-10 flex h-16 shrink-0 items-center justify-between bg-white/80 px-4 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          {!isSidebarOpen && (
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-secondaryText hover:bg-bgLight rounded-full transition-colors" title="展开边栏">
              <Menu size={20} />
            </button>
          )}
          <button
            type="button"
            onClick={goBackToProjects}
            className="p-1.5 -ml-1 text-secondaryText hover:bg-bgLight rounded-full transition-colors"
            title="返回"
          >
            <ArrowLeft size={18} />
          </button>
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
            <div className="flex items-center gap-2 text-sm">
              <button
                type="button"
                onClick={goBackToProjects}
                className="text-tertiaryText transition-colors hover:text-primaryText"
              >
                项目模版
              </button>
              <span className="text-tertiaryText">/</span>
              <span className="font-medium text-primaryText">模版详情</span>
            </div>
          )}
        </div>

        {!isSharedView && (
          <div className="flex items-center gap-2 shrink-0">
            <input
              ref={importInputRef}
              type="file"
              accept=".md,.txt,.markdown"
              className="hidden"
              onChange={handleImportFileChange}
            />
            <div className="inline-flex items-center gap-1 rounded-lg bg-bgLight p-0.5">
              <button
                type="button"
                onClick={() => handleSwitchMode('preview')}
                className={`rounded-md px-3 py-1 text-sm transition-colors ${
                  mode === 'preview'
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
            {!isNew && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(true)}
                className="inline-flex rounded-md p-1.5 text-secondaryText transition-colors hover:bg-bgLight hover:text-primaryText"
                title="删除"
              >
                <Trash2 size={18} />
              </button>
            )}
            <BaseActionMenu
              open={showActionMenu}
              onOpenChange={setShowActionMenu}
              placement="bottom-end"
              width={120}
              trigger={
                <span className="inline-flex rounded-md p-1.5 text-secondaryText transition-colors hover:bg-bgLight hover:text-primaryText">
                  <MoreHorizontal size={20} />
                </span>
              }
              items={actionMenuItems}
              onItemClick={handleActionMenuItemClick}
            />
          </div>
        )}
      </header>

      {isSharedView && (
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-line-subtle)] bg-[var(--color-primary-50,#fef9e6)] px-4 py-2.5 md:px-8 lg:px-10">
          <span className="text-sm text-secondaryText">你正在查看分享的模版</span>
          <BaseButton
            type={saveToLibraryDone ? 'secondary' : 'primary'}
            size="small"
            rounded="large"
            disabled={saveToLibraryDone}
            icon={saveToLibraryDone ? <Check size={16} /> : undefined}
            onClick={() => setSaveToLibraryDone(true)}
          >
            {saveToLibraryDone ? '已保存成功' : '保存到我的模版库'}
          </BaseButton>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-hidden px-4 pb-8 pt-4 md:px-8 lg:px-10 md:pt-6">
        <div className="mx-auto flex h-full min-h-0 max-w-[840px] flex-col">
            {/* 标题区，参照文档详情页样式 */}
            <section className="mb-4 shrink-0">
              {mode === 'edit' ? (
                <input
                  value={title}
                  onChange={(event) => handleTitleChange(event.target.value)}
                  placeholder="请输入模版标题"
                  className="w-full border-none bg-transparent text-2xl font-semibold text-primaryText outline-none placeholder:text-tertiaryText"
                />
              ) : (
                <h1 className="text-2xl font-semibold text-primaryText">{title || '未命名模版'}</h1>
              )}

              {error && <div className="mt-1 text-sm text-[var(--color-danger)]">{error}</div>}

            {mode === 'preview' && (creatorName || updatedAtText) && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-tertiaryText">
                {creatorName && <span>创建人: {creatorName}</span>}
                {modifierName && <span>最近修改: {modifierName}</span>}
                {updatedAtText && <span>{updatedAtText}</span>}
              </div>
            )}

            <div className="mt-4 h-px bg-[var(--color-line-subtle)]" />
          </section>

          {/* 内容区：编辑 / 预览 */}
          <section className="min-h-0 flex-1 overflow-y-auto pr-1 auto-hide-scrollbar">
            {mode === 'edit' ? (
              <textarea
                value={content}
                onChange={(event) => handleContentChange(event.target.value)}
                placeholder="请输入模版内容，支持 Markdown 语法"
                className="h-full min-h-[400px] w-full resize-none border-none bg-transparent text-sm leading-7 text-primaryText outline-none placeholder:text-tertiaryText"
              />
            ) : (
              <div className="prose prose-slate max-w-none pb-8 text-primaryText prose-p:my-3 prose-p:text-sm prose-p:leading-7 prose-li:text-sm prose-li:leading-7 prose-headings:text-primaryText prose-headings:tracking-[-0.01em] prose-h2:mt-4 prose-h2:mb-2 prose-h2:text-[16px] prose-h2:font-semibold prose-h3:mt-4 prose-h3:mb-2 prose-h3:text-base prose-h3:font-semibold prose-strong:text-primaryText prose-code:before:content-none prose-code:after:content-none prose-hr:my-5 prose-li:my-1 prose-li:marker:text-secondaryText prose-ol:pl-6 prose-ul:pl-6 prose-blockquote:border-l-2 prose-blockquote:border-[var(--color-line-subtle)] prose-blockquote:pl-3 prose-blockquote:text-secondaryText prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
                {content.trim() ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                ) : (
                  <p className="text-sm text-tertiaryText">暂无内容</p>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      <ShareModal
        visible={showShareModal}
        title="分享模版"
        shareUrl={`${window.location.origin}/project-templates/${id}?shared=true`}
        onClose={() => setShowShareModal(false)}
      />

      <BaseModal
        visible={showDeleteConfirmModal}
        title="删除模版"
        width={420}
        maskClosable={false}
        onCancel={() => setShowDeleteConfirmModal(false)}
        footer={(
          <div className="flex justify-end gap-2 border-t border-[var(--color-line-soft)] px-5 py-3">
            <BaseButton type="secondary" size="medium" onClick={() => setShowDeleteConfirmModal(false)}>
              取消
            </BaseButton>
            <BaseButton type="danger" size="medium" onClick={handleDeleteConfirm}>
              确认删除
            </BaseButton>
          </div>
        )}
      >
        <div className="text-sm leading-6 text-secondaryText">
          确定删除模版「{title || '未命名模版'}」吗？删除后不可恢复。
        </div>
      </BaseModal>
    </div>
  );
}
