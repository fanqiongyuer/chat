import React, { useState, useCallback } from 'react';
import { Plus, Send, Paperclip } from 'lucide-react';

interface InputAreaProps {
  onSend: (val: string) => void;
  disabled: boolean;
}

const InputArea = ({ onSend, disabled }: InputAreaProps) => {
  const [val, setVal] = useState('');

  const handleSend = useCallback(() => {
    if (!val.trim() || disabled) return;
    onSend(val);
    setVal('');
  }, [val, disabled, onSend]);

  return (
    <div className="w-full max-w-[840px] mx-auto">
      <div className="relative bg-white rounded-3xl shadow-sm border border-borderGray flex flex-col transition-all focus-within:shadow-lg focus-within:border-borderGray">
        <textarea
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={disabled}
          placeholder="输入你的科研问题..."
          className="w-full min-h-[72px] max-h-[180px] px-5 pt-4 pb-3 outline-none resize-none text-lg bg-transparent text-primaryText placeholder:text-tertiaryText leading-relaxed"
        />
        <div className="flex justify-between items-center p-3 pt-0">
          <button className="w-8 h-8 rounded-full border border-borderGray flex items-center justify-center text-tertiaryText hover:bg-bgLight transition-colors bg-white">
            <Plus size={16} />
          </button>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-full border border-borderGray flex items-center justify-center text-tertiaryText hover:bg-bgLight transition-colors bg-white">
              <Paperclip size={16} />
            </button>
            <button
              onClick={handleSend}
              disabled={disabled || !val.trim()}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${val.trim() && !disabled ? 'bg-green-600 text-white shadow-md hover:bg-green-700' : 'bg-tertiaryText text-white'}`}
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
