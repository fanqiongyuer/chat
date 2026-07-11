/**
 * 公共组件库 - Common Components
 * 
 * 这是项目内部的通用组件库，专为提高开发效率而设计。
 * 所有组件都遵循统一的设计规范，支持向后兼容。
 * 
 * 使用指南：
 * 1. 所有组件都支持完整的props传参，参考各组件的 *.types.ts 文件
 * 2. 优先使用新API，旧API保持向后兼容
 * 3. 所有样式基于 Tailwind CSS 和 CSS Modules
 * 4. 欢迎新增组件，参考现有组件的结构
 */

// 表单组件
export { BaseButton } from './button';
export type { BaseButtonProps } from './button';

export { BaseInput } from './input';
export type { BaseInputProps } from './input';

export { BaseSelect } from './select';
export type { BaseSelectProps, BaseSelectOption } from './select';

export { BaseUpload, BaseDocumentUpload } from './upload';
export type { BaseUploadProps, BaseDocumentUploadProps } from './upload';

export { BaseActionMenu } from './action-menu';
export type { BaseActionMenuProps, BaseActionMenuItem } from './action-menu';

export { BaseSegmented } from './segmented';
export type { BaseSegmentedProps, BaseSegmentedOption, BaseSegmentedSize } from './segmented';

export { BaseToggle } from './toggle';
export type { BaseToggleProps, BaseToggleSize } from './toggle';

// 容器组件
export { BaseModal } from './modal';
export type { BaseModalProps } from './modal';

export { BaseCard } from './card';
export type { BaseCardProps } from './card';

// 数据展示组件
export { BaseTable } from './table';
export type { BaseTableProps, BaseTableColumn } from './table';

export { BasePagination } from './pagination';
export type { BasePaginationProps } from './pagination';

export { BaseEmpty } from './empty';
export type { BaseEmptyProps } from './empty';
