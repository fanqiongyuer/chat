import React from 'react';

/**
 * BaseButton 组件Props类型定义
 * 支持完整的兼容层，涵盖各种历史传参方式
 */
export interface BaseButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'size'> {
  // 基础配置
  buttonType?: 'primary' | 'secondary' | 'ghost' | 'danger';
  type?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  
  // 加载状态（兼容旧API: loading）
  isLoading?: boolean;
  loading?: boolean; // @deprecated 使用 isLoading 代替
  
  // 禁用状态
  disabled?: boolean;
  
  // 内容
  children?: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  
  // 样式
  className?: string;
  fullWidth?: boolean;
  
  // 圆角度
  rounded?: 'square' | 'small' | 'medium' | 'large' | 'full';
  
  // 点击事件
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}
