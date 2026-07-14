import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Menu, Plus, Search } from 'lucide-react';
import { BaseButton } from '../components';
import { type LayoutOutletContext } from '../components/Layout';

type SkillRiskLevel = 'low' | 'medium';
type SkillTab = 'installed' | 'uninstalled';

type SkillCardItem = {
  id: string;
  name: string;
  source: string;
  description: string;
  tags: string[];
  riskLevel: SkillRiskLevel;
  installed: boolean;
};

const skillCards: SkillCardItem[] = [
  {
    id: 'sso-official-1',
    name: 'sso-skills-official',
    source: '美团官方 · certified',
    description: '帮助对比同 protocol 与外文方式的 prompt 复核，适合跨页面与跨分析任务使用。',
    tags: ['文档处理', '提示词分析'],
    riskLevel: 'medium',
    installed: true,
  },
  {
    id: 'sso-official-2',
    name: 'sso-skills-official',
    source: '美团官方 · certified',
    description: '帮助对比同 protocol 与外文方式的 prompt 复核，适合跨页面与跨分析任务使用。',
    tags: ['文档处理'],
    riskLevel: 'low',
    installed: true,
  },
  {
    id: 'sso-official-3',
    name: 'sso-skills-official',
    source: '美团官方 · certified',
    description: '帮助对比同 protocol 与外文方式的 prompt 复核，适合跨页面与跨分析任务使用。',
    tags: ['文档处理', '提示分析'],
    riskLevel: 'medium',
    installed: false,
  },
  {
    id: 'sso-official-4',
    name: 'sso-skills-official',
    source: '美团官方 · certified',
    description: '帮助对比同 protocol 与外文方式的 prompt 复核，适合跨页面与跨分析任务使用。',
    tags: ['文档处理', '提示分析'],
    riskLevel: 'medium',
    installed: false,
  },
  {
    id: 'sso-official-5',
    name: 'sso-skills-official',
    source: '美团官方 · certified',
    description: '帮助对比同 protocol 与外文方式的 prompt 复核，适合跨页面与跨分析任务使用。',
    tags: ['文档处理', '提示分析'],
    riskLevel: 'low',
    installed: true,
  },
  {
    id: 'sso-official-6',
    name: 'sso-skills-official',
    source: '美团官方 · certified',
    description: '帮助对比同 protocol 与外文方式的 prompt 复核，适合跨页面与跨分析任务使用。',
    tags: ['文档处理', '提示分析'],
    riskLevel: 'medium',
    installed: false,
  },
];

const riskLabelMap: Record<SkillRiskLevel, string> = {
  low: '低风险',
  medium: '中风险',
};

const riskStyleMap: Record<SkillRiskLevel, React.CSSProperties> = {
  low: {
    color: '#14B886',
    backgroundColor: 'rgba(20, 184, 134, 0.12)',
  },
  medium: {
    color: '#ff7d00',
    backgroundColor: 'rgba(255, 125, 0, 0.12)',
  },
};

export default function SkillPage() {
  const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<LayoutOutletContext>();
  const [activeTab, setActiveTab] = useState<SkillTab>('installed');
  const [keyword, setKeyword] = useState('');
  const [skills, setSkills] = useState<SkillCardItem[]>(skillCards);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [hoveredSkillId, setHoveredSkillId] = useState<string | null>(null);

  const filteredSkills = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return skills.filter((skill) => {
      const tabMatched = activeTab === 'installed' ? skill.installed : !skill.installed;
      if (!tabMatched) return false;

      if (!normalizedKeyword) return true;

      const searchPool = [skill.name, skill.source, skill.description, ...skill.tags].join(' ').toLowerCase();
      return searchPool.includes(normalizedKeyword);
    });
  }, [activeTab, keyword, skills]);

  const handleTabChange = (tab: SkillTab) => {
    setActiveTab(tab);
    setIsBatchMode(false);
    setSelectedSkillIds([]);
  };

  const toggleBatchMode = () => {
    setIsBatchMode((prev) => !prev);
    setSelectedSkillIds([]);
  };

  const toggleSkillSelection = (skillId: string) => {
    setSelectedSkillIds((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId],
    );
  };

  const handleSingleAction = (skillId: string, shouldInstall: boolean) => {
    setSkills((prev) =>
      prev.map((skill) => (skill.id === skillId ? { ...skill, installed: shouldInstall } : skill)),
    );
    setSelectedSkillIds((prev) => prev.filter((id) => id !== skillId));
  };

  const handleBatchAction = () => {
    if (selectedSkillIds.length < 1) return;
    const shouldInstall = activeTab === 'uninstalled';
    setSkills((prev) =>
      prev.map((skill) =>
        selectedSkillIds.includes(skill.id) ? { ...skill, installed: shouldInstall } : skill,
      ),
    );
    setSelectedSkillIds([]);
    setIsBatchMode(false);
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-white">
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
            <span className="text-tertiaryText">系统设置</span>
            <span className="text-tertiaryText">/</span>
            <span className="font-medium text-primaryText">Skill</span>
          </div>
        </div>
        <BaseButton
          type="primary"
          size="small"
          rounded="large"
          icon={<Plus size={14} />}
          className="shrink-0 !border-gray-7 !bg-gray-7 !text-white hover:!border-gray-6 hover:!bg-gray-6"
        >
          新建 Skill
        </BaseButton>
      </header>

      <div
        className={`flex-1 overflow-y-auto px-4 pt-4 md:px-8 lg:px-10 md:pt-6 ${
          isBatchMode ? 'pb-32' : 'pb-12'
        }`}
      >
        <div className="mx-auto max-w-[1240px]">
          <section>
            <h2 className="text-center text-2xl font-semibold text-primaryText">Skills, Agent 能力扩展</h2>
            <p className="mt-2 text-center text-sm text-tertiaryText">
              模块化、可复用的能力单元，用于扩展 Agent 功能，使其具备跨领域能力与多维指令执行专家。
            </p>

            <div className="mx-auto mt-4 w-full max-w-[600px]">
              <div
                className="flex items-center gap-2 rounded-full border bg-white px-4 py-2.5"
                style={{ borderColor: 'var(--color-line-subtle)' }}
              >
                <Search size={16} className="text-tertiaryText" />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="输入关键词，查找你需要的 Skills"
                  className="w-full bg-transparent text-sm text-primaryText outline-none placeholder:text-tertiaryText"
                />
              </div>
            </div>
          </section>

          <section className="mt-5">
            <div className="flex items-end justify-between border-b" style={{ borderColor: 'var(--color-line-subtle)' }}>
              <div className="flex items-end gap-8">
                <button
                  type="button"
                  onClick={() => handleTabChange('installed')}
                  className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'installed'
                      ? 'border-[var(--color-primary)] text-primaryText'
                      : 'border-transparent text-tertiaryText'
                  }`}
                >
                  已安装
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('uninstalled')}
                  className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'uninstalled'
                      ? 'border-[var(--color-primary)] text-primaryText'
                      : 'border-transparent text-tertiaryText'
                  }`}
                >
                  未安装
                </button>
              </div>

              <label className="mb-2 inline-flex items-center gap-2 text-sm text-tertiaryText">
                <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-[4px]">
                  <input
                    type="checkbox"
                    checked={isBatchMode}
                    onChange={(event) => {
                      setIsBatchMode(event.target.checked);
                      setSelectedSkillIds([]);
                    }}
                    className="peer absolute inset-0 cursor-pointer opacity-0"
                  />
                  <span className="pointer-events-none inline-flex h-full w-full items-center justify-center rounded-[4px] border border-[#c9d1dc] bg-white text-transparent transition-colors peer-checked:border-transparent peer-checked:bg-[#14B886] peer-checked:text-white">
                    <svg className="h-2.5 w-2.5" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M3.5 8.2L6.5 11.1L12.5 5.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </span>
                批量操作
              </label>
            </div>

            {filteredSkills.length > 0 ? (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredSkills.map((skill) => {
                  const isSkillSelected = selectedSkillIds.includes(skill.id);
                  const showBatchSelector = isBatchMode;

                  return (
                    <article
                      key={skill.id}
                      className="rounded-lg border p-4 transition-shadow hover:shadow-sm"
                      style={{
                        borderColor: isSkillSelected ? 'rgba(20, 184, 134, 0.45)' : 'var(--color-line-subtle)',
                        background: isSkillSelected
                          ? 'rgba(20, 184, 134, 0.06)'
                          : hoveredSkillId === skill.id
                            ? 'linear-gradient(to bottom, rgba(242, 243, 245, 0.4) 0%, #ffffff 100%)'
                            : 'var(--color-surface)',
                      }}
                      onMouseEnter={() => setHoveredSkillId(skill.id)}
                      onMouseLeave={() => setHoveredSkillId((current) => (current === skill.id ? null : current))}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-base font-medium text-primaryText">{skill.name}</div>
                          <div className="mt-1 text-xs text-tertiaryText">{skill.source}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded px-2 py-1 text-xs font-medium" style={riskStyleMap[skill.riskLevel]}>
                            {riskLabelMap[skill.riskLevel]}
                          </span>
                          {showBatchSelector && (
                            <button
                              type="button"
                              onClick={() => toggleSkillSelection(skill.id)}
                              className="relative inline-flex h-4 w-4 items-center justify-center rounded-[4px]"
                              aria-label={isSkillSelected ? '取消选择 Skill' : '选择 Skill'}
                            >
                              <span className={`pointer-events-none inline-flex h-full w-full items-center justify-center rounded-[4px] border transition-colors ${
                                isSkillSelected
                                  ? 'border-transparent bg-[#14B886] text-white'
                                  : 'border-[#c9d1dc] bg-white text-transparent'
                              }`}>
                                <svg className="h-2.5 w-2.5" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                  <path d="M3.5 8.2L6.5 11.1L12.5 5.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </span>
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-secondaryText">{skill.description}</p>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          {skill.tags.map((tag) => (
                            <span
                              key={`${skill.id}-${tag}`}
                              className="inline-flex items-center rounded-full px-3 py-1.5 text-xs text-tertiaryText"
                              style={{ backgroundColor: 'var(--color-gray-1)' }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {!showBatchSelector && (
                          <button
                            type="button"
                            onClick={() => handleSingleAction(skill.id, !skill.installed)}
                            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                              hoveredSkillId === skill.id ? 'inline-flex items-center' : 'hidden'
                            }`}
                            style={
                              skill.installed
                                ? { backgroundColor: 'var(--color-gray-1)', color: 'var(--color-text-primary)' }
                                : { backgroundColor: 'var(--color-primary)', color: 'var(--color-white)' }
                            }
                          >
                            {skill.installed ? '卸载' : '安装'}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div
                className="mt-4 flex h-36 items-center justify-center rounded-lg border text-sm text-tertiaryText"
                style={{ borderColor: 'var(--color-line-subtle)' }}
              >
                暂无匹配的 Skills
              </div>
            )}
          </section>
        </div>
      </div>

      {isBatchMode && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-30 border-t bg-white"
          style={{ borderColor: 'var(--color-line-subtle)' }}
        >
          <div className="pointer-events-auto mx-auto flex max-w-[1240px] items-center justify-between px-4 py-3 md:px-8 lg:px-10">
            <span className="text-sm text-secondaryText">已选择 {selectedSkillIds.length} 条 Skill</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleBatchMode}
                className="rounded-md border border-[var(--color-line-subtle)] bg-white px-3 py-1 text-sm text-secondaryText transition-colors hover:bg-[#f5f6f7]"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleBatchAction}
                disabled={selectedSkillIds.length < 1}
                className="rounded-md bg-[#14B886] px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-[#0d9e6d] disabled:cursor-not-allowed disabled:bg-[#9fdac7]"
              >
                {activeTab === 'installed' ? '批量卸载' : '批量安装'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}