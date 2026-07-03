import React from 'react';

export interface BaseSelectOption {
  label: React.ReactNode;
  value: string | number;
  disabled?: boolean;
}

export interface BaseSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'size'> {
  options?: BaseSelectOption[];
  value?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  size?: 'small' | 'medium' | 'large';
  clearable?: boolean;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  onChange?: (value: string | number) => void;
}
