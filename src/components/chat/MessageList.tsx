import React, { useEffect, useRef, useMemo } from 'react';
import MessageItem from './MessageItem';
import ThinkingIndicator, { type StatusPhase, type SearchStep } from './ThinkingIndicator';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  statusPhase?: StatusPhase;
  searchSteps?: SearchStep[];
}

const MessageList = ({ messages, isTyping, statusPhase = 'thinking', searchSteps = [] }: MessageListProps) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isTyping]);

  // 优化：只在 messages 改变时重新渲染列表项
  const messageElements = useMemo(() => {
    return messages.map((msg, idx) => (
      <MessageItem key={`${idx}-${msg.role}`} msg={msg} />
    ));
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      {messageElements}
      {isTyping && (
        <ThinkingIndicator phase={statusPhase} searchSteps={searchSteps} />
      )}
      <div ref={endRef} />
    </div>
  );
};

export default React.memo(MessageList);
