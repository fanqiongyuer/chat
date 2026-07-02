import React, { useCallback } from 'react';

interface QuickPromptsProps {
  onSelect: (text: string) => void;
}

const PROMPTS = [
  "整理实验笔记",
  "设计实验方案",
  "文献解读",
  "生成项目日报"
] as const;

const QuickPrompts = ({ onSelect }: QuickPromptsProps) => {
  const handleClick = useCallback((prompt: string) => {
    onSelect(prompt);
  }, [onSelect]);

  return (
    <div className="flex justify-center flex-wrap gap-4 mt-2">
      {PROMPTS.map(p => (
        <button
          key={p}
          onClick={() => handleClick(p)}
          className="px-5 py-2.5 rounded-full border border-borderGray text-sm text-secondaryText bg-white hover:bg-bgLight transition-colors shadow-sm"
        >
          {p}
        </button>
      ))}
    </div>
  );
};

export default React.memo(QuickPrompts);
