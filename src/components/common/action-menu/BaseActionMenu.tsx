import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import classNames from 'classnames';
import styles from './BaseActionMenu.module.css';
import type { BaseActionMenuItem, BaseActionMenuProps } from './BaseActionMenu.types';

export const BaseActionMenu: React.FC<BaseActionMenuProps> = ({
  trigger,
  items,
  footerItems = [],
  open = false,
  onOpenChange,
  onTriggerClick,
  onItemClick,
  placement = 'bottom-start',
  width,
  className,
  triggerClassName,
  menuClassName,
  listClassName,
  footerClassName,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !onOpenChange) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [open, onOpenChange]);

  const handleTriggerClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onTriggerClick?.(event);
      onOpenChange?.(!open);
    },
    [onOpenChange, onTriggerClick, open]
  );

  const menuStyle = useMemo(
    () => (width ? { width: typeof width === 'number' ? `${width}px` : width } : undefined),
    [width]
  );

  const renderMenuItem = useCallback(
    (item: BaseActionMenuItem) => (
      <button
        key={item.key}
        type="button"
        role="menuitem"
        className={classNames(styles.menuItem, {
          [styles.menuItemActive]: item.active,
          [styles.menuItemDanger]: item.danger,
          [styles.menuItemDisabled]: item.disabled,
        })}
        onClick={(event) => onItemClick?.(item, event)}
        disabled={item.disabled}
      >
        {item.icon && <span className={styles.menuItemIcon}>{item.icon}</span>}
        <span className={styles.menuItemLabel}>{item.label}</span>
      </button>
    ),
    [onItemClick]
  );

  return (
    <div ref={wrapperRef} className={classNames(styles.menuWrapper, className)}>
      <button
        type="button"
        className={classNames(styles.triggerButton, triggerClassName)}
        onClick={handleTriggerClick}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {trigger}
      </button>

      {open && (
        <div
          className={classNames(
            styles.menuPanel,
            (placement === 'bottom-end' || placement === 'top-end') ? styles.alignEnd : styles.alignStart,
            (placement === 'top-start' || placement === 'top-end') && styles.above,
            menuClassName
          )}
          style={menuStyle}
          role="menu"
        >
          <div className={classNames(styles.menuList, listClassName)}>
            {items.map(renderMenuItem)}
          </div>
          {footerItems.length > 0 && (
            <div className={classNames(styles.menuFooter, footerClassName)}>
              {footerItems.map(renderMenuItem)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

BaseActionMenu.displayName = 'BaseActionMenu';