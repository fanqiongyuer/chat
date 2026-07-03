import React, { useCallback, useMemo } from 'react';
import styles from './BasePagination.module.css';
import classNames from 'classnames';

export interface BasePaginationProps {
  current?: number;
  pageSize?: number;
  total?: number;
  onChange?: (page: number) => void;
  showSizeChanger?: boolean;
  pageSizeOptions?: number[];
  onShowSizeChange?: (current: number, pageSize: number) => void;
  disabled?: boolean;
  className?: string;
}

export const BasePagination: React.FC<BasePaginationProps> = ({
  current = 1,
  pageSize = 10,
  total = 0,
  onChange,
  showSizeChanger = false,
  pageSizeOptions = [10, 20, 50, 100],
  onShowSizeChange,
  disabled = false,
  className,
}) => {
  const totalPages = useMemo(() => Math.ceil(total / pageSize) || 1, [total, pageSize]);

  const handlePrev = useCallback(() => {
    if (current > 1) {
      onChange?.(current - 1);
    }
  }, [current, onChange]);

  const handleNext = useCallback(() => {
    if (current < totalPages) {
      onChange?.(current + 1);
    }
  }, [current, totalPages, onChange]);

  const handlePageSizeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newSize = Number(e.target.value);
      onShowSizeChange?.(1, newSize);
    },
    [onShowSizeChange]
  );

  return (
    <div className={classNames(styles.pagination, className)}>
      <button
        className={classNames(styles.btn, {
          [styles.btnDisabled]: disabled || current <= 1,
        })}
        onClick={handlePrev}
        disabled={disabled || current <= 1}
      >
        ← 上一页
      </button>

      <span className={styles.pageInfo}>
        第 {current} / {totalPages} 页，共 {total} 条
      </span>

      <button
        className={classNames(styles.btn, {
          [styles.btnDisabled]: disabled || current >= totalPages,
        })}
        onClick={handleNext}
        disabled={disabled || current >= totalPages}
      >
        下一页 →
      </button>

      {showSizeChanger && (
        <select
          className={styles.pageSizeSelect}
          value={pageSize}
          onChange={handlePageSizeChange}
          disabled={disabled}
        >
          {pageSizeOptions.map(size => (
            <option key={size} value={size}>
              {size} 条/页
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

BasePagination.displayName = 'BasePagination';
