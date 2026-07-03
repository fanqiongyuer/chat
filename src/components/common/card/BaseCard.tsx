import React from 'react';
import styles from './BaseCard.module.css';
import classNames from 'classnames';

export interface BaseCardProps {
  title?: React.ReactNode;
  extra?: React.ReactNode;
  children?: React.ReactNode;
  hoverable?: boolean;
  loading?: boolean;
  bordered?: boolean;
  className?: string;
  bodyClassName?: string;
  onClick?: () => void;
}

export const BaseCard: React.FC<BaseCardProps> = ({
  title,
  extra,
  children,
  hoverable = false,
  loading = false,
  bordered = true,
  className,
  bodyClassName,
  onClick,
}) => {
  return (
    <div
      className={classNames(
        styles.card,
        {
          [styles.cardHoverable]: hoverable,
          [styles.cardLoading]: loading,
          [styles.cardBordered]: bordered,
        },
        className
      )}
      onClick={onClick}
    >
      {(title || extra) && (
        <div className={styles.cardHeader}>
          {title && <h3 className={styles.cardTitle}>{title}</h3>}
          {extra && <div className={styles.cardExtra}>{extra}</div>}
        </div>
      )}

      <div className={classNames(styles.cardBody, bodyClassName)}>
        {children}
      </div>
    </div>
  );
};

BaseCard.displayName = 'BaseCard';
