import React from 'react';
import styles from './BaseTable.module.css';
import classNames from 'classnames';

export interface BaseTableColumn<T = any> {
  title: React.ReactNode;
  dataIndex: keyof T;
  key?: string;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (text: any, record: T, index: number) => React.ReactNode;
}

export interface BaseTableProps<T = any> {
  columns: BaseTableColumn<T>[];
  dataSource: T[];
  rowKey?: keyof T | string;
  loading?: boolean;
  pagination?: boolean;
  bordered?: boolean;
  striped?: boolean;
  className?: string;
  onRow?: (record: T, index: number) => React.HTMLAttributes<HTMLTableRowElement>;
}

export const BaseTable = React.forwardRef<HTMLDivElement, BaseTableProps>(
  (
    {
      columns,
      dataSource = [],
      rowKey = 'id',
      loading = false,
      pagination = false,
      bordered = true,
      striped = true,
      className,
      onRow,
    },
    ref
  ) => {
    const getRowKey = (record: any, index: number) => {
      if (typeof rowKey === 'string') {
        return record[rowKey] ?? index;
      }
      return index;
    };

    return (
      <div
        ref={ref}
        className={classNames(
          styles.tableWrapper,
          {
            [styles.tableLoading]: loading,
          },
          className
        )}
      >
        <table
          className={classNames(styles.table, {
            [styles.tableBordered]: bordered,
            [styles.tableStriped]: striped,
          })}
        >
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key || String(col.dataIndex)}
                  style={{
                    width: col.width,
                    textAlign: col.align,
                  }}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataSource.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={styles.tableEmpty}>
                  暂无数据
                </td>
              </tr>
            ) : (
              dataSource.map((record, index) => (
                <tr key={getRowKey(record, index)} {...(onRow?.(record, index) || {})}>
                  {columns.map(col => (
                    <td
                      key={col.key || String(col.dataIndex)}
                      style={{ textAlign: col.align }}
                    >
                      {col.render
                        ? col.render(record[col.dataIndex], record, index)
                        : record[col.dataIndex]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
        {loading && <div className={styles.loadingMask}>加载中...</div>}
      </div>
    );
  }
);

BaseTable.displayName = 'BaseTable';
