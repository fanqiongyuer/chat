import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  portal = false,
  className,
  triggerClassName,
  menuClassName,
  listClassName,
  footerClassName,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [portalStyle, setPortalStyle] = useState<React.CSSProperties>({});

  // Compute portal position when open changes
  useEffect(() => {
    if (!open || !portal || !wrapperRef.current) return;

    const rect = wrapperRef.current.getBoundingClientRect();
    const isEnd = placement === 'bottom-end' || placement === 'top-end';
    const isAbove = placement === 'top-start' || placement === 'top-end';

    const next: React.CSSProperties = {
      position: 'fixed',
      left: isEnd ? rect.right : rect.left,
      top: isAbove ? rect.top : rect.bottom,
      transform: isEnd ? 'translateX(-100%)' : 'none',
    };

    setPortalStyle(next);
  }, [open, portal, placement]);

  // Adjust portal position after mount (to account for panel height when above)
  useEffect(() => {
    if (!open || !portal || !panelRef.current) return;

    const isAbove = placement === 'top-start' || placement === 'top-end';
    if (!isAbove) return;

    const panelHeight = panelRef.current.offsetHeight;
    setPortalStyle((prev) => ({
      ...prev,
      top: (prev.top as number) - panelHeight - 8,
    }));
  }, [open, portal, placement]);

  useEffect(() => {
    if (!open || !onOpenChange) return;

    const handleOutsideClick = (event: MouseEvent) => {
      // When using portal, also check the panel element
      const target = event.target as Node;
      if (portal) {
        if (
          wrapperRef.current?.contains(target) ||
          panelRef.current?.contains(target)
        ) {
          return;
        }
      } else {
        if (wrapperRef.current?.contains(target)) {
          return;
        }
      }
      onOpenChange(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [open, onOpenChange, portal]);

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

  const menuPanel = open ? (
    <div
      ref={panelRef}
      className={classNames(
        styles.menuPanel,
        (placement === 'bottom-end' || placement === 'top-end') ? styles.alignEnd : styles.alignStart,
        (placement === 'top-start' || placement === 'top-end') && styles.above,
        menuClassName
      )}
      style={portal ? { ...portalStyle, ...menuStyle } : menuStyle}
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
  ) : null;

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

      {portal ? menuPanel && createPortal(menuPanel, document.body) : menuPanel}
    </div>
  );
};

BaseActionMenu.displayName = 'BaseActionMenu';
