import React, { useState } from 'react';
import { BaseModal } from '../components';
import { Check, Copy } from 'lucide-react';

interface ShareModalProps {
  visible: boolean;
  title: string;
  description?: string;
  shareUrl: string;
  onClose: () => void;
}

export default function ShareModal({
  visible,
  title,
  description = '任何获得链接的实验室成员均可以查看你分享的内容，请检查是否包含敏感/隐私内容。',
  shareUrl,
  onClose,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <BaseModal
      visible={visible}
      title={title}
      width={450}
      onCancel={onClose}
      footer={null}
    >
      <div className="space-y-4">
        <p className="m-0 text-[14px] leading-6 text-primaryText">
          {description}
        </p>
        <div className="flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-[#f8fafc] p-1.5 pl-4">
          <span className="min-w-0 flex-1 truncate text-[14px] text-secondaryText">
            {shareUrl}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? '已复制' : '复制'}</span>
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
