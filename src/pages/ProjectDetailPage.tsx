import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ChevronLeft, Menu, Plus, Users } from 'lucide-react';
import { BaseButton, BaseEmpty, BaseSelect } from '@/components';
import {
  EXPERIMENTS_BY_PROJECT,
  KNOWLEDGE_BY_PROJECT,
  PROJECT_MEMBERS,
  mockProjects,
} from '../mock/projects';
import { type LayoutOutletContext } from '../components/Layout';

type DetailTab = 'experiment' | 'knowledge';

export default function ProjectDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<LayoutOutletContext>();

  const [activeTab, setActiveTab] = useState<DetailTab>('experiment');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');

  const project = useMemo(() => mockProjects.find((item) => item.id === id), [id]);

  const projectMembers = useMemo(() => {
    if (!id) return [];
    return PROJECT_MEMBERS[id] ?? [];
  }, [id]);

  const experimentList = useMemo(() => {
    if (!id) return [];
    return EXPERIMENTS_BY_PROJECT[id] ?? [];
  }, [id]);

  const knowledgeList = useMemo(() => {
    if (!id) return [];
    return KNOWLEDGE_BY_PROJECT[id] ?? [];
  }, [id]);

  useEffect(() => {
    setMemberFilter('all');
    setStatusFilter('all');
    setTagFilter('all');
  }, [activeTab]);

  const currentRawList = activeTab === 'experiment' ? experimentList : knowledgeList;

  const tagOptions = useMemo(() => {
    const uniqueTags = Array.from(
      new Set(currentRawList.flatMap((item) => item.tags))
    );

    return [
      {
        label: activeTab === 'experiment' ? '实验目标' : '知识标签',
        value: 'all',
      },
      ...uniqueTags.map((tag) => ({ label: tag, value: tag })),
    ];
  }, [activeTab, currentRawList]);

  const memberOptions = useMemo(
    () => [
      { label: '成员', value: 'all' },
      ...projectMembers.map((member) => ({
        label: member.name,
        value: member.id,
      })),
    ],
    [projectMembers]
  );

  const statusOptions =
    activeTab === 'experiment'
      ? [
          { label: '实验阶段', value: 'all' },
          { label: '进行中', value: '进行中' },
          { label: '已完成', value: '已完成' },
        ]
      : [
          { label: '沉淀类型', value: 'all' },
          { label: '对话沉淀', value: '对话沉淀' },
          { label: '手工创建', value: '手工创建' },
          { label: '外部导入', value: '外部导入' },
        ];

  const filteredExperiments = useMemo(() => {
    return experimentList.filter((item) => {
      if (memberFilter !== 'all' && item.ownerId !== memberFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (tagFilter !== 'all' && !item.tags.includes(tagFilter)) return false;
      return true;
    });
  }, [experimentList, memberFilter, statusFilter, tagFilter]);

  const filteredKnowledge = useMemo(() => {
    return knowledgeList.filter((item) => {
      if (memberFilter !== 'all' && item.ownerId !== memberFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (tagFilter !== 'all' && !item.tags.includes(tagFilter)) return false;
      return true;
    });
  }, [knowledgeList, memberFilter, statusFilter, tagFilter]);

  const displayList =
    activeTab === 'experiment' ? filteredExperiments : filteredKnowledge;

  const memberCount = projectMembers.length;

  const projectTypeLabel = useMemo(() => {
    if (!project) return '项目';
    if (project.visibility === 'private') {
      return project.privateType === 'team' ? '团队项目' : '个人项目';
    }
    return '公开项目';
  }, [project]);

  const statusStyleMap: Record<string, React.CSSProperties> = {
    进行中: { backgroundColor: 'rgba(236, 253, 245, 1)', color: '#059669' },
    已完成: { backgroundColor: 'rgba(239, 246, 255, 1)', color: '#2563eb' },
    对话沉淀: { backgroundColor: 'rgba(236, 253, 245, 1)', color: '#059669' },
    手工创建: { backgroundColor: 'rgba(245, 243, 255, 1)', color: '#7c3aed' },
    外部导入: { backgroundColor: 'rgba(239, 246, 255, 1)', color: '#2563eb' },
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
            <BaseButton
              type="primary"
              size="small"
              rounded="large"
              onClick={() => navigate(`/chat/new?projectId=${project.id}`)}
            >
              发起对话
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
                <span className="inline-flex items-center rounded-full bg-[#f1f4f7] px-2.5 py-0.5 text-[13px] font-medium text-secondaryText">
                  {projectTypeLabel}
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
                    实验 {experimentList.length}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('knowledge')}
                    className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'knowledge'
                        ? 'border-[var(--color-primary)] text-primaryText'
                        : 'border-transparent text-tertiaryText'
                    }`}
                  >
                    知识沉淀 {knowledgeList.length}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <BaseSelect
                    options={memberOptions}
                    value={memberFilter}
                    onChange={(value) => setMemberFilter(String(value))}
                    size="small"
                    className="min-w-[116px]"
                  />
                  <BaseSelect
                    options={statusOptions}
                    value={statusFilter}
                    onChange={(value) => setStatusFilter(String(value))}
                    size="small"
                    className="min-w-[128px]"
                  />
                  <BaseSelect
                    options={tagOptions}
                    value={tagFilter}
                    onChange={(value) => setTagFilter(String(value))}
                    size="small"
                    className="min-w-[128px]"
                  />
                </div>

                <BaseButton
                  type="ghost"
                  size="small"
                  rounded="large"
                  icon={<Plus size={16} />}
                  className="!h-auto !border-transparent !bg-transparent !px-0 !py-0 !text-sm !font-semibold !text-primaryText hover:!bg-transparent hover:!text-[var(--color-gray-6)]"
                >
                  {activeTab === 'experiment' ? '新建实验' : '新建知识'}
                </BaseButton>
              </div>

              {displayList.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {displayList.map((item) => {
                    const isExperimentCard = activeTab === 'experiment';
                    const cardClassName = `rounded-lg border border-[var(--color-line-subtle)] bg-[var(--color-surface)] px-4 py-3.5 text-left transition-all ${
                      isExperimentCard
                        ? 'hover:border-[var(--color-gray-3)] hover:shadow-sm'
                        : ''
                    }`;
                    const cardContent = (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="truncate text-base font-medium text-primaryText">
                            {item.title}
                          </h3>
                          <span
                            className="shrink-0 rounded px-2 py-0.5 text-xs font-medium"
                            style={statusStyleMap[item.status]}
                          >
                            {item.status}
                          </span>
                        </div>

                        <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-secondaryText">
                          {item.summary}
                        </p>
                      </>
                    );

                    if (!isExperimentCard) {
                      return (
                        <div key={item.id} className={cardClassName}>
                          {cardContent}
                        </div>
                      );
                    }

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigate(`/project/${project.id}/experiment/${item.id}`)}
                        className={cardClassName}
                      >
                        {cardContent}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-dashed border-[var(--color-border-soft)]">
                  <BaseEmpty
                    description={`暂无符合筛选条件的${
                      activeTab === 'experiment' ? '实验' : '知识沉淀'
                    }`}
                  />
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
