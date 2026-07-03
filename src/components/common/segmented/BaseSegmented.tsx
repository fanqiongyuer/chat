import React, { useMemo } from 'react';
import classNames from 'classnames';
import type { BaseSegmentedProps, BaseSegmentedSize } from './BaseSegmented.types';
import styles from './BaseSegmented.module.css';

const sizeClassMap: Record<BaseSegmentedSize, string> = {
  small: styles.sizeSmall,
  middle: styles.sizeMiddle,
  large: styles.sizeLarge,
};

export const BaseSegmented: React.FC<BaseSegmentedProps> = ({
  options,
  value,
  defaultValue,
  onChange,
  size = 'middle',
  disabled = false,
  className,
}) => {
  const [internalValue, setInternalValue] = React.useState<string | number>(
    defaultValue ?? options[0]?.value ?? ''
  );

  const selectedValue = value ?? internalValue;

  const sizeClass = sizeClassMap[size];

  const handleClick = (optionValue: string | number) => {
    if (disabled) return;
    if (value === undefined) {
      setInternalValue(optionValue);
    }
    onChange?.(optionValue);
  };

  return (
    <div className={classNames(styles.container, sizeClass, className)}>
      {options.map((option) => {
        const isActive = selectedValue === option.value;
        return (
          <button
            key={option.value}
            type="button"
            className={classNames(
              styles.item,
              isActive && styles.itemActive,
              disabled && styles.itemDisabled
            )}
            onClick={() => handleClick(option.value)}
            disabled={disabled}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default BaseSegmented;
