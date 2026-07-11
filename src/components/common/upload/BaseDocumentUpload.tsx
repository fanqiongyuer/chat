import React, { useMemo, useState } from 'react';
import classNames from 'classnames';
import { Inbox, Paperclip, X } from 'lucide-react';
import { BaseUpload } from './BaseUpload';
import styles from './BaseDocumentUpload.module.css';

const DEFAULT_ACCEPT = '.pdf,.doc,.docx,.txt,.md,.csv';
const DEFAULT_MAX_SIZE = 20 * 1024 * 1024;
const DEFAULT_MAX_COUNT = 5;

export interface BaseDocumentUploadProps {
  value?: File[];
  defaultValue?: File[];
  onChange?: (files: File[]) => void;
  onError?: (error: Error) => void;
  accept?: string;
  maxSize?: number;
  maxCount?: number;
  disabled?: boolean;
  className?: string;
  uploadTitle?: React.ReactNode;
  uploadDescription?: React.ReactNode;
  uploadIcon?: React.ReactNode;
}

const fileEquals = (a: File, b: File) =>
  a.name === b.name &&
  a.size === b.size &&
  a.lastModified === b.lastModified &&
  a.type === b.type;

const bytesToReadable = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const BaseDocumentUpload = React.forwardRef<HTMLDivElement, BaseDocumentUploadProps>(
  (
    {
      value,
      defaultValue = [],
      onChange,
      onError,
      accept = DEFAULT_ACCEPT,
      maxSize = DEFAULT_MAX_SIZE,
      maxCount = DEFAULT_MAX_COUNT,
      disabled = false,
      className,
      uploadTitle = '点击或拖拽文件到此上传',
      uploadDescription = `支持单文件或批量上传，单次最多 ${DEFAULT_MAX_COUNT} 个，单个文件不超过 20MB`,
      uploadIcon,
    },
    ref
  ) => {
    const [innerFiles, setInnerFiles] = useState<File[]>(defaultValue);
    const isControlled = value !== undefined;

    const selectedFiles = useMemo(() => (isControlled ? value : innerFiles) ?? [], [
      innerFiles,
      isControlled,
      value,
    ]);

    const updateFiles = (nextFiles: File[]) => {
      if (!isControlled) {
        setInnerFiles(nextFiles);
      }
      onChange?.(nextFiles);
    };

    const handleUploadChange = (files: FileList) => {
      const incomingFiles = Array.from(files);
      const mergedFiles = [...selectedFiles];

      incomingFiles.forEach((file) => {
        const exists = mergedFiles.some((current) => fileEquals(current, file));
        if (!exists) {
          mergedFiles.push(file);
        }
      });

      if (mergedFiles.length > maxCount) {
        onError?.(new Error(`最多上传 ${maxCount} 个文件，请删除后再继续添加`));
        return;
      }

      updateFiles(mergedFiles);
    };

    const handleRemove = (targetFile: File) => {
      updateFiles(selectedFiles.filter((file) => !fileEquals(file, targetFile)));
    };

    return (
      <div className={classNames(styles.wrapper, className)}>
        <BaseUpload
          ref={ref}
          accept={accept}
          multiple
          disabled={disabled}
          maxSize={maxSize}
          maxCount={maxCount}
          onChange={handleUploadChange}
          onError={onError}
        >
          <div className={styles.uploadContent}>
            {uploadIcon ?? <Inbox size={30} strokeWidth={2.2} className={styles.uploadIcon} />}
            <div className={styles.uploadTitle}>{uploadTitle}</div>
            <div className={styles.uploadDescription}>{uploadDescription}</div>
          </div>
        </BaseUpload>

        {selectedFiles.length > 0 && (
          <div className={styles.fileList}>
            {selectedFiles.map((file, index) => (
              <div key={`${file.name}-${file.lastModified}-${index}`} className={styles.fileItem}>
                <Paperclip size={14} className={styles.fileItemIcon} />
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>{bytesToReadable(file.size)}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(file)}
                  className={styles.removeButton}
                  aria-label="移除文件"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

BaseDocumentUpload.displayName = 'BaseDocumentUpload';
