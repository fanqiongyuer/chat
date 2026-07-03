import React, { useCallback, useMemo } from 'react';
import { BaseSelectProps, BaseSelectOption } from './BaseSelect.types';
import styles from './BaseSelect.module.css';
import classNames from 'classnames';

export const BaseSelect = React.forwardRef<HTMLSelectElement, BaseSelectProps>(
  (
    {
      options = [],
      value,
      defaultValue,
      placeholder,
      disabled = false,
      error = false,
      size = 'medium',
      clearable = false,
      label,
      helperText,
      onChange,
      className,
      ...rest
    },
    ref
  ) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = e.target.value;
        if (newValue === '') {
          onChange?.('');
        } else {
          const selectedOption = options.find(opt => String(opt.value) === newValue);
          onChange?.(selectedOption?.value ?? newValue);
        }
      },
      [options, onChange]
    );

    const selectClass = useMemo(
      () =>
        classNames(
          styles.select,
          styles[`select-${size}`],
          {
            [styles['select-error']]: error,
            [styles['select-disabled']]: disabled,
          },
          className
        ),
      [size, error, disabled, className]
    );

    return (
      <div className={styles.selectContainer}>
        {label && <label className={styles.selectLabel}>{label}</label>}

        <select
          ref={ref}
          className={selectClass}
          value={value ?? defaultValue ?? ''}
          disabled={disabled}
          onChange={handleChange}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(option => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        {helperText && (
          <div className={classNames(styles.helperText, { [styles.helperError]: error })}>
            {helperText}
          </div>
        )}
      </div>
    );
  }
);

BaseSelect.displayName = 'BaseSelect';
