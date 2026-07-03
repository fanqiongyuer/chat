export type BaseSegmentedOption = {
  label: string;
  value: string | number;
};

export type BaseSegmentedSize = 'small' | 'middle' | 'large';

export type BaseSegmentedProps = {
  /** 选项列表 */
  options: BaseSegmentedOption[];
  /** 当前选中值（受控） */
  value?: string | number;
  /** 默认选中值（非受控） */
  defaultValue?: string | number;
  /** 选中变化回调 */
  onChange?: (value: string | number) => void;
  /** 尺寸 */
  size?: BaseSegmentedSize;
  /** 是否禁用 */
  disabled?: boolean;
  /** 额外 className */
  className?: string;
};
