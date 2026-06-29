import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Search, Globe, BookOpen, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';

/**
 * 任务状态阶段枚举，对齐豆包的交互范式：
 *   thinking  → 模型正在推理
 *   searching → 正在检索知识库 / 网络
 *   generating → 正在生成回复
 */
export type StatusPhase = 'thinking' | 'searching' | 'generating';

export interface SearchStep {
  /** 步骤类型 */
  type: 'knowledge' | 'web' | 'tool';
  /** 步骤描述文案 */
  label: string;
}

interface ThinkingIndicatorProps {
  /** 当前阶段 */
  phase: StatusPhase;
  /** 搜索/工具调用步骤列表 */
  searchSteps?: SearchStep[];
  /** 是否默认展开搜索步骤，默认 true */
  defaultExpanded?: boolean;
}

/* ── 阶段对应文案 ── */
const PHASE_LABEL: Record<StatusPhase, string> = {
  thinking: '思考中…',
  searching: '搜索中…',
  generating: '生成中…',
};

/* ── 步骤类型 → 图标 + 颜色 ── */
const STEP_META: Record<
  SearchStep['type'],
  { icon: React.ReactNode; colorClass: string }
> = {
  knowledge: {
    icon: <BookOpen size={13} />,
    colorClass: 'text-blue-500',
  },
  web: {
    icon: <Globe size={13} />,
    colorClass: 'text-violet-500',
  },
  tool: {
    icon: <Search size={13} />,
    colorClass: 'text-amber-500',
  },
};

const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({
  phase,
  searchSteps = [],
  defaultExpanded = true,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const stepsContainerRef = useRef<HTMLDivElement>(null);

  /* 当步骤列表变化时自动展开 */
  useEffect(() => {
    if (searchSteps.length > 0) {
      setExpanded(true);
    }
  }, [searchSteps.length]);

  const hasSteps = searchSteps.length > 0;

  return (
    <div className="flex w-full flex-col items-start">
      {/* ── 主状态行 ── */}
      <div className="flex items-center gap-2">
        {/* 旋转动画图标 */}
        <span className="relative flex h-4 w-4 items-center justify-center">
          {phase === 'generating' ? (
            <Sparkles size={14} className="text-blue-500 animate-pulse" />
          ) : (
            <Loader2 size={14} className="animate-spin text-blue-500" />
          )}
        </span>

        {/* 阶段文案 */}
        <span className="text-[13px] leading-5 text-secondaryText select-none">
          {PHASE_LABEL[phase]}
        </span>

        {/* 搜索步骤折叠按钮 */}
        {hasSteps && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="ml-0.5 inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[12px] text-tertiaryText hover:bg-bgLight hover:text-secondaryText transition-colors"
          >
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <span>{searchSteps.length} 条结果</span>
          </button>
        )}
      </div>

      {/* ── 搜索步骤列表（可折叠） ── */}
      {hasSteps && (
        <div
          ref={stepsContainerRef}
          className={`ml-6 mt-1 space-y-1 overflow-hidden transition-all duration-300 ease-out ${
            expanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          {searchSteps.map((step, idx) => {
            const meta = STEP_META[step.type] ?? STEP_META.tool;
            return (
              <div
                key={`${step.type}-${idx}-${step.label}`}
                className="flex items-center gap-2 text-[13px] leading-5 text-secondaryText"
              >
                <span className={meta.colorClass}>{meta.icon}</span>
                <span className="truncate max-w-[480px]">{step.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default React.memo(ThinkingIndicator);
