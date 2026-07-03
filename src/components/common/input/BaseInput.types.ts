import React from 'react';

export interface BaseInputProps {
  // 基础配置
  type?: string;
  placeholder?: string;
  value?: string | number;
  defaultValue?: string | number;
  id?: string;
  name?: string;

  // 状态
  disabled?: boolean;
  readOnly?: boolean;
  error?: boolean;

  // 大小
  size?: 'small' | 'medium' | 'large';

  // 前后缀
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;

  // 事件
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onClear?: () => void;

  // 样式
  className?: string;
  containerClassName?: string;
  clearable?: boolean;

  // 标签
  label?: React.ReactNode;
  helperText?: React.ReactNode;

  // 其他原生属性
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  required?: boolean;
  tabIndex?: number;
  title?: string;
  autoFocus?: boolean;
}
