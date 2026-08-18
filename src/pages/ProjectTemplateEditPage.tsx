import React, { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLocation, useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { ArrowLeft, Menu } from 'lucide-react';
import { BaseButton, BaseModal } from '../components';
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

  const isNew = id === 'new';
  const matchedTemplate = !isNew ? DEFAULT_TEMPLATES.find((tpl) => tpl.id === id) : undefined;
  const initialTitle = isNew ? '' : (matchedTemplate?.name ?? `模版 ${id}`);
  const initialContent = isNew ? '' : (matchedTemplate?.body ?? DEFAULT_MARKDOWN);
  const initialMode = (location.state as { mode?: 'edit' | 'preview' } | null)?.mode;
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [mode, setMode] = useState<'edit' | 'preview'>(isNew ? 'edit' : (initialMode ?? 'preview'));
  const [error, setError] = useState('');
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const titleBeforeEditRef = useRef(initialTitle);
  const contentBeforeEditRef = useRef(initialContent);

  const goBackToProjects = () => {
    navigate('/projects', { replace: true, state: { reopenTemplateModal: true } });
  };

  const handleSave = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError('请输入模版标题');
      return;
    }
    // TODO: 对接后端保存接口
    if (isNew) {
      goBackToProjects();
      return;
    }
    titleBeforeEditRef.current = title;
    contentBeforeEditRef.current = content;
    setError('');
    setMode('preview');
  };

  const handleEnterEdit = () => {
    titleBeforeEditRef.current = title;
    contentBeforeEditRef.current = content;
    setMode('edit');
  };

  const handleCancelEdit = () => {
    if (isNew) {
      goBackToProjects();
      return;
    }
    setTitle(titleBeforeEditRef.current);
    setContent(contentBeforeEditRef.current);
    setError('');
    setMode('preview');
  };

  const handleDeleteConfirm = () => {
    // TODO: 对接后端删除接口
    setShowDeleteConfirmModal(false);
    goBackToProjects();
  };

  const handleImportClick = () => {
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
        setTitle(file.name.replace(/\.[^.]+$/, ''));
        if (error) setError('');
      }
    };
    reader.readAsText(file);

    // 允许重复导入同一个文件
    event.target.value = '';
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
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <input
            ref={importInputRef}
            type="file"
            accept=".md,.txt,.markdown"
            className="hidden"
            onChange={handleImportFileChange}
          />
          {mode === 'preview' ? (
            <>
              {!isNew && (
                <BaseButton
                  type="secondary"
                  size="small"
                  rounded="large"
                  onClick={() => setShowDeleteConfirmModal(true)}
                >
                  删除
                </BaseButton>
              )}
              <BaseButton
                type="primary"
                size="small"
                rounded="large"
                onClick={handleEnterEdit}
              >
                编辑
              </BaseButton>
            </>
          ) : (
            <>
              <BaseButton
                type="secondary"
                size="small"
                rounded="large"
                onClick={handleCancelEdit}
              >
                取消
              </BaseButton>
              <BaseButton
                type="secondary"
                size="small"
                rounded="large"
                onClick={handleImportClick}
              >
                导入
              </BaseButton>
              <BaseButton
                type="primary"
                size="small"
                rounded="large"
                onClick={handleSave}
              >
                保存
              </BaseButton>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden px-4 pb-8 pt-4 md:px-8 lg:px-10 md:pt-6">
        <div className="mx-auto flex h-full min-h-0 max-w-[840px] flex-col">
          {/* 标题区，参照文档详情页样式 */}
          <section className="mb-4 shrink-0">
            {mode === 'edit' ? (
              <input
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (error) setError('');
                }}
                placeholder="请输入模版标题"
                className="w-full border-none bg-transparent text-2xl font-semibold text-primaryText outline-none placeholder:text-tertiaryText"
              />
            ) : (
              <h1 className="text-2xl font-semibold text-primaryText">{title || '未命名模版'}</h1>
            )}

            {error && <div className="mt-1 text-sm text-[var(--color-danger)]">{error}</div>}

            <div className="mt-4 h-px bg-[var(--color-line-subtle)]" />
          </section>

          {/* 内容区：编辑 / 预览 */}
          <section className="min-h-0 flex-1 overflow-y-auto pr-1 auto-hide-scrollbar">
            {mode === 'edit' ? (
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
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
