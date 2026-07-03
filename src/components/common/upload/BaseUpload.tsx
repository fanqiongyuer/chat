import React, { useCallback, useRef } from 'react';
import styles from './BaseUpload.module.css';
import classNames from 'classnames';

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
}

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
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);

    const handleFiles = useCallback(
      (files: FileList) => {
        if (maxSize) {
          for (let i = 0; i < files.length; i++) {
            if (files[i].size > maxSize) {
              onError?.(new Error(`文件大小超过限制`));
              return;
            }
          }
        }
        onChange?.(files);
      },
      [maxSize, onChange, onError]
    );

    const handleClick = () => {
      if (!disabled) {
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
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={disabled ? -1 : 0}
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
            <p>点击选择文件或拖拽到此</p>
          </div>
        )}
      </div>
    );
  }
);

BaseUpload.displayName = 'BaseUpload';
