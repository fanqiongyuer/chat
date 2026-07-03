import React, { useMemo } from 'react';
import { BaseButtonProps } from './BaseButton.types';
import styles from './BaseButton.module.css';
import classNames from 'classnames';

/**
 * BaseButton - 通用按钮组件
 * 
 * 特性：
 * - 完全兼容旧项目中的各种传参方式
 * - 自动适配 loading/isLoading 状态
 * - 支持多种类型和尺寸
 * - Props 传参优先级明确
 * 
 * 使用场景：
 * 1. 新页面：使用 type + isLoading + onClick
 * 2. 迁移旧页面：保持原有传参，组件自动兼容
 */
export const BaseButton = React.forwardRef<HTMLButtonElement, BaseButtonProps>(
  (
    {
      // 基础配置
      type = 'primary',
      size = 'medium',
      
      // 加载状态（兼容旧API）
      isLoading,
      loading,
      
      // 禁用状态
      disabled = false,
      
      // 内容
      children,
      icon,
      iconPosition = 'left',
      
      // 样式
      className,
      fullWidth = false,
      rounded = 'medium',
      
      // 事件
      onClick,
      
      ...rest
    },
    ref
  ) => {
    // 兼容旧API：优先 isLoading，降级到 loading
    const finalLoading = useMemo(() => isLoading ?? loading ?? false, [isLoading, loading]);
    
    // 确定最终的禁用状态
    const finalDisabled = disabled || finalLoading;

    // 计算className
    const buttonClass = useMemo(
      () =>
        classNames(
          styles.btn,
          styles[`btn-${type}`],
          styles[`btn-${size}`],
          styles[`rounded-${rounded}`],
          {
            [styles['btn-loading']]: finalLoading,
            [styles['btn-full-width']]: fullWidth,
            [styles['btn-disabled']]: finalDisabled,
          },
          className
        ),
      [type, size, rounded, finalLoading, fullWidth, finalDisabled, className]
    );

    // 渲染内容
    const renderContent = useMemo(() => {
      if (finalLoading) {
        return (
          <>
            <span className={styles['loading-spinner']} />
            <span>{children}</span>
          </>
        );
      }

      if (!icon) {
        return children;
      }

      return (
        <>
          {iconPosition === 'left' && (
            <span className={styles['btn-icon']}>{icon}</span>
          )}
          {children && <span>{children}</span>}
          {iconPosition === 'right' && (
            <span className={styles['btn-icon']}>{icon}</span>
          )}
        </>
      );
    }, [finalLoading, icon, iconPosition, children]);

    return (
      <button
        ref={ref}
        className={buttonClass}
        disabled={finalDisabled}
        onClick={onClick}
        {...rest}
      >
        {renderContent}
      </button>
    );
  }
);

BaseButton.displayName = 'BaseButton';
