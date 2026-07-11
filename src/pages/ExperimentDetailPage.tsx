import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { BaseButton, BaseEmpty, BaseModal } from '../components';
import {
  EXPERIMENT_DETAILS_BY_PROJECT,
  PROJECT_MEMBERS,
  findProjectExperimentDetail,
  mockProjects,
  type ExperimentTimelineEntry,
} from '../mock/projects';
import { type LayoutOutletContext } from '../components/Layout';

const getDefaultTimelineEntry = (timeline: ExperimentTimelineEntry[]) =>
  timeline.find((entry) => entry.status !== '实验结束') ?? timeline[0] ?? null;

export default function ExperimentDetailPage() {
  const navigate = useNavigate();
  const { projectId, experimentId } = useParams<{
    projectId: string;
    experimentId: string;
  }>();
  const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<LayoutOutletContext>();
  const [isContentScrolling, setIsContentScrolling] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const contentScrollTimerRef = useRef<number | null>(null);

  const project = useMemo(
    () => mockProjects.find((item) => item.id === projectId),
    [projectId],
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

  const closeDeleteConfirmModal = () => {
    setShowDeleteConfirmModal(false);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteConfirmModal(false);
    navigate(parentPath ?? '/projects');
  };

  useEffect(() => {
    return () => {
      if (contentScrollTimerRef.current !== null) {
        window.clearTimeout(contentScrollTimerRef.current);
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
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="text-tertiaryText transition-colors hover:text-primaryText"
            >
              项目
            </button>
            <span className="text-tertiaryText">/</span>
            <button
              type="button"
              onClick={() => parentPath && navigate(parentPath)}
              disabled={!parentPath}
              className={`transition-colors ${
                parentPath
                  ? 'text-tertiaryText hover:text-primaryText'
                  : 'cursor-not-allowed text-tertiaryText/60'
              }`}
            >
              {project?.name ?? '实验详情'}
            </button>
            <span className="text-tertiaryText">/</span>
            <span className="font-medium text-primaryText">{experiment?.title ?? '实验详情'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <BaseButton
            type="secondary"
            size="small"
            rounded="large"
            onClick={openDeleteConfirmModal}
          >
            删除
          </BaseButton>
          <BaseButton type="primary" size="small" rounded="large">
            编辑
          </BaseButton>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden px-4 pb-8 pt-4 md:px-8 lg:px-10 md:pt-6">
        <div className="mx-auto flex h-full min-h-0 max-w-[1240px] flex-col">
          {!project || !experiment ? (
            <div className="w-full rounded-lg border border-dashed border-[var(--color-border-soft)]">
              <BaseEmpty description="实验不存在或已被删除" />
            </div>
          ) : (
            <>
              <section className="mb-4 shrink-0">
                <h1 className="text-2xl font-semibold text-primaryText">
                  {activeTimeline?.detailTitle ?? experiment.title}
                </h1>
                <div className="mt-3 flex items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-tertiaryText">
                    <span>创建人: {createdByName}</span>
                    <span>最近修改: {modifiedByName}</span>
                    <span>{activeTimeline?.updatedAt ?? experiment.updatedAt}</span>
                  </div>
                </div>
                <div className="mt-4 h-px bg-[var(--color-line-subtle)]" />
              </section>

              <section
                onScroll={handleContentScroll}
                className={`min-h-0 flex-1 overflow-y-auto pr-1 auto-hide-scrollbar ${
                  isContentScrolling ? 'is-scrolling' : ''
                }`}
              >
                {activeTimeline?.markdownContent ? (
                  <div className="prose prose-slate max-w-none text-primaryText prose-p:my-3 prose-p:text-sm prose-p:leading-7 prose-li:text-sm prose-li:leading-7 prose-headings:text-primaryText prose-headings:tracking-[-0.01em] prose-h2:mt-4 prose-h2:mb-2 prose-h2:text-[16px] prose-h2:font-semibold prose-h3:mt-4 prose-h3:mb-2 prose-h3:text-base prose-h3:font-semibold prose-strong:text-primaryText prose-code:before:content-none prose-code:after:content-none prose-hr:my-5 prose-li:my-1 prose-li:marker:text-secondaryText prose-ol:pl-6 prose-ul:pl-6 prose-blockquote:border-l-2 prose-blockquote:border-[var(--color-line-subtle)] prose-blockquote:pl-3 prose-blockquote:text-secondaryText prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {activeTimeline.markdownContent}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <>
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      {(activeTimeline?.detailSections ?? []).map((section) => (
                        <article
                          key={section.title}
                          className="rounded-xl border border-[var(--color-line-subtle)] bg-white p-4"
                        >
                          <div className="text-sm font-medium text-primaryText">
                            {section.title}
                          </div>
                          <p className="mt-2 text-sm leading-6 text-secondaryText">
                            {section.content}
                          </p>
                        </article>
                      ))}
                    </div>
                  </>
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

                <div className="mt-8 border-t border-[var(--color-line-subtle)] pt-6 pb-6">
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
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>

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