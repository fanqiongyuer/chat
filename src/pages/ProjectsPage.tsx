import React, { useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { mockProjects } from '../mock/projects';
import { ChevronLeft, Plus, Menu } from 'lucide-react';
import { BaseButton } from '../components';
import { type LayoutOutletContext } from '../components/Layout';

type ProjectTab = 'private' | 'public';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<LayoutOutletContext>();
  const [activeTab, setActiveTab] = useState<ProjectTab>('private');

  const filteredProjects = useMemo(
    () => mockProjects.filter((proj) => proj.visibility === activeTab),
    [activeTab]
  );

  const tabDescription =
    activeTab === 'private'
      ? '您可查看私有项目的对话，并编辑里面的知识内容'
      : '公开项目仅可查看其中已开放的知识内容，无法查看对话和编辑内容';

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <header className="z-10 flex h-16 shrink-0 items-center justify-between bg-white/80 px-4 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          {!isSidebarOpen && (
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-secondaryText hover:bg-bgLight rounded-full transition-colors" title="展开边栏">
              <Menu size={20} />
            </button>
          )}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-primaryText">项目</span>
          </div>
        </div>
        <BaseButton
          type="primary"
          size="small"
          rounded="large"
          icon={<Plus size={14} />}
          className="shrink-0"
        >
          创建新项目
        </BaseButton>
      </header>
      <div className="flex-1 overflow-y-auto px-4 pb-12 pt-4 md:px-8 lg:px-10 md:pb-12 md:pt-6">
        <div className="max-w-[1240px] mx-auto">
          <section className="pb-0">
            <h2 className="text-2xl font-semibold text-primaryText">科研项目</h2>
            <div className="mt-6 flex items-end gap-8">
              <button
                type="button"
                onClick={() => setActiveTab('private')}
                className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'private'
                    ? 'border-[var(--color-primary)] text-primaryText'
                    : 'border-transparent text-tertiaryText'
                }`}
              >
                私有项目
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('public')}
                className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'public'
                    ? 'border-[var(--color-primary)] text-primaryText'
                    : 'border-transparent text-tertiaryText'
                }`}
              >
                公开项目
              </button>
            </div>
            <div className="border-t border-[var(--color-line-subtle)] pt-4 pb-2">
              <p className="text-sm text-[var(--color-gray-4)]">{tabDescription}</p>
            </div>
          </section>

          <div className="mt-0 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((proj) => (
              <button
                key={proj.id}
                type="button"
                onClick={() => navigate(`/project/${proj.id}`)}
                className="group rounded-lg border border-[var(--color-line-subtle)] bg-[var(--color-surface)] px-4 py-3.5 text-left transition-all hover:border-[var(--color-gray-3)] hover:shadow-sm"
              >
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="truncate text-base font-medium text-primaryText">{proj.name}</h3>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] leading-none ${
                      proj.visibility === 'private'
                        ? proj.privateType === 'personal'
                          ? 'bg-[#f5f3ff] text-[#7c3aed]'
                          : 'bg-[#ecfdf5] text-[#059669]'
                        : 'bg-[#eff6ff] text-[#2563eb]'
                    }`}
                  >
                    {proj.visibility === 'private'
                      ? proj.privateType === 'personal'
                        ? '个人项目'
                        : '团队项目'
                      : '公开项目'}
                  </span>
                </div>

                <p className="line-clamp-2 min-h-[40px] text-sm leading-5 text-secondaryText">{proj.desc}</p>

                <div className="mt-4 flex items-center gap-2 text-xs text-tertiaryText">
                  <span>{proj.count} 个对话</span>
                  <span>·</span>
                  <span>{proj.members} 名成员</span>
                </div>
              </button>
            ))}

            {filteredProjects.length === 0 && (
              <div className="col-span-full rounded-lg border border-dashed border-[var(--color-border-soft)] px-4 py-10 text-center text-sm text-tertiaryText">
                暂无{activeTab === 'private' ? '私有项目' : '公开项目'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}