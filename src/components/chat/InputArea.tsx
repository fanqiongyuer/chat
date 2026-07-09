import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Plus, Send, Search, Clock3, FileText } from 'lucide-react';
import { EXPERIMENT_DETAILS_BY_PROJECT, mockProjects } from '../../mock/projects';

interface InputAreaProps {
  onSend: (val: string) => void;
  disabled: boolean;
}

export interface ChatSkillOption {
  id: string;
  badge: string;
  description: string;
  source: string;
}

export interface ChatFileOption {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  sourceType: '最近操作' | '项目文件';
  isRecent: boolean;
  operatorName?: string;
  operatedAt?: string;
}

export const CHAT_INPUT_GUIDE_TEXT = '⏎发送 | ⇧+⏎换行 | @引用 | /快捷操作';

export const CHAT_SKILL_OPTIONS: ChatSkillOption[] = [
  { id: 'docx', badge: 'D', description: '文档创建、编辑与分析，支持批注和修订。', source: '内置' },
  { id: 'pdf', badge: 'P', description: 'PDF 提取、合并拆分、表单处理与批量分析。', source: '内置' },
  { id: 'pptx', badge: 'P', description: '演示文稿创建与编辑，支持布局和演讲备注。', source: '内置' },
  { id: 'skill-creator', badge: 'S', description: '快速创建或迭代 Agent Skill 的结构与说明。', source: '内置' },
  { id: 'xlsx', badge: 'X', description: '表格计算、公式处理和数据分析。', source: '内置' },
  { id: 'code-quality-checker', badge: 'C', description: '检查代码风格、潜在问题和质量风险。', source: '内置' },
  { id: 'design-prd-analyst', badge: 'A', description: '分析 PRD 并提炼可执行的研发要点。', source: '内置' },
  { id: 'home-delivery', badge: 'H', description: '外卖与生活配送场景的智能推荐。', source: '内置' },
  { id: 'life-assistant', badge: 'L', description: '生活事务分发与跨技能场景协作。', source: '内置' },
  { id: 'reminders', badge: 'R', description: '提醒创建、查看和完成状态管理。', source: '内置' },
];

const SLASH_QUERY_REGEX = /(?:^|\s)\/([^\s/]*)$/;
const AT_QUERY_REGEX = /(?:^|\s)@([^\s@]*)$/;

export const resolveSlashQuery = (text: string, cursor: number) => {
  const textBeforeCursor = text.slice(0, cursor);
  const matched = textBeforeCursor.match(SLASH_QUERY_REGEX);
  return matched ? matched[1] : null;
};

export const resolveAtQuery = (text: string, cursor: number) => {
  const textBeforeCursor = text.slice(0, cursor);
  const matched = textBeforeCursor.match(AT_QUERY_REGEX);
  return matched ? matched[1] : null;
};

export const insertSkillCommand = (text: string, start: number, end: number, skillId: string) => {
  const before = text.slice(0, start);
  const after = text.slice(end);
  const matched = before.match(/(?:^|\s)\/[^\s/]*$/);

  if (!matched) {
    const fallbackInsert = `/${skillId} `;
    const nextValue = `${before}${fallbackInsert}${after}`;
    return { value: nextValue, cursor: before.length + fallbackInsert.length };
  }

  const tokenStart = before.length - matched[0].length;
  const leadingSpace = matched[0].startsWith(' ') ? ' ' : '';
  const replacement = `${leadingSpace}/${skillId} `;
  const nextBefore = `${before.slice(0, tokenStart)}${replacement}`;

  return {
    value: `${nextBefore}${after}`,
    cursor: nextBefore.length,
  };
};

export const insertFileReference = (text: string, start: number, end: number, fileName: string) => {
  const before = text.slice(0, start);
  const after = text.slice(end);
  const matched = before.match(/(?:^|\s)@[^\s@]*$/);

  if (!matched) {
    const fallbackInsert = `@${fileName} `;
    const nextValue = `${before}${fallbackInsert}${after}`;
    return { value: nextValue, cursor: before.length + fallbackInsert.length };
  }

  const tokenStart = before.length - matched[0].length;
  const leadingSpace = matched[0].startsWith(' ') ? ' ' : '';
  const replacement = `${leadingSpace}@${fileName} `;
  const nextBefore = `${before.slice(0, tokenStart)}${replacement}`;

  return {
    value: `${nextBefore}${after}`,
    cursor: nextBefore.length,
  };
};

const buildProjectFileOptions = (): ChatFileOption[] => {
  const projectNameById = new Map(mockProjects.map((project) => [project.id, project.name]));
  const fileMap = new Map<string, ChatFileOption>();

  const pushOption = (
    projectId: string,
    fileName: string,
    sourceType: ChatFileOption['sourceType'],
    isRecent = false,
    operatorName?: string,
    operatedAt?: string,
  ) => {
    const normalizedName = fileName.trim();
    if (!normalizedName) return;

    const key = `${projectId}:${normalizedName}`;
    if (fileMap.has(key)) {
      const current = fileMap.get(key);
      if (!current) return;

      if (isRecent) current.isRecent = true;
      if (operatorName) current.operatorName = operatorName;
      if (operatedAt) current.operatedAt = operatedAt;
      return;
    }

    fileMap.set(key, {
      id: `file-${projectId}-${fileMap.size}`,
      name: normalizedName,
      projectId,
      projectName: projectNameById.get(projectId) ?? '未知项目',
      sourceType,
      isRecent,
      operatorName,
      operatedAt,
    });
  };

  Object.entries(EXPERIMENT_DETAILS_BY_PROJECT).forEach(([projectId, details]) => {
    details.forEach((detail) => {
      detail.resources.forEach((resource) => pushOption(projectId, resource.name, '项目文件'));
      detail.timeline.forEach((timeline, timelineIndex) => {
        timeline.attachments.forEach((attachment) => {
          pushOption(projectId, attachment, '项目文件', timelineIndex < 2, timeline.actor, timeline.updatedAt);
        });
      });
    });
  });

  const recentSeeds: Array<{ name: string; projectId: string; operatorName: string; operatedAt: string }> = [
    { name: 'clipboard-1780…', projectId: 'p-crispr', operatorName: '樊京月', operatedAt: '昨天 11:32' },
    { name: '需求.numbers', projectId: 'p-thal', operatorName: '李梓涵', operatedAt: '昨天 09:18' },
    { name: '前端界面测试.zip', projectId: 'p-organoid', operatorName: '王平', operatedAt: '07-06 18:45' },
  ];

  recentSeeds.forEach((seed) => pushOption(seed.projectId, seed.name, '最近操作', true, seed.operatorName, seed.operatedAt));

  const options = Array.from(fileMap.values());
  return options.sort((a, b) => {
    if (a.isRecent !== b.isRecent) return a.isRecent ? -1 : 1;
    if (a.projectName !== b.projectName) return a.projectName.localeCompare(b.projectName, 'zh-Hans-CN');
    return a.name.localeCompare(b.name, 'zh-Hans-CN');
  });
};

export const CHAT_FILE_OPTIONS: ChatFileOption[] = buildProjectFileOptions();
export const CHAT_RECENT_FILE_OPTIONS: ChatFileOption[] = CHAT_FILE_OPTIONS.filter((option) => option.isRecent).slice(0, 10);

const InputArea = ({ onSend, disabled }: InputAreaProps) => {
  const [val, setVal] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const [showSkillMenu, setShowSkillMenu] = useState(false);
  const [skillQuery, setSkillQuery] = useState('');
  const [activeSkillIndex, setActiveSkillIndex] = useState(-1);

  const [showFileMenu, setShowFileMenu] = useState(false);
  const [fileQuery, setFileQuery] = useState('');
  const [activeFileIndex, setActiveFileIndex] = useState(-1);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const filteredSkills = useMemo(() => {
    const keyword = skillQuery.trim().toLowerCase();
    if (!keyword) return CHAT_SKILL_OPTIONS;

    return CHAT_SKILL_OPTIONS.filter((skill) => {
      const searchText = `${skill.id} ${skill.description} ${skill.source}`.toLowerCase();
      return searchText.includes(keyword);
    });
  }, [skillQuery]);

  const filteredFiles = useMemo(() => {
    const keyword = fileQuery.trim().toLowerCase();
    if (!keyword) {
      return CHAT_FILE_OPTIONS.filter((file) => file.isRecent).slice(0, 10);
    }

    return CHAT_FILE_OPTIONS.filter((file) => {
      const searchText = `${file.name} ${file.projectName} ${file.sourceType} ${file.operatorName ?? ''} ${file.operatedAt ?? ''}`.toLowerCase();
      return searchText.includes(keyword);
    });
  }, [fileQuery]);

  const syncCommandMenuState = useCallback((nextValue: string, cursor: number | null | undefined) => {
    const selection = cursor ?? nextValue.length;
    const slashQuery = resolveSlashQuery(nextValue, selection);

    if (slashQuery !== null) {
      setShowSkillMenu(true);
      setSkillQuery(slashQuery);
      setActiveSkillIndex(-1);

      setShowFileMenu(false);
      setFileQuery('');
      setActiveFileIndex(-1);
      return;
    }

    const atQuery = resolveAtQuery(nextValue, selection);
    if (atQuery !== null) {
      setShowFileMenu(true);
      setFileQuery(atQuery);
      setActiveFileIndex(-1);

      setShowSkillMenu(false);
      setSkillQuery('');
      setActiveSkillIndex(-1);
      return;
    }

    setShowSkillMenu(false);
    setSkillQuery('');
    setActiveSkillIndex(-1);

    setShowFileMenu(false);
    setFileQuery('');
    setActiveFileIndex(-1);
  }, []);

  const applySkillSelection = useCallback((skillId: string) => {
    const textarea = textareaRef.current;
    const selectionStart = textarea?.selectionStart ?? val.length;
    const selectionEnd = textarea?.selectionEnd ?? selectionStart;
    const next = insertSkillCommand(val, selectionStart, selectionEnd, skillId);

    setVal(next.value);
    setShowSkillMenu(false);
    setSkillQuery('');
    setActiveSkillIndex(-1);

    requestAnimationFrame(() => {
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(next.cursor, next.cursor);
    });
  }, [val]);

  const applyFileSelection = useCallback((fileName: string) => {
    const textarea = textareaRef.current;
    const selectionStart = textarea?.selectionStart ?? val.length;
    const selectionEnd = textarea?.selectionEnd ?? selectionStart;
    const next = insertFileReference(val, selectionStart, selectionEnd, fileName);

    setVal(next.value);
    setShowFileMenu(false);
    setFileQuery('');
    setActiveFileIndex(-1);

    requestAnimationFrame(() => {
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(next.cursor, next.cursor);
    });
  }, [val]);

  const handleSend = useCallback(() => {
    if (!val.trim() || disabled) return;
    onSend(val);
    setVal('');

    setShowSkillMenu(false);
    setSkillQuery('');
    setActiveSkillIndex(-1);

    setShowFileMenu(false);
    setFileQuery('');
    setActiveFileIndex(-1);
  }, [val, disabled, onSend]);

  return (
    <div className="w-full max-w-[840px] mx-auto">
      <div className="relative bg-white rounded-3xl shadow-sm border border-borderGray flex flex-col transition-all focus-within:shadow-lg focus-within:border-borderGray">
        <textarea
          ref={textareaRef}
          value={val}
          onChange={(event) => {
            const nextValue = event.target.value;
            setVal(nextValue);
            syncCommandMenuState(nextValue, event.target.selectionStart);
          }}
          onClick={(event) => {
            syncCommandMenuState(event.currentTarget.value, event.currentTarget.selectionStart);
          }}
          onKeyUp={(event) => {
            if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(event.key)) return;
            syncCommandMenuState(event.currentTarget.value, event.currentTarget.selectionStart);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.shiftKey || event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              const textarea = event.currentTarget;
              const selectionStart = textarea.selectionStart ?? val.length;
              const selectionEnd = textarea.selectionEnd ?? selectionStart;
              const nextValue = `${val.slice(0, selectionStart)}\n${val.slice(selectionEnd)}`;
              const nextCursor = selectionStart + 1;

              setVal(nextValue);
              syncCommandMenuState(nextValue, nextCursor);

              requestAnimationFrame(() => {
                textarea.setSelectionRange(nextCursor, nextCursor);
              });
              return;
            }

            if (showSkillMenu) {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setActiveSkillIndex((prev) => {
                  if (filteredSkills.length === 0) return -1;
                  if (prev < 0) return 0;
                  return (prev + 1) % filteredSkills.length;
                });
                return;
              }

              if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActiveSkillIndex((prev) => {
                  if (filteredSkills.length === 0) return -1;
                  if (prev < 0) return filteredSkills.length - 1;
                  return (prev - 1 + filteredSkills.length) % filteredSkills.length;
                });
                return;
              }

              if (event.key === 'Escape') {
                event.preventDefault();
                setShowSkillMenu(false);
                setSkillQuery('');
                setActiveSkillIndex(-1);
                return;
              }

              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                const targetSkill = activeSkillIndex >= 0 ? filteredSkills[activeSkillIndex] : undefined;
                if (targetSkill) {
                  applySkillSelection(targetSkill.id);
                }
                return;
              }
            }

            if (showFileMenu) {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setActiveFileIndex((prev) => {
                  if (filteredFiles.length === 0) return -1;
                  if (prev < 0) return 0;
                  return (prev + 1) % filteredFiles.length;
                });
                return;
              }

              if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActiveFileIndex((prev) => {
                  if (filteredFiles.length === 0) return -1;
                  if (prev < 0) return filteredFiles.length - 1;
                  return (prev - 1 + filteredFiles.length) % filteredFiles.length;
                });
                return;
              }

              if (event.key === 'Escape') {
                event.preventDefault();
                setShowFileMenu(false);
                setFileQuery('');
                setActiveFileIndex(-1);
                return;
              }

              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                const targetFile = activeFileIndex >= 0 ? filteredFiles[activeFileIndex] : undefined;
                if (targetFile) {
                  applyFileSelection(targetFile.name);
                }
                return;
              }
            }

            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            setShowSkillMenu(false);
            setShowFileMenu(false);
          }}
          placeholder={isFocused ? CHAT_INPUT_GUIDE_TEXT : '输入你的科研问题...'}
          className="w-full min-h-[72px] max-h-[180px] px-5 pt-4 pb-3 outline-none resize-none text-[14px] bg-transparent text-primaryText placeholder:text-tertiaryText leading-relaxed"
        />

        {showSkillMenu && (
          <div className="absolute inset-x-4 bottom-full mb-2 z-40" onMouseDown={(event) => event.preventDefault()}>
            <div className="overflow-hidden rounded-xl border border-[#e6ecf2] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
              <div className="flex items-center gap-2 border-b border-[#eef2f6] px-3 py-2 text-[13px] text-tertiaryText">
                <Search size={14} className="text-tertiaryText" />
                <span className="truncate">{skillQuery ? `搜索 skill：${skillQuery}` : '搜索 skill'}</span>
              </div>

              <div className="max-h-64 overflow-y-auto py-1">
                {filteredSkills.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-tertiaryText">未找到匹配的 Skill</div>
                ) : (
                  filteredSkills.map((skill, index) => (
                    <button
                      key={skill.id}
                      type="button"
                      className={`mx-2 flex w-[calc(100%-1rem)] items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                        index === activeSkillIndex ? 'bg-[#f4f7fb]' : 'hover:bg-[#f8fafc]'
                      }`}
                      onClick={() => applySkillSelection(skill.id)}
                    >
                      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded bg-[#eef3f8] text-[10px] font-semibold leading-none text-[#5f6b7a]">
                        {skill.badge}
                      </span>
                      <span className="min-w-0 flex flex-1 items-center gap-1">
                        <span className="text-[13px] font-semibold text-primaryText">{skill.id}</span>
                        <span className="truncate text-[12px] text-tertiaryText">{skill.description}</span>
                      </span>
                      <span className="shrink-0 text-[11px] text-tertiaryText">{skill.source}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {showFileMenu && (
          <div className="absolute inset-x-4 bottom-full mb-2 z-40" onMouseDown={(event) => event.preventDefault()}>
            <div className="overflow-hidden rounded-xl border border-[#e6ecf2] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
              <div className="flex items-center gap-2 border-b border-[#eef2f6] px-3 py-2 text-[13px] text-tertiaryText">
                <Search size={14} className="text-tertiaryText" />
                <span className="truncate">{fileQuery ? `搜索文件：${fileQuery}` : '搜索文件'}</span>
              </div>

              <div className="max-h-64 overflow-y-auto py-1">
                {!fileQuery && (
                  <div className="px-3 py-2">
                    <div className="flex items-center gap-1 text-[12px] text-tertiaryText">
                      <Clock3 size={12} />
                      <span>最近使用的文档</span>
                    </div>
                  </div>
                )}
                {filteredFiles.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-tertiaryText">未找到匹配的文件</div>
                ) : (
                  filteredFiles.map((file, index) => (
                    <button
                      key={file.id}
                      type="button"
                      className={`mx-2 flex w-[calc(100%-1rem)] items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                        index === activeFileIndex ? 'bg-[#f4f7fb]' : 'hover:bg-[#f8fafc]'
                      }`}
                      onClick={() => applyFileSelection(file.name)}
                    >
                      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded bg-[#eef3f8] text-[#5f6b7a]">
                        <FileText size={11} />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-primaryText">{file.name}</span>
                      {!fileQuery && file.operatorName && file.operatedAt && (
                        <span className="shrink-0 max-w-[55%] truncate text-right text-[12px] text-tertiaryText">
                          {`- by ${file.operatorName} ${file.operatedAt}`}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center p-3 pt-0">
          <div className="relative group">
            <button className="w-8 h-8 rounded-full border border-borderGray flex items-center justify-center text-tertiaryText hover:bg-bgLight transition-colors bg-white">
              <Plus size={16} />
            </button>
            <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 hidden w-max whitespace-nowrap rounded-lg bg-[#2b313d] px-3 py-2 text-[13px] leading-6 text-white shadow-[0_8px_20px_rgba(15,23,42,0.25)] group-hover:block">
              <div>上传文件，支持各类文档和图片</div>
              <div>最多 50 个，每个 100 MB</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSend}
              disabled={disabled || !val.trim()}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${val.trim() && !disabled ? 'bg-primary text-white shadow-md hover:bg-primary-hover' : 'bg-tertiaryText text-white'}`}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(InputArea);