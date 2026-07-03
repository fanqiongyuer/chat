import React from 'react';

export type BaseToggleSize = 'small' | 'medium';

export interface BaseToggleProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  /** 是否开启 */
  checked?: boolean;
  /** 默认是否开启 */
  defaultChecked?: boolean;
  /** 尺寸 */
  size?: BaseToggleSize;
  /** 是否禁用 */
  disabled?: boolean;
  /** 变化回调 */
  onChange?: (checked: boolean) => void;
  /** 自定义类名 */
  className?: string;
}
