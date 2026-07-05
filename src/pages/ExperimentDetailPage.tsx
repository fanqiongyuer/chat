import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import {
  CheckCircle2,
  FlaskConical,
  LineChart,
  Menu,
  Pencil,
  Plus,
  Upload,
} from 'lucide-react';
import { BaseButton, BaseEmpty } from '@/components';
import {
  EXPERIMENT_DETAILS_BY_PROJECT,
  PROJECT_MEMBERS,
  findProjectExperimentDetail,
  mockProjects,
  type ExperimentTimelineEntry,
  type ExperimentTimelineStatus,
} from '../mock/projects';
import { type LayoutOutletContext } from '../components/Layout';

const getTimelineStatusMeta = (status: ExperimentTimelineStatus) => {
  switch (status) {
    case '创建试验方案':
      return {
        icon: <Plus size={10} strokeWidth={2.4} />,
        className: 'border-[var(--color-primary)] bg-[rgba(255,214,0,0.16)] text-[var(--color-primary)]',
      };
    case '修改试验方案':
      return {
        icon: <Pencil size={10} strokeWidth={2.2} />,
        className: 'border-violet-200 bg-violet-50 text-violet-600',
      };
    case '干试验模拟':
      return {
        icon: <LineChart size={10} strokeWidth={2.2} />,
        className: 'border-indigo-200 bg-indigo-50 text-indigo-600',
      };
    case '湿试验记录':
      return {
        icon: <FlaskConical size={10} strokeWidth={2.2} />,
        className: 'border-cyan-200 bg-cyan-50 text-cyan-600',
      };
    case '实验结束':
      return {
        icon: <CheckCircle2 size={10} strokeWidth={2.2} />,
        className: 'border-emerald-200 bg-emerald-50 text-emerald-600',
      };
    default:
      return {
        icon: <FlaskConical size={10} strokeWidth={2.2} />,
        className: 'border-[var(--color-line-subtle)] bg-white text-secondaryText',
      };
  }
};

const getDefaultTimelineEntry = (timeline: ExperimentTimelineEntry[]) =>
  timeline.find((entry) => entry.status !== '实验结束') ?? timeline[0] ?? null;

export default function ExperimentDetailPage() {
  const navigate = useNavigate();
  const { projectId, experimentId } = useParams<{
    projectId: string;
    experimentId: string;
  }>();
  const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<LayoutOutletContext>();
  const [selectedTimelineId, setSelectedTimelineId] = useState<string | null>(null);
  const [isTimelineScrolling, setIsTimelineScrolling] = useState(false);
  const [isContentScrolling, setIsContentScrolling] = useState(false);
  const timelineScrollTimerRef = useRef<number | null>(null);
  const contentScrollTimerRef = useRef<number | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    const defaultTimeline = experiment ? getDefaultTimelineEntry(experiment.timeline) : null;
    setSelectedTimelineId(defaultTimeline?.id ?? null);
  }, [experiment]);

  const activeTimeline = useMemo(() => {
    if (!experiment) return null;
    return (
      experiment.timeline.find((entry) => entry.id === selectedTimelineId) ??
      getDefaultTimelineEntry(experiment.timeline)
    );
  }, [experiment, selectedTimelineId]);

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

  const handleTimelineScroll = () => {
    setIsTimelineScrolling(true);
    if (timelineScrollTimerRef.current !== null) {
      window.clearTimeout(timelineScrollTimerRef.current);
    }
    timelineScrollTimerRef.current = window.setTimeout(() => {
      setIsTimelineScrolling(false);
    }, 700);
  };

  const handleContentScroll = () => {
    setIsContentScrolling(true);
    if (contentScrollTimerRef.current !== null) {
      window.clearTimeout(contentScrollTimerRef.current);
    }
    contentScrollTimerRef.current = window.setTimeout(() => {
      setIsContentScrolling(false);
    }, 700);
  };

  useEffect(() => {
    return () => {
      if (timelineScrollTimerRef.current !== null) {
        window.clearTimeout(timelineScrollTimerRef.current);
      }
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

        <>
          <BaseButton
            type="primary"
            size="small"
            rounded="large"
            icon={<Upload size={14} strokeWidth={1.8} />}
            onClick={() => importInputRef.current?.click()}
          >
            导入文件
          </BaseButton>
          <input
            ref={importInputRef}
            type="file"
            className="hidden"
            onChange={(event) => {
              // Placeholder for future import handling.
              event.currentTarget.value = '';
            }}
          />
        </>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden px-4 pb-8 pt-4 md:px-8 lg:px-10 md:pt-6">
        <div className="mx-auto flex h-full min-h-0 max-w-[1240px] flex-col">
          {!project || !experiment ? (
            <div className="w-full rounded-lg border border-dashed border-[var(--color-border-soft)]">
              <BaseEmpty description="实验不存在或已被删除" />
            </div>
          ) : (
            <>
              <section className="mb-6 shrink-0">
                <h1 className="text-2xl font-semibold text-primaryText">{experiment.title}</h1>
                <p className="mt-1 text-sm leading-6 text-tertiaryText">
                  {experiment.subtitle}
                </p>
                <div className="mt-4 border-t border-[var(--color-line-subtle)]" />
              </section>

              <div className="flex min-h-0 flex-1 gap-10">
                <aside className="hidden order-2 w-[280px] shrink-0 lg:flex lg:flex-col lg:min-h-0">
                  <div
                    onScroll={handleTimelineScroll}
                    className={`min-h-0 flex-1 overflow-y-auto pb-6 auto-hide-scrollbar ${
                      isTimelineScrolling ? 'is-scrolling' : ''
                    }`}
                  >
                    <div className="space-y-1.5">
                    {experiment.timeline.map((entry, index) => {
                      const isActive = activeTimeline?.id === entry.id;
                      const statusMeta = getTimelineStatusMeta(entry.status);
                      const showConnector = index < experiment.timeline.length - 1;

                      return (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => setSelectedTimelineId(entry.id)}
                          className={`block w-full rounded-2xl px-3 py-2 text-left transition-colors ${
                            isActive ? 'bg-[#f5f5f5]' : 'hover:bg-[#fafafa]'
                          }`}
                        >
                          <div className="relative flex gap-3">
                            <div className="relative flex w-4 shrink-0 justify-center">
                              {showConnector && (
                                <span className="absolute left-1/2 top-5 bottom-[-14px] w-px -translate-x-1/2 bg-[var(--color-line-subtle)]" />
                              )}
                              <span
                                className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border ${statusMeta.className}`}
                              >
                                {statusMeta.icon}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pb-3">
                              <div className="text-sm font-medium text-primaryText">
                                {entry.date}
                              </div>
                              <div
                                className={`mt-1 line-clamp-2 text-sm leading-5 ${
                                  isActive ? 'text-primaryText' : 'text-secondaryText'
                                }`}
                              >
                                {entry.summary}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                </div>
                </aside>

                <section className="order-1 min-w-0 flex-1 min-h-0">
                  <div className="max-w-[860px] h-full min-h-0">
                  <div
                    onScroll={handleContentScroll}
                    className={`h-full min-h-0 rounded-2xl border border-[var(--color-line-subtle)] bg-[rgba(250,251,252,0.55)] px-4 pb-4 pt-0 md:px-5 md:pb-5 md:pt-0 overflow-y-auto auto-hide-scrollbar ${
                      isContentScrolling ? 'is-scrolling' : ''
                    }`}
                  >
                    <div className="sticky top-0 z-20 -mx-4 bg-[rgba(250,251,252,1)] px-4 pt-4 md:-mx-5 md:px-5 md:pt-5">
                      <h2 className="text-[18px] font-semibold leading-7 text-primaryText">
                        {activeTimeline?.detailTitle ?? experiment.title}
                      </h2>
                      <div className="mt-2 flex items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-tertiaryText">
                          <span>创建人: {createdByName}</span>
                          <span>最近修改: {modifiedByName}</span>
                          <span>{activeTimeline?.updatedAt ?? experiment.updatedAt}</span>
                        </div>
                        <button
                          type="button"
                          className="shrink-0 text-sm font-medium text-primaryText transition-colors hover:text-primaryText/80"
                        >
                          编辑
                        </button>
                      </div>
                      <div className="mt-4 border-t border-[var(--color-line-subtle)]" />
                    </div>
                    {activeTimeline?.markdownContent ? (
                      <div className="mt-4">
                        <div className="prose prose-slate max-w-none text-primaryText prose-p:my-3 prose-p:text-sm prose-p:leading-7 prose-li:text-sm prose-li:leading-7 prose-headings:text-primaryText prose-headings:tracking-[-0.01em] prose-h2:mt-4 prose-h2:mb-2 prose-h2:text-[16px] prose-h2:font-semibold prose-h3:mt-4 prose-h3:mb-2 prose-h3:text-base prose-h3:font-semibold prose-strong:text-primaryText prose-code:before:content-none prose-code:after:content-none prose-hr:my-5 prose-li:my-1 prose-li:marker:text-secondaryText prose-ol:pl-6 prose-ul:pl-6 prose-blockquote:border-l-2 prose-blockquote:border-[var(--color-line-subtle)] prose-blockquote:pl-3 prose-blockquote:text-secondaryText prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {activeTimeline.markdownContent}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="mt-3 max-w-[760px] text-sm leading-7 text-secondaryText">
                          {activeTimeline?.detailDescription ?? experiment.summary}
                        </p>

                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                          {(activeTimeline?.detailSections ?? []).map((section) => (
                            <article
                              key={section.title}
                              className="rounded-2xl border border-[var(--color-line-subtle)] bg-white/90 p-4"
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

                    <div className="mt-8 rounded-2xl bg-[#fafafa] px-4 py-4 mb-6">
                      <div className="text-sm font-medium text-primaryText">记录摘要</div>
                      <p className="mt-2 text-sm leading-6 text-secondaryText">
                        {activeTimeline?.summary}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-tertiaryText">
                        <span className="rounded-full bg-white px-2.5 py-1">
                          更新人 {activeTimeline?.actor}
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-1">
                          更新时间 {activeTimeline?.updatedAt}
                        </span>
                      </div>
                    </div>

                    <div className="mt-8 border-t border-[var(--color-line-subtle)] pt-6">
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
                  </div>

                </div>
                </section>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
