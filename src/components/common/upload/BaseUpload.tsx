import React, { useCallback, useRef } from 'react';
import classNames from 'classnames';
import styles from './BaseUpload.module.css';

export interface BaseUploadProps {
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  onChange?: (files: FileList) => void;
  onError?: (error: Error) => void;
  maxSize?: number; // bytes
  children?: React.ReactNode;
  className?: string;
  dragable?: boolean;
  placeholderTitle?: React.ReactNode;
  placeholderDescription?: React.ReactNode;
  placeholderIcon?: React.ReactNode;
  maxCount?: number;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
};

export const BaseUpload = React.forwardRef<HTMLDivElement, BaseUploadProps>(
  (
    {
      accept,
      multiple = false,
      disabled = false,
      onChange,
      onError,
      maxSize,
      children,
      className,
      dragable = true,
      placeholderTitle,
      placeholderDescription,
      placeholderIcon,
      maxCount,
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);

    const handleFiles = useCallback(
      (files: FileList) => {
        if (maxCount && files.length > maxCount) {
          onError?.(new Error(`单次最多上传 ${maxCount} 个文件`));
          return;
        }

        if (maxSize) {
          for (let i = 0; i < files.length; i += 1) {
            if (files[i].size > maxSize) {
              onError?.(
                new Error(`文件“${files[i].name}”超过大小限制（${formatSize(maxSize)}）`)
              );
              return;
            }
          }
        }
        onChange?.(files);
      },
      [maxCount, maxSize, onChange, onError]
    );

    const handleClick = () => {
      if (!disabled) {
        inputRef.current?.click();
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) {
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        inputRef.current?.click();
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      if (dragable && !disabled) {
        e.preventDefault();
        setIsDragging(true);
      }
    };

    const handleDragLeave = () => {
      setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      if (dragable && !disabled) {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
          handleFiles(e.dataTransfer.files);
        }
      }
    };

    return (
      <div
        ref={ref}
        className={classNames(
          styles.upload,
          {
            [styles.uploadDragging]: isDragging,
            [styles.uploadDisabled]: disabled,
          },
          className
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleChange}
          className={styles.uploadInput}
        />
        {children || (
          <div className={styles.uploadPlaceholder}>
            <span className={styles.uploadIcon} aria-hidden>
              {placeholderIcon ?? (
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M24 8V29"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 16L24 8L32 16"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 27V35C10 37.2091 11.7909 39 14 39H34C36.2091 39 38 37.2091 38 35V27"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <div className={styles.uploadTitle}>{placeholderTitle ?? '点击或拖拽文件到此处上传'}</div>
            <div className={styles.uploadDescription}>
              {placeholderDescription ?? '支持单文件或批量上传'}
            </div>
          </div>
        )}
      </div>
    );
  }
);

BaseUpload.displayName = 'BaseUpload';
