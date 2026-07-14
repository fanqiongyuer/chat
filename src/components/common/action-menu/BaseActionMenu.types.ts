import React from 'react';

export interface BaseActionMenuItem {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  active?: boolean;
}

export interface BaseActionMenuProps {
  trigger: React.ReactNode;
  items: BaseActionMenuItem[];
  footerItems?: BaseActionMenuItem[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onTriggerClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onItemClick?: (item: BaseActionMenuItem, event: React.MouseEvent<HTMLButtonElement>) => void;
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
  width?: number | string;
  /** When true, the menu panel is rendered via Portal into document.body to escape overflow clipping */
  portal?: boolean;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  listClassName?: string;
  footerClassName?: string;
}