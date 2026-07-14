import React, { useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { type LayoutOutletContext } from '../components/Layout';
import { BaseButton, BaseInput, BaseModal } from '../components';

interface SettingsState {
  avatarFileName: string;
}

const initialSettings: SettingsState = {
  avatarFileName: '未上传新头像',
};

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-6 py-5">
      <div className="min-w-0 pr-4">
        <div className="text-sm font-medium text-[var(--color-text-primary)]">{label}</div>
        {description && (
          <div className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-tertiary)]">{description}</div>
        )}
      </div>
      <div className="flex shrink-0 items-center justify-end">{children}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 mt-4 text-base font-semibold text-[var(--color-text-primary)]">{children}</h3>;
}

export default function SystemSettingsDetailPage() {
  const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<LayoutOutletContext>();
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
                  上传
                </BaseButton>
              </div>
            </SettingRow>
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

    </div>
  );


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
          <div className="flex items-center gap-2 text-sm">
            <span className="text-tertiaryText">系统设置</span>
            <span className="text-tertiaryText">/</span>
            <span className="font-medium text-primaryText">更多设置</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-12 pt-4 md:px-8 lg:px-10 md:pb-12 md:pt-6">
        <div className="mx-auto max-w-[720px] py-0">
          {renderGeneral()}
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