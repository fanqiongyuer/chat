import React, { useCallback, useState, useRef, useMemo } from 'react';
import { BaseInputProps } from './BaseInput.types';
import styles from './BaseInput.module.css';
import classNames from 'classnames';

/**
 * BaseInput - 通用输入框组件
 * 
 * 特性：
 * - 支持前后缀和图标
 * - 自动清空功能
 * - 错误状态显示
 * - 可选标签和辅助文字
 */
export const BaseInput = React.forwardRef<HTMLInputElement, BaseInputProps>(
  (
    {
      // 基础配置
      type = 'text',
      placeholder,
      value,
      defaultValue,

      // 状态
      disabled = false,
      readOnly = false,
      error = false,

      // 大小
      size = 'medium',

      // 前后缀
      prefix,
      suffix,
      prefixIcon,
      suffixIcon,

      // 事件
      onChange,
      onFocus,
      onBlur,
      onClear,

      // 样式
      className,
      containerClassName,
      clearable = false,

      // 标签
      label,
      helperText,

      ...rest
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const internalRef = useRef<HTMLInputElement>(null);

    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      [onFocus]
    );

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        onBlur?.(e);
      },
      [onBlur]
    );

    const handleClear = useCallback(() => {
      if (internalRef.current) {
        internalRef.current.value = '';
        internalRef.current.focus();
        onClear?.();

        // 触发onChange事件
        const event = new Event('change', { bubbles: true });
        internalRef.current.dispatchEvent(event);
      }
    }, [onClear]);

    const showClearButton = useMemo(
      () => clearable && isFocused && ((value as string)?.length ?? 0) > 0,
      [clearable, isFocused, value]
    );

    const containerClass = useMemo(
      () =>
        classNames(
          styles.inputWrapper,
          styles[`input-${size}`],
          {
            [styles['input-focused']]: isFocused,
            [styles['input-error']]: error,
            [styles['input-disabled']]: disabled,
          },
          containerClassName
        ),
      [size, isFocused, error, disabled, containerClassName]
    );

    const inputClass = useMemo(
      () =>
        classNames(
          styles.input,
          {
            [styles['input-with-prefix']]: prefix || prefixIcon,
            [styles['input-with-suffix']]: suffix || suffixIcon,
          },
          className
        ),
      [prefix, prefixIcon, suffix, suffixIcon, className]
    );

    return (
      <div className={styles.inputContainer}>
        {label && <label className={styles.inputLabel}>{label}</label>}

        <div className={containerClass}>
          {/* 前缀 */}
          {(prefix || prefixIcon) && (
            <div className={styles.inputPrefix}>{prefix || prefixIcon}</div>
          )}

          {/* 输入框 */}
          <input
            ref={ref || internalRef}
            type={type}
            placeholder={placeholder}
            value={value}
            defaultValue={defaultValue}
            disabled={disabled}
            readOnly={readOnly}
            className={inputClass}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={onChange}
            {...rest}
          />

          {/* 后缀 */}
          <div className={styles.inputSuffix}>
            {showClearButton && (
              <button
                type="button"
                className={styles.clearButton}
                onClick={handleClear}
                aria-label="清空"
              >
                ✕
              </button>
            )}
            {suffix || suffixIcon}
          </div>
        </div>

        {/* 辅助文字 */}
        {helperText && (
          <div className={classNames(styles.helperText, { [styles.helperError]: error })}>
            {helperText}
          </div>
        )}
      </div>
    );
  }
);

BaseInput.displayName = 'BaseInput';
