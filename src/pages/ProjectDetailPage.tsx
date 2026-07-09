import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { Menu, Plus, Search, Users } from 'lucide-react';
import { BaseButton, BaseEmpty } from '../components';
import { EXPERIMENTS_BY_PROJECT, PROJECT_MEMBERS, mockProjects } from '../mock/projects';
import { type LayoutOutletContext } from '../components/Layout';

type DetailTab = 'experiment' | 'chat';

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

export default function ProjectDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isSidebarOpen, setIsSidebarOpen, chats } = useOutletContext<LayoutOutletContext>();

  const [activeTab, setActiveTab] = useState<DetailTab>('experiment');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [isTagExpanded, setIsTagExpanded] = useState(false);
  const [showTagToggle, setShowTagToggle] = useState(false);
  const tagFilterRef = useRef<HTMLDivElement | null>(null);

  const project = useMemo(() => mockProjects.find((item) => item.id === id), [id]);

  const projectMembers = useMemo(() => {
    if (!id) return [];
    return PROJECT_MEMBERS[id] ?? [];
  }, [id]);

  const experimentList = useMemo(() => {
    if (!id) return [];
    return EXPERIMENTS_BY_PROJECT[id] ?? [];
  }, [id]);

  const documentTagOptions = useMemo(() => {
    const uniqueTags = Array.from(new Set(experimentList.flatMap((item) => item.tags)));
    return ['all', ...uniqueTags];
  }, [experimentList]);

  const documentList = useMemo(() => {
    if (activeTab !== 'experiment') {
      return experimentList;
    }

    const keyword = searchKeyword.trim().toLowerCase();

    return experimentList.filter((item) => {
      if (selectedTag !== 'all' && !item.tags.includes(selectedTag)) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const searchableText = [item.title, item.summary, ...item.tags].join(' ').toLowerCase();
      return searchableText.includes(keyword);
    });
  }, [activeTab, experimentList, searchKeyword, selectedTag]);

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

  const memberCount = projectMembers.length;

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
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="text-tertiaryText transition-colors hover:text-primaryText"
            >
              项目
            </button>
            <span className="text-tertiaryText">/</span>
            <span className="font-medium text-primaryText">{project?.name ?? '详情'}</span>
          </div>
        </div>

        {project && (
          <div className="flex items-center gap-2">
            <BaseButton
              type="secondary"
              size="small"
              rounded="large"
              onClick={() => navigate('/members')}
            >
              管理成员
            </BaseButton>
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
              <h2 className="text-2xl font-semibold text-primaryText">{project.name}</h2>
              <p className="mt-1 text-sm text-tertiaryText">
                项目的描述，您可查看私有项目的对话，并编辑里面的知识内容
              </p>

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
                    文档 {experimentList.length}
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

                <BaseButton
                  type="ghost"
                  size="small"
                  rounded="large"
                  icon={<Plus size={16} />}
                  className="!h-auto !border-transparent !bg-transparent !px-0 !py-0 !text-sm !font-semibold !text-[var(--color-primary)] hover:!bg-transparent hover:!text-[var(--color-primary-hover)]"
                >
                  {activeTab === 'experiment' ? '新建文档' : '发起对话'}
                </BaseButton>
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
                        className="rounded-lg border border-[var(--color-line-subtle)] bg-[var(--color-surface)] px-4 py-3.5 text-left transition-all hover:border-[var(--color-gray-3)] hover:shadow-sm"
                      >
                        <h3 className="truncate text-base font-medium text-primaryText">{item.title}</h3>
                        <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-secondaryText">
                          {item.summary}
                        </p>
                        {item.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
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
                    <button
                      key={chat.id}
                      type="button"
                      onClick={() => navigate(`/chat/${chat.id}`)}
                      className="w-full rounded-lg border border-[var(--color-line-subtle)] bg-[var(--color-surface)] px-4 py-3 text-left transition-all hover:border-[var(--color-gray-3)] hover:shadow-sm"
                    >
                      <div className="truncate text-sm font-medium text-primaryText">{chat.title}</div>
                      <div className="mt-1 text-xs text-tertiaryText">
                        {formatChatDateTime(chat.date, chat.id)}
                      </div>
                    </button>
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
    </div>
  );
}