import React, { useCallback, useMemo } from 'react';
import { BaseToggleProps, BaseToggleSize } from './BaseToggle.types';
import styles from './BaseToggle.module.css';
import classNames from 'classnames';

export const BaseToggle: React.FC<BaseToggleProps> = ({
  checked,
  defaultChecked = false,
  size = 'medium',
  disabled = false,
  onChange,
  className,
  ...rest
}) => {
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internalChecked;

  const handleClick = useCallback(() => {
    if (disabled) return;
    const next = !isChecked;
    if (!isControlled) {
      setInternalChecked(next);
    }
    onChange?.(next);
  }, [isChecked, isControlled, disabled, onChange]);

  const toggleClass = useMemo(
    () =>
      classNames(
        styles.toggle,
        styles[`toggle${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof styles],
        isChecked ? styles.toggleOn : styles.toggleOff,
        disabled && styles.toggleDisabled,
        className
      ),
    [size, isChecked, disabled, className]
  );

  const thumbClass = useMemo(
    () =>
      classNames(
        styles.thumb,
        styles[`thumb${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof styles],
        styles[`thumb${isChecked ? 'On' : 'Off'}${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof styles]
      ),
    [size, isChecked]
  );

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      aria-label={rest['aria-label']}
      className={toggleClass}
      onClick={handleClick}
      disabled={disabled}
    >
      <span className={thumbClass} />
    </button>
  );
};

BaseToggle.displayName = 'BaseToggle';
