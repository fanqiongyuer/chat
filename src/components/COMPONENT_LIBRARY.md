# 项目组件库规范

## 📋 总览

本项目采用**分层组件库架构**，旨在提升开发效率、保证代码质量、降低维护成本。

### 核心原则

- **分离关注点**：公共组件与业务组件分离
- **向后兼容**：所有公共组件支持旧API自动兼容
- **设计系统**：所有组件遵循统一的设计规范
- **渐进式迁移**：无需一次性重构，支持逐步演进

---

## 📁 目录结构

```
src/components/
├── common/                    # 通用组件库
│   ├── button/               # 按钮组件
│   ├── input/                # 输入框组件
│   ├── select/               # 选择框组件
│   ├── modal/                # 弹窗组件
│   ├── card/                 # 卡片组件
│   ├── table/                # 表格组件
│   ├── pagination/           # 分页组件
│   ├── upload/               # 上传组件
│   ├── empty/                # 空状态组件
│   └── index.ts              # 统一导出
├── business/                 # 业务组件库（预留）
│   └── index.ts
├── chat/                     # 聊天功能组件
├── Layout.tsx                # 布局组件
└── index.ts                  # 总导出
```

### 组件分类说明

#### 🎯 Common 公共组件

所有项目都能复用的基础组件，遵循完整的向后兼容承诺。

**表单组件：**
- `BaseButton` - 按钮 | 支持加载态、禁用、多种类型
- `BaseInput` - 输入框 | 支持前后缀、清空、错误提示
- `BaseSelect` - 选择框 | 原生select封装，性能优先
- `BaseUpload` - 文件上传 | 支持拖拽、文件大小限制

**容器组件：**
- `BaseModal` - 弹窗 | 支持自定义footer、遮罩点击关闭
- `BaseCard` - 卡片 | 支持悬停、加载态

**数据展示：**
- `BaseTable` - 表格 | 支持自定义列渲染、条纹行
- `BasePagination` - 分页 | 支持页码跳转、条数切换
- `BaseEmpty` - 空状态 | 支持自定义图片和文字

#### 💼 Business 业务组件

特定业务场景的复杂组件，可能涉及API调用和状态管理。

当前预留位置，逐步迁移现有的业务相关组件。

#### 🔧 Feature 功能组件

特定功能的专用组件，如 `chat/` 下的聊天相关组件。

---

## 🚀 使用指南

### 基础使用

```tsx
import { BaseButton, BaseInput, BaseModal } from '@/components';

export function MyPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <BaseButton 
        type="primary" 
        onClick={() => setIsModalOpen(true)}
      >
        打开弹窗
      </BaseButton>

      <BaseModal
        visible={isModalOpen}
        title="示例弹窗"
        onConfirm={() => setIsModalOpen(false)}
        onCancel={() => setIsModalOpen(false)}
      >
        <BaseInput placeholder="输入内容" />
      </BaseModal>
    </>
  );
}
```

### 组件API兼容性

所有公共组件都支持多种传参方式，优先级如下：

#### BaseButton Props优先级
```tsx
// 新API（推荐）
<BaseButton isLoading={true} />

// 旧API（兼容）
<BaseButton loading={true} />

// 新API会覆盖旧API
<BaseButton isLoading={true} loading={false} /> // isLoading生效
```

#### BaseModal Props优先级
```tsx
// 显隐状态优先级：visible > open > show
<BaseModal visible={true} /> // ✅ 优先使用
<BaseModal open={true} />    // 降级
<BaseModal show={true} />    // 再降级

// 事件回调优先级：onConfirm > onOk
<BaseModal onConfirm={() => {}} /> // ✅ 优先使用
<BaseModal onOk={() => {}} />      // 降级
```

---

## ✨ 新增组件流程

### 步骤1：确定分类

- **如果是通用组件** → 放在 `common/` 下
- **如果是业务组件** → 放在 `business/` 下
- **如果是功能特定** → 放在相应功能目录下

### 步骤2：创建组件目录结构

```
common/mycomponent/
├── MyComponent.tsx       # 组件实现
├── MyComponent.types.ts  # Props类型定义
├── MyComponent.module.css # 样式（可选）
└── index.ts             # 导出
```

### 步骤3：实现组件

```tsx
// MyComponent.types.ts
export interface MyComponentProps {
  value?: string;
  onChange?: (value: string) => void;
  // ... 其他props
}

// MyComponent.tsx
import React from 'react';
import { MyComponentProps } from './MyComponent.types';
import styles from './MyComponent.module.css';

export const MyComponent: React.FC<MyComponentProps> = ({
  value,
  onChange,
  ...rest
}) => {
  return (
    <div className={styles.container}>
      {/* 实现 */}
    </div>
  );
};

MyComponent.displayName = 'MyComponent';

// index.ts
export { MyComponent } from './MyComponent';
export type { MyComponentProps } from './MyComponent.types';
```

### 步骤4：在common/index.ts中导出

```tsx
export { MyComponent } from './mycomponent';
export type { MyComponentProps } from './mycomponent';
```

### 步骤5：编写使用示例和文档

```tsx
/**
 * MyComponent - 描述
 * 
 * 特性：
 * - 特性1
 * - 特性2
 * 
 * 使用场景：
 * - 场景1
 * - 场景2
 */
```

---

## 🔄 向后兼容性设计

所有公共组件遵循以下兼容性原则：

### 原则1：Props别名支持

```tsx
// ✅ 支持新旧API同时工作
interface BaseButtonProps {
  isLoading?: boolean;    // 新API
  loading?: boolean;      // 旧API @deprecated
}

// 实现中：优先新API，降级旧API
const finalLoading = useMemo(
  () => isLoading ?? loading ?? false,
  [isLoading, loading]
);
```

### 原则2：事件回调兼容

```tsx
// ✅ 支持多种事件命名
const handleConfirm = useCallback(() => {
  if (onConfirm) {
    onConfirm();
  } else if (onOk) {
    onOk();
  }
}, [onConfirm, onOk]);
```

### 原则3：Props传参灵活性

```tsx
// ✅ 多种方式都能工作
<BaseModal visible={true} />
<BaseModal open={true} />
<BaseModal show={true} />

// 实现：多层级降级
const isVisible = useMemo(
  () => show ?? open ?? visible ?? false,
  [show, open, visible]
);
```

---

## 🎨 样式规范

### 使用CSS Modules

所有组件样式采用 **CSS Modules**，避免全局命名冲突：

```css
/* BaseButton.module.css */
.btn {
  padding: 8px 16px;
  border-radius: 4px;
  /* ... */
}

.btn-primary {
  background: #14B886;
  /* ... */
}
```

### 设计Token应用

所有颜色、大小等值都应来自设计系统，定义在 `tailwind.config.ts` 中：

```tsx
// ✅ 使用设计Token
background: #14B886;  // 来自tailwind color

// ❌ 不要硬编码任意颜色
background: #abc123;
```

### 响应式设计

组件应支持基本的响应式，使用Tailwind或CSS Media Queries：

```tsx
// ✅ 响应式支持
<div className="px-4 sm:px-6 md:px-8">
  {/* ... */}
</div>

// 或使用CSS
@media (max-width: 768px) {
  .btn { padding: 6px 12px; }
}
```

---

## 🧪 测试建议

### 单元测试

```tsx
// MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render with provided value', () => {
    render(<MyComponent value="test" />);
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('should call onChange when value changes', () => {
    const onChange = jest.fn();
    render(<MyComponent onChange={onChange} />);
    // ... 模拟用户交互
    expect(onChange).toHaveBeenCalled();
  });
});
```

### 兼容性测试

新增组件时，务必测试多种Props传参方式：

```tsx
// ✅ 测试新API
<BaseButton isLoading={true} />

// ✅ 测试旧API
<BaseButton loading={true} />

// ✅ 测试混合（新API优先）
<BaseButton isLoading={true} loading={false} />
```

---

## 📚 最佳实践

### 1️⃣ Props 设计

- ✅ 使用 TypeScript interface 定义Props
- ✅ 为每个prop提供默认值
- ✅ 添加 `@deprecated` 注释标记旧API
- ✅ 使用 `useMemo` 避免不必要的重新计算

### 2️⃣ 事件处理

- ✅ 使用 `useCallback` 优化事件处理函数
- ✅ 明确事件处理的优先级
- ✅ 提供清晰的事件命名

### 3️⃣ 样式管理

- ✅ 使用 CSS Modules 隔离样式
- ✅ 使用 `classNames` 库管理条件样式
- ✅ 避免内联样式，除非必要

### 4️⃣ 代码组织

- ✅ 组件逻辑分离：types → component → styles
- ✅ 为组件添加 `displayName`
- ✅ 使用 `React.forwardRef` 支持ref转发

### 5️⃣ 文档

- ✅ 在文件顶部添加JSDoc注释
- ✅ 说明组件的特性和使用场景
- ✅ 为复杂props提供使用示例

---

## 🚫 常见陷阱

### ❌ 陷阱1：不使用CSS Modules

```tsx
// ❌ 不好 - 全局污染
import './MyComponent.css';

// ✅ 好 - 隔离样式
import styles from './MyComponent.module.css';
```

### ❌ 陷阱2：Props传参混乱

```tsx
// ❌ 不好 - 优先级不清
const isLoading = loading || isLoading;

// ✅ 好 - 清晰的优先级
const isLoading = useMemo(
  () => isLoading ?? loading ?? false,
  [isLoading, loading]
);
```

### ❌ 陷阱3：过度的props props

```tsx
// ❌ 不好 - 太多props
<BaseButton
  icon={icon}
  iconSize={16}
  iconColor="#333"
  iconPosition="left"
  loading={true}
  loadingColor="#666"
  // ... 20个props
/>

// ✅ 好 - 简化props，提供defaults
<BaseButton icon={icon} loading={true} />
```

### ❌ 陷阱4：忘记memoization

```tsx
// ❌ 不好 - 每次渲染重新创建
const handleClick = () => { /* ... */ };

// ✅ 好 - 使用useCallback
const handleClick = useCallback(() => { /* ... */ }, [deps]);
```

---

## 📞 迁移老代码

### 场景：旧页面使用hardcoded样式

```tsx
// ❌ 旧代码
export function OldPage() {
  return (
    <button 
      style={{
        backgroundColor: '#14B886',
        padding: '8px 16px',
        // ...
      }}
    >
      点击
    </button>
  );
}

// ✅ 逐步迁移（第一步）- 使用公共组件
export function MigratedPage() {
  return (
    <BaseButton type="primary">
      点击
    </BaseButton>
  );
}
```

### 迁移优先级

1. **第一优先** - 新增功能直接使用公共组件
2. **第二优先** - 重构关键业务组件
3. **第三优先** - 逐步更新现有页面
4. **降级处理** - 临时页面继续使用旧样式（标记TODO）

---

## 🔮 未来规划

- [ ] 建立组件库Storybook展示
- [ ] 编写单元测试覆盖率要求
- [ ] 创建主题系统（dark mode）
- [ ] 建立组件版本管理
- [ ] 推出CLI工具快速生成组件骨架

---

## 📖 参考资源

- [React官方文档](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS文档](https://tailwindcss.com/docs)
- [CSS Modules](https://github.com/css-modules/css-modules)

---

**更新时间**: 2026年7月3日  
**维护者**: 开发团队  
**反馈渠道**: 项目Wiki或PR讨论
