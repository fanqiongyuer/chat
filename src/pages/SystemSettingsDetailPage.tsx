import React, { useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Menu, KeyRound, Upload } from 'lucide-react';
import { type LayoutOutletContext } from '../components/Layout';
import { BaseButton, BaseInput, BaseModal, BaseSelect, BaseToggle } from '@/components';

type SettingsTab = 'general' | 'ai-model';

interface SettingsState {
  // 通用设置
  desktopNotification: boolean;
  soundNotification: boolean;
  emailNotification: boolean;
  avatarFileName: string;

  // AI 模型配置
  defaultModel: string;
  temperature: string;
  maxContextLength: string;
  streamOutput: boolean;
  topP: string;
  frequencyPenalty: string;
}

const tabOptions: Array<{ label: string; value: SettingsTab }> = [
  { label: '通用设置', value: 'general' },
  { label: 'AI 模型配置', value: 'ai-model' },
];

const modelOptions = [
  { label: 'GPT-4o', value: 'gpt-4o' },
  { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
  { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
  { label: 'Claude 3.5 Sonnet', value: 'claude-3.5-sonnet' },
  { label: 'Claude 3 Opus', value: 'claude-3-opus' },
  { label: 'DeepSeek V3', value: 'deepseek-v3' },
];

const contextLengthOptions = [
  { label: '4,096 tokens', value: '4096' },
  { label: '8,192 tokens', value: '8192' },
  { label: '16,384 tokens', value: '16384' },
  { label: '32,768 tokens', value: '32768' },
  { label: '128,000 tokens', value: '128000' },
];

const initialSettings: SettingsState = {
  desktopNotification: true,
  soundNotification: false,
  emailNotification: true,
  avatarFileName: '未上传新头像',

  defaultModel: 'gpt-4o',
  temperature: '0.7',
  maxContextLength: '8192',
  streamOutput: true,
  topP: '1.0',
  frequencyPenalty: '0',
};

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div className="min-w-0 flex-1">
        <div className="text-sm text-[var(--color-text-primary)]">{label}</div>
        {description && (
          <div className="mt-1 text-xs text-[var(--color-text-tertiary)]">{description}</div>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="pb-2 text-sm font-medium text-[var(--color-text-primary)]">{children}</h3>;
}

export default function SystemSettingsDetailPage() {
  const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<LayoutOutletContext>();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState<SettingsState>(initialSettings);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmitPassword =
    oldPassword.trim().length > 0 &&
    newPassword.trim().length > 0 &&
    confirmPassword.trim().length > 0 &&
    !passwordMismatch;

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleAvatarUploadClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    updateSetting('avatarFileName', file.name);
  };

  const renderGeneral = () => (
    <div className="space-y-6">
      <div>
        <SectionTitle>账户</SectionTitle>
        <div className="rounded-lg bg-[var(--color-surface)]">
          <div className="px-0">
            <SettingRow label="修改密码" description="定期修改密码可提升账户安全性">
              <BaseButton
                type="secondary"
                size="small"
                rounded="large"
                onClick={() => setShowPasswordModal(true)}
              >
                <KeyRound size={14} />
                修改
              </BaseButton>
            </SettingRow>
            <SettingRow label="更换头像" description="上传新的个人头像（支持 PNG/JPG）">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-xs text-[var(--color-primary)]">
                  研
                </div>
                <BaseButton
                  type="secondary"
                  size="small"
                  rounded="large"
                  onClick={handleAvatarUploadClick}
                >
                  <Upload size={14} />
                  上传
                </BaseButton>
              </div>
            </SettingRow>
          </div>
          <div className="border-t border-[var(--color-line-subtle)] px-0 py-3">
            <div className="text-xs text-[var(--color-text-tertiary)]">
              当前头像文件：{settings.avatarFileName}
            </div>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleAvatarFileChange}
          />
        </div>
      </div>

      <div>
        <SectionTitle>通知设置</SectionTitle>
        <div className="rounded-lg bg-[var(--color-surface)]">
          <div className="px-0">
            <SettingRow label="桌面通知" description="任务完成后显示桌面通知">
              <BaseToggle
                checked={settings.desktopNotification}
                onChange={(v) => updateSetting('desktopNotification', v)}
                size="small"
              />
            </SettingRow>
            <SettingRow label="声音提醒" description="收到新消息时播放提示音">
              <BaseToggle
                checked={settings.soundNotification}
                onChange={(v) => updateSetting('soundNotification', v)}
                size="small"
              />
            </SettingRow>
            <SettingRow label="邮件通知" description="关键事件通过邮件通知">
              <BaseToggle
                checked={settings.emailNotification}
                onChange={(v) => updateSetting('emailNotification', v)}
                size="small"
              />
            </SettingRow>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAiModel = () => (
    <div className="space-y-6">
      <div>
        <SectionTitle>模型选择</SectionTitle>
        <div className="rounded-lg bg-[var(--color-surface)]">
          <div className="px-0">
            <SettingRow label="默认模型" description="新建对话时使用的默认 AI 模型">
              <BaseSelect
                options={modelOptions}
                value={settings.defaultModel}
                onChange={(v) => updateSetting('defaultModel', String(v))}
                size="small"
              />
            </SettingRow>
            <SettingRow label="最大上下文长度" description="对话中保留的最大 token 数量">
              <BaseSelect
                options={contextLengthOptions}
                value={settings.maxContextLength}
                onChange={(v) => updateSetting('maxContextLength', String(v))}
                size="small"
              />
            </SettingRow>
            <SettingRow label="流式输出" description="逐字展示模型回复内容">
              <BaseToggle
                checked={settings.streamOutput}
                onChange={(v) => updateSetting('streamOutput', v)}
                size="small"
              />
            </SettingRow>
          </div>
        </div>
      </div>

      <div>
        <SectionTitle>模型参数</SectionTitle>
        <div className="rounded-lg bg-[var(--color-surface)]">
          <div className="px-0">
            <SettingRow label="温度 (Temperature)" description="值越高，回复越有发散性">
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => updateSetting('temperature', e.target.value)}
                  className="h-1.5 w-24 appearance-none rounded-full bg-[var(--color-gray-2)] accent-[var(--color-primary)]"
                />
                <span className="w-8 text-right text-sm text-[var(--color-text-secondary)]">
                  {Number(settings.temperature).toFixed(1)}
                </span>
              </div>
            </SettingRow>
            <SettingRow label="Top P" description="控制候选 token 的概率范围">
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.topP}
                  onChange={(e) => updateSetting('topP', e.target.value)}
                  className="h-1.5 w-24 appearance-none rounded-full bg-[var(--color-gray-2)] accent-[var(--color-primary)]"
                />
                <span className="w-8 text-right text-sm text-[var(--color-text-secondary)]">
                  {Number(settings.topP).toFixed(2)}
                </span>
              </div>
            </SettingRow>
            <SettingRow label="频率惩罚" description="减轻重复词汇与句式的出现">
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.frequencyPenalty}
                  onChange={(e) => updateSetting('frequencyPenalty', e.target.value)}
                  className="h-1.5 w-24 appearance-none rounded-full bg-[var(--color-gray-2)] accent-[var(--color-primary)]"
                />
                <span className="w-8 text-right text-sm text-[var(--color-text-secondary)]">
                  {Number(settings.frequencyPenalty).toFixed(1)}
                </span>
              </div>
            </SettingRow>
          </div>
        </div>
      </div>
    </div>
  );

  const tabContentMap: Record<SettingsTab, () => React.ReactNode> = {
    general: renderGeneral,
    'ai-model': renderAiModel,
  };

  return (
    <div className="flex h-full w-full flex-col bg-white">
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
          <h1 className="text-xl font-medium text-primaryText">系统设置</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-12 pt-4 md:px-8 lg:px-10 md:pb-12 md:pt-6">
        <div className="w-full py-0">
          <div className="mb-6 border-b border-[var(--color-line-subtle)]">
            <div className="flex items-center gap-6">
              {tabOptions.map((tab) => {
                const isActive = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setActiveTab(tab.value)}
                    className={`-mb-px border-b-2 pb-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                        : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
          {tabContentMap[activeTab]?.()}
        </div>
      </div>

      <BaseModal
        visible={showPasswordModal}
        title="修改密码"
        onClose={closePasswordModal}
        footer={
          <>
            <BaseButton type="secondary" size="medium" rounded="large" onClick={closePasswordModal}>
              取消
            </BaseButton>
            <BaseButton
              type="primary"
              size="medium"
              rounded="large"
              disabled={!canSubmitPassword}
              onClick={closePasswordModal}
            >
              保存
            </BaseButton>
          </>
        }
      >
        <div className="space-y-4">
          <BaseInput
            label="当前密码"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="请输入当前密码"
            size="medium"
          />
          <BaseInput
            label="新密码"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="请输入新密码"
            size="medium"
          />
          <BaseInput
            label="确认新密码"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="请再次输入新密码"
            size="medium"
            error={passwordMismatch}
            helperText={passwordMismatch ? '两次输入的新密码不一致' : undefined}
          />
        </div>
      </BaseModal>
    </div>
  );
}
