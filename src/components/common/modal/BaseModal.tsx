import React, { useCallback, useMemo } from 'react';
import { BaseModalProps } from './BaseModal.types';
import { BaseButton } from '../button';
import styles from './BaseModal.module.css';
import classNames from 'classnames';

/**
 * BaseModal - 通用弹窗组件
 * 
 * 特性：
 * - 完全兼容旧项目中的 open/visible/show 多种传参方式
 * - 自动适配 onOk/onConfirm/onClose/onCancel 各种回调
 * - Props 传参优先级明确，避免冲突
 * - 支持自定义footer或隐藏
 * 
 * 使用场景：
 * 1. 新页面：使用 visible + onConfirm + onCancel
 * 2. 迁移旧页面：保持原有传参，组件自动兼容
 */
export const BaseModal: React.FC<BaseModalProps> = ({
  // 显隐状态处理（兼容多种传参）
  visible,
  open = visible,
  show = open,

  // 基础配置
  title,
  width = 520,
  centered = true,
  destroyOnClose = false,
  mask = true,
  maskClosable = true,

  // 按钮配置
  okText = '确认',
  cancelText = '取消',
  confirmLoading = false,
  okButtonProps,
  cancelButtonProps,

  // 事件（兼容旧/新API）
  onConfirm,
  onCancel,
  onClose,
  onOk,
  onDismiss,

  // 内容
  children,
  footer,

  // 样式
  className,
  bodyClassName,
}) => {
  // 确定最终的显隐状态
  const isVisible = useMemo(() => show ?? false, [show]);

  // 事件兼容处理：新API优先，降级到旧API
  const handleConfirm = useCallback(async () => {
    try {
      // 新API优先
      if (onConfirm) {
        await onConfirm();
      } else if (onOk) {
        // 降级到旧API
        await onOk();
      }
    } catch (error) {
      console.error('Modal confirm error:', error);
    }
  }, [onConfirm, onOk]);

  const handleCancel = useCallback(() => {
    // 新API优先
    if (onCancel) {
      onCancel();
    } else if (onClose) {
      // 降级到旧API
      onClose();
    } else if (onDismiss) {
      // 再降级
      onDismiss();
    }
  }, [onCancel, onClose, onDismiss]);

  // 处理遮罩点击
  const handleMaskClick = useCallback(() => {
    if (maskClosable) {
      handleCancel();
    }
  }, [maskClosable, handleCancel]);

  // 默认footer（支持自定义或隐藏）
  const defaultFooter = useMemo(() => {
    if (footer === null) return null; // 显式隐藏footer
    if (footer) return footer; // 自定义footer

    const { type: _cancelType, ...safeCancelButtonProps } = cancelButtonProps ?? {};
    const { type: _okType, ...safeOkButtonProps } = okButtonProps ?? {};

    return (
      <div className={styles.modalFooter}>
        <BaseButton
          type="secondary"
          size="medium"
          onClick={handleCancel}
          {...safeCancelButtonProps}
        >
          {cancelText}
        </BaseButton>
        <BaseButton
          type="primary"
          size="medium"
          isLoading={confirmLoading}
          onClick={handleConfirm}
          {...safeOkButtonProps}
        >
          {confirmLoading ? '加载中...' : okText}
        </BaseButton>
      </div>
    );
  }, [footer, okText, cancelText, confirmLoading, handleConfirm, handleCancel, okButtonProps, cancelButtonProps]);

  if (!isVisible && destroyOnClose) {
    return null;
  }

  return (
    <>
      {/* 遮罩层 */}
      {isVisible && mask && (
        <div
          className={styles.modalMask}
          onClick={handleMaskClick}
          role="presentation"
        />
      )}

      {/* 弹窗容器 */}
      {isVisible && (
        <div
          className={classNames(styles.modal, {
            [styles.centered]: centered,
          }, className)}
          style={{ width }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* 头部 */}
          {title && (
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle} id="modal-title">
                {title}
              </h2>
              <button
                className={styles.modalClose}
                onClick={handleCancel}
                aria-label="关闭"
                type="button"
              >
                ✕
              </button>
            </div>
          )}

          {/* 内容 */}
          <div className={classNames(styles.modalBody, bodyClassName)}>
            {children}
          </div>

          {/* 底部按钮 */}
          {defaultFooter}
        </div>
      )}
    </>
  );
};

BaseModal.displayName = 'BaseModal';
