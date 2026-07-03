import React from 'react';
import styles from './BaseEmpty.module.css';

export interface BaseEmptyProps {
  description?: React.ReactNode;
  image?: React.ReactNode;
  children?: React.ReactNode;
}

export const BaseEmpty: React.FC<BaseEmptyProps> = ({
  description = '暂无数据',
  image,
  children,
}) => {
  return (
    <div className={styles.empty}>
      {image && <div className={styles.emptyImage}>{image}</div>}
      {description && <p className={styles.emptyDescription}>{description}</p>}
      {children}
    </div>
  );
};

BaseEmpty.displayName = 'BaseEmpty';
