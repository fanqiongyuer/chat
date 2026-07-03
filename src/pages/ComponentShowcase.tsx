import React, { useState } from 'react';
import {
  BaseButton,
  BaseInput,
  BaseSelect,
  BaseUpload,
  BaseModal,
  BaseCard,
  BaseTable,
  BasePagination,
  BaseEmpty,
} from '@/components';

/**
 * ComponentShowcase - 组件库全展示页面
 * 
 * 在这里可以看到所有公共组件的实际效果和样式
 * 访问路由：/showcase
 */
export function ComponentShowcase() {
  // Button states
  const [buttonLoading, setButtonLoading] = useState(false);

  // Input states
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [passwordValue, setPasswordValue] = useState('');

  // Select state
  const [selectValue, setSelectValue] = useState('user');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Upload state
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);

  // Table data
  const tableData = [
    { id: 1, name: '张三', email: 'zhangsan@example.com', status: '活跃' },
    { id: 2, name: '李四', email: 'lisi@example.com', status: '已停用' },
    { id: 3, name: '王五', email: 'wangwu@example.com', status: '活跃' },
    { id: 4, name: '赵六', email: 'zhaoliu@example.com', status: '活跃' },
    { id: 5, name: '孙七', email: 'sunqi@example.com', status: '已停用' },
  ];

  const tableColumns = [
    { title: 'ID', dataIndex: 'id', width: '10%' },
    { title: '名称', dataIndex: 'name', width: '25%' },
    { title: '邮箱', dataIndex: 'email', width: '35%' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: string) => (
        <span
          className={`px-3 py-1 rounded-full text-sm ${
            status === '活跃' ? 'bg-success-soft text-success' : 'bg-gray-1 text-gray-5'
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      title: '操作',
      render: () => (
        <div className="space-x-4">
          <span className="action-link">编辑</span>
          <span className="action-link-danger">删除</span>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full h-full overflow-y-auto bg-gradient-to-br from-primary-soft to-primary-soft-strong p-8">
      <div className="max-w-6xl mx-auto space-y-12 pb-12">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📦 组件库完整展示
          </h1>
          <p className="text-gray-600 text-lg">
            所有公共组件的实际效果和样式演示
          </p>
        </div>

        {/* ==================== 按钮组件 ==================== */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b-2 border-primary">
            🔘 BaseButton - 按钮组件
          </h2>

          {/* 按钮类型 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              按钮类型：
            </h3>
            <div className="flex flex-wrap gap-4">
              <BaseButton type="primary">Primary</BaseButton>
              <BaseButton type="secondary">Secondary</BaseButton>
              <BaseButton type="ghost">Ghost</BaseButton>
              <BaseButton type="danger">Danger</BaseButton>
            </div>
          </div>

          {/* 按钮尺寸 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              按钮尺寸：
            </h3>
            <div className="flex flex-wrap gap-4 items-center">
              <BaseButton type="primary" size="small">
                Small
              </BaseButton>
              <BaseButton type="primary" size="medium">
                Medium
              </BaseButton>
              <BaseButton type="primary" size="large">
                Large
              </BaseButton>
            </div>
          </div>

          {/* 加载状态 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              加载状态：
            </h3>
            <div className="flex flex-wrap gap-4">
              <BaseButton
                type="primary"
                isLoading={buttonLoading}
                onClick={() => {
                  setButtonLoading(true);
                  setTimeout(() => setButtonLoading(false), 2000);
                }}
              >
                {buttonLoading ? '加载中...' : '点击加载'}
              </BaseButton>
              <BaseButton type="primary" disabled>
                Disabled
              </BaseButton>
            </div>
          </div>

          {/* 全宽按钮 */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              全宽按钮：
            </h3>
            <BaseButton type="primary" fullWidth>
              Full Width Button
            </BaseButton>
          </div>
        </section>

        {/* ==================== 输入框组件 ==================== */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b-2 border-primary">
            📝 BaseInput - 输入框组件
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 基础输入 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                基础输入框：
              </h3>
              <BaseInput
                label="用户名"
                placeholder="输入用户名"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                clearable
              />
            </div>

            {/* 密码输入 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                密码输入框：
              </h3>
              <BaseInput
                label="密码"
                type="password"
                placeholder="输入密码"
                value={passwordValue}
                onChange={(e) => setPasswordValue(e.target.value)}
              />
            </div>

            {/* 错误状态 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                错误状态：
              </h3>
              <BaseInput
                label="邮箱"
                type="email"
                placeholder="输入邮箱"
                error={!!inputError}
                helperText={
                  inputError || '请输入有效的邮箱地址'
                }
                value={inputError ? 'invalid-email' : ''}
                onChange={(e) => {
                  if (!e.target.value.includes('@')) {
                    setInputError('邮箱格式不正确');
                  } else {
                    setInputError('');
                  }
                }}
              />
            </div>

            {/* 不同尺寸 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                输入框尺寸：
              </h3>
              <div className="space-y-3">
                <BaseInput size="small" placeholder="Small Input" />
                <BaseInput size="medium" placeholder="Medium Input" />
                <BaseInput size="large" placeholder="Large Input" />
              </div>
            </div>

            {/* 前缀输入 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                前缀输入框：
              </h3>
              <BaseInput prefix="¥" placeholder="输入金额" />
            </div>

            {/* 禁用状态 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                禁用状态：
              </h3>
              <BaseInput
                placeholder="禁用的输入框"
                disabled
                value="不能编辑"
              />
            </div>
          </div>
        </section>

        {/* ==================== 选择框组件 ==================== */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b-2 border-primary">
            ⬇️ BaseSelect - 选择框组件
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                基础选择：
              </h3>
              <BaseSelect
                label="用户角色"
                options={[
                  { label: '管理员', value: 'admin' },
                  { label: '普通用户', value: 'user' },
                  { label: '访客', value: 'guest' },
                ]}
                value={selectValue}
                onChange={(value) => setSelectValue(String(value))}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                禁用选项：
              </h3>
              <BaseSelect
                label="选择部门"
                options={[
                  { label: '技术部', value: 'tech' },
                  { label: '产品部', value: 'product', disabled: true },
                  { label: '设计部', value: 'design' },
                ]}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                错误状态：
              </h3>
              <BaseSelect
                label="选择城市"
                error
                helperText="请选择一个城市"
                options={[
                  { label: '北京', value: 'bj' },
                  { label: '上海', value: 'sh' },
                ]}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                不同尺寸：
              </h3>
              <div className="space-y-3">
                <BaseSelect
                  size="small"
                  options={[
                    { label: '小', value: 's' },
                    { label: '大', value: 'l' },
                  ]}
                />
                <BaseSelect
                  size="medium"
                  options={[
                    { label: '中等', value: 'm' },
                  ]}
                />
                <BaseSelect
                  size="large"
                  options={[
                    { label: '大', value: 'l' },
                  ]}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 卡片组件 ==================== */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b-2 border-primary">
            🎴 BaseCard - 卡片组件
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <BaseCard title="基础卡片" bordered>
              <p className="text-gray-600">
                这是一个基础的卡片组件，包含标题和内容。
              </p>
            </BaseCard>

            <BaseCard
              title="可悬停卡片"
              hoverable
              extra={<span className="text-primary cursor-pointer">编辑</span>}
            >
              <p className="text-gray-600">
                鼠标悬停时会显示阴影效果，并且可以添加额外操作。
              </p>
            </BaseCard>

            <BaseCard title="加载中" loading>
              <p className="text-gray-600">
                这个卡片处于加载状态，会显示半透明遮罩。
              </p>
            </BaseCard>

            <BaseCard
              title="自定义内容"
              extra={
                <div className="space-x-2">
                  <BaseButton type="ghost" size="small">
                    操作1
                  </BaseButton>
                  <BaseButton type="ghost" size="small">
                    操作2
                  </BaseButton>
                </div>
              }
            >
              <div className="space-y-2">
                <p>
                  <strong>统计数据：</strong>
                </p>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center p-3 rounded bg-primary-soft">
                    <div className="text-2xl font-bold text-primary">1,234</div>
                    <div className="text-sm text-gray-600">访问量</div>
                  </div>
                  <div className="text-center p-3 rounded bg-success-soft">
                    <div className="text-2xl font-bold text-success">567</div>
                    <div className="text-sm text-gray-600">用户数</div>
                  </div>
                  <div className="text-center p-3 rounded bg-warning-soft">
                    <div className="text-2xl font-bold text-warning">89</div>
                    <div className="text-sm text-gray-600">订单数</div>
                  </div>
                </div>
              </div>
            </BaseCard>
          </div>
        </section>

        {/* ==================== 弹窗组件 ==================== */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b-2 border-primary">
            📦 BaseModal - 弹窗组件
          </h2>

          <div className="mb-6">
            <BaseButton
              type="primary"
              onClick={() => setIsModalOpen(true)}
            >
              打开弹窗
            </BaseButton>
          </div>

          <BaseModal
            visible={isModalOpen}
            title="新建用户"
            okText="创建"
            cancelText="取消"
            onConfirm={() => {
              setIsModalOpen(false);
              alert(`创建用户: ${formData.name} (${formData.email})`);
            }}
            onCancel={() => setIsModalOpen(false)}
          >
            <div className="space-y-4">
              <BaseInput
                label="用户名"
                placeholder="输入用户名"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <BaseInput
                label="邮箱"
                type="email"
                placeholder="输入邮箱"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
              <BaseSelect
                label="角色"
                options={[
                  { label: '管理员', value: 'admin' },
                  { label: '编辑', value: 'editor' },
                  { label: '查看者', value: 'viewer' },
                ]}
              />
            </div>
          </BaseModal>

          <p className="text-gray-600 mt-4">
            点击上面的按钮打开弹窗，体验模态框的效果。
          </p>
        </section>

        {/* ==================== 表格组件 ==================== */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b-2 border-primary">
            📊 BaseTable - 表格组件
          </h2>

          <BaseTable
            columns={tableColumns}
            dataSource={tableData}
            rowKey="id"
            bordered
            striped
          />

          <BasePagination
            current={currentPage}
            total={tableData.length * 3}
            pageSize={5}
            onChange={setCurrentPage}
            className="mt-4"
          />
        </section>

        {/* ==================== 分页组件 ==================== */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b-2 border-primary">
            📄 BasePagination - 分页组件
          </h2>

          <BasePagination
            current={currentPage}
            total={100}
            pageSize={10}
            onChange={setCurrentPage}
            showSizeChanger
            onShowSizeChange={(current, pageSize) => {
              setCurrentPage(current);
              console.log(`Page: ${current}, Size: ${pageSize}`);
            }}
          />
        </section>

        {/* ==================== 文件上传组件 ==================== */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b-2 border-primary">
            📤 BaseUpload - 文件上传组件
          </h2>

          <BaseUpload
            accept=".jpg,.png,.pdf"
            multiple
            onChange={(files) => {
              setUploadFiles(files);
              alert(`已选择 ${files.length} 个文件`);
            }}
            onError={(error) => alert(`错误: ${error.message}`)}
          >
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-700 mb-2">
                🎯 点击选择文件或拖拽到此
              </p>
              <p className="text-sm text-gray-500">
                支持 JPG, PNG, PDF 格式
              </p>
            </div>
          </BaseUpload>

          {uploadFiles && (
            <div className="mt-6 p-4 rounded-lg bg-success-soft">
              <p className="text-success font-semibold">
                ✓ 已选择 {uploadFiles.length} 个文件
              </p>
              <ul className="mt-2 space-y-1">
                {Array.from(uploadFiles).map((file, index) => (
                  <li key={index} className="text-sm text-success">
                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* ==================== 空状态组件 ==================== */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b-2 border-primary">
            🫙 BaseEmpty - 空状态组件
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <BaseEmpty description="暂无数据" />

            <BaseEmpty
              description="没有找到相关内容"
              image={<span className="text-6xl">🔍</span>}
            />
          </div>
        </section>

        {/* ==================== 颜色和样式参考 ==================== */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b-2 border-primary">
            🎨 设计系统参考
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 颜色系统 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                颜色系统：
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-primary"></div>
                  <div>
                    <span className="text-sm font-medium">Primary: #14B886</span>
                    <span className="text-xs text-gray-500 block">主色</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-success"></div>
                  <div>
                    <span className="text-sm font-medium">Success: #00b42a</span>
                    <span className="text-xs text-gray-500 block">成功色</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-warning"></div>
                  <div>
                    <span className="text-sm font-medium">Warning: #ff7d00</span>
                    <span className="text-xs text-gray-500 block">警告色</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-danger"></div>
                  <div>
                    <span className="text-sm font-medium">Danger: #f53f3f</span>
                    <span className="text-xs text-gray-500 block">危险色</span>
                  </div>
                </div>
                <div className="pt-2 mt-2 border-t">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-primaryText"></div>
                    <div>
                      <span className="text-sm font-medium">Primary Text: #1f1f1f</span>
                      <span className="text-xs text-gray-500 block">主文本</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-10 h-10 rounded bg-secondaryText"></div>
                    <div>
                      <span className="text-sm font-medium">Secondary Text: #444746</span>
                      <span className="text-xs text-gray-500 block">辅助文本</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 圆角系统 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                圆角系统：
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-3 rounded-none"></div>
                  <div>
                    <span className="text-sm font-medium">square: 0px</span>
                    <span className="text-xs text-gray-500 block">无圆角</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-3 rounded-sm"></div>
                  <div>
                    <span className="text-sm font-medium">sm: 4px</span>
                    <span className="text-xs text-gray-500 block">小圆角</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-3 rounded-md"></div>
                  <div>
                    <span className="text-sm font-medium">md: 8px</span>
                    <span className="text-xs text-gray-500 block">中圆角</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-3 rounded-lg"></div>
                  <div>
                    <span className="text-sm font-medium">lg: 12px</span>
                    <span className="text-xs text-gray-500 block">大圆角</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-3 rounded-full"></div>
                  <div>
                    <span className="text-sm font-medium">full: 999px</span>
                    <span className="text-xs text-gray-500 block">完全圆形</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 排版系统 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                排版系统（字号）：
              </h3>
              <div className="space-y-2">
                <div className="text-xs text-gray-600">
                  <span className="font-medium">xs: 12px</span>
                  <div className="text-xs text-gray-500">用于注释、提示文本</div>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">sm: 14px</span>
                  <div className="text-xs text-gray-500">用于正文、表单标签</div>
                </div>
                <div className="text-base text-gray-600">
                  <span className="font-medium">base: 16px</span>
                  <div className="text-xs text-gray-500">用于组件内容、描述</div>
                </div>
                <div className="text-lg text-gray-600">
                  <span className="font-medium">lg: 18px</span>
                  <div className="text-xs text-gray-500">用于小标题</div>
                </div>
                <div className="text-xl text-gray-600">
                  <span className="font-medium">xl: 20px</span>
                  <div className="text-xs text-gray-500">用于标题</div>
                </div>
              </div>
            </div>
          </div>

          {/* 设计原则说明 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-base font-semibold text-gray-700 mb-3">设计原则：</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>✓ <span className="font-medium">一致性</span>：所有组件遵循统一的设计规范</div>
              <div>✓ <span className="font-medium">可访问性</span>：确保足够的色彩对比度和可读性</div>
              <div>✓ <span className="font-medium">可预测性</span>：相同的交互产生相同的结果</div>
              <div>✓ <span className="font-medium">高效性</span>：最小化用户学习成本</div>
            </div>
          </div>
        </section>

        {/* 底部说明 */}
        <div className="text-center text-gray-600 py-8 border-t border-gray-200">
          <p>
            💡 所有组件都基于 Tailwind CSS 和 CSS Modules 构建
          </p>
          <p className="mt-2 text-sm">
            在 <code className="bg-gray-100 px-2 py-1 rounded">src/components/common/</code> 目录下查看组件源代码
          </p>
        </div>
      </div>
    </div>
  );
}

export default ComponentShowcase;