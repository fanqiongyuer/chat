import React from 'react';

export interface BaseActionMenuItem {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

export interface BaseActionMenuProps {
  trigger: React.ReactNode;
  items: BaseActionMenuItem[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onTriggerClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onItemClick?: (item: BaseActionMenuItem, event: React.MouseEvent<HTMLButtonElement>) => void;
  placement?: 'bottom-start' | 'bottom-end';
  width?: number | string;
  className?: string;
  menuClassName?: string;
}
