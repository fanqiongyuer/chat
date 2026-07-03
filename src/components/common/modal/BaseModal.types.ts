import React from 'react';

/**
 * BaseModal 组件Props类型定义
 * 支持完整的兼容层，涵盖各种历史传参方式
 */
export interface BaseModalProps {
  // 显隐状态控制（优先级：visible > open > show）
  visible?: boolean;
  open?: boolean; // @deprecated 使用 visible 代替
  show?: boolean; // @deprecated 使用 visible 代替

  // 基础配置
  title?: React.ReactNode;
  width?: string | number;
  centered?: boolean;
  destroyOnClose?: boolean;
  mask?: boolean;
  maskClosable?: boolean;

  // 按钮配置
  okText?: string;
  cancelText?: string;
  confirmLoading?: boolean;
  okButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  cancelButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;

  // 事件（新API）
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  onClose?: () => void;

  // 兼容旧API
  onOk?: () => void | Promise<void>;
  onDismiss?: () => void;

  // 内容
  children?: React.ReactNode;
  footer?: React.ReactNode | null; // null 隐藏footer

  // 样式
  className?: string;
  bodyClassName?: string;
}
