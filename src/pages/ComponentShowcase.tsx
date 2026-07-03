import React, { useState } from 'react';
import { MoreHorizontal, Pencil, Share2, Pin, Trash2 } from 'lucide-react';
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
  BaseActionMenu,
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

  // Action menu state
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

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
      align: 'left' as const,
      render: (status: string) => (
        <span
          className={`py-1 rounded-full text-sm ${
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

  const actionMenuItems = [
    {
      key: 'rename',
      label: '重命名',
      icon: <Pencil size={18} />,
    },
    {
      key: 'share',
      label: '分享对话',
      icon: <Share2 size={18} />,
    },
    {
      key: 'pin',
      label: '取消置顶',
      icon: <Pin size={18} />,
    },
    {
      key: 'delete',
      label: '删除',
      icon: <Trash2 size={18} />,
      danger: true,
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
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 ">
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
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 ">
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
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 ">
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

        {/* ==================== 操作菜单组件 ==================== */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 ">
            ⋯ BaseActionMenu - 操作菜单
          </h2>

          <div className="flex flex-wrap items-center gap-6">
            <BaseActionMenu
              trigger={(
                <button
                  type="button"
                  className="h-10 w-10 rounded-full bg-bgLight text-primaryText hover:bg-gray-1 transition-colors inline-flex items-center justify-center"
                  aria-label="更多操作"
                >
                  <MoreHorizontal size={20} />
                </button>
              )}
              items={actionMenuItems}
              open={isActionMenuOpen}
              onOpenChange={setIsActionMenuOpen}
              onItemClick={(item) => {
                alert(`点击：${item.label}`);
                setIsActionMenuOpen(false);
              }}
              placement="bottom-start"
              width={360}
            />
            <p className="text-sm text-secondaryText">点击左侧按钮可打开“切换选项”的操作弹层（Action Menu）。</p>
          </div>
        </section>

        {/* ==================== 卡片组件 ==================== */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 ">
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
                <div className="space-x-4">
                  <span className="action-link">操作1</span>
                  <span className="action-link">操作2</span>
                </div>
              }
            >
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-4 mt-1">
                  <div className="text-center p-3 rounded bg-primary-soft">
                    <div className="text-2xl font-bold text-black">1,234</div>
                    <div className="text-sm text-black">访问量</div>
                  </div>
                  <div className="text-center p-3 rounded bg-success-soft">
                    <div className="text-2xl font-bold text-black">567</div>
                    <div className="text-sm text-black">用户数</div>
                  </div>
                  <div className="text-center p-3 rounded bg-warning-soft">
                    <div className="text-2xl font-bold text-black">89</div>
                    <div className="text-sm text-black">订单数</div>
                  </div>
                </div>
              </div>
            </BaseCard>
          </div>
        </section>

        {/* ==================== 弹窗组件 ==================== */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 ">
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
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 ">
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
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 ">
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
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 ">
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
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 ">
            🫙 BaseEmpty - 空状态组件
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <BaseEmpty description="暂无数据" />

            <BaseEmpty
              description="没有找到相关内容"
              image={(
                <svg width="184" height="152" viewBox="0 0 184 152" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto select-none">
                  <defs>
                    <linearGradient id="empty-grad" x1="50%" y1="0%" x2="50%" y2="100%">
                      <stop offset="0%" stopColor="#f0f9f6" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                  
                  {/* 背景圆形光晕 */}
                  <circle cx="92" cy="76" r="54" fill="url(#empty-grad)" />
                  
                  {/* 文档卡片：底部绘制一层纯矢量浅灰色作为投影，避免SVG滤镜黑盒Bug */}
                  <rect x="52" y="47" width="80" height="54" rx="8" fill="#1d2129" fillOpacity="0.04" />
                  
                  {/* 文档卡片主体 */}
                  <rect x="52" y="44" width="80" height="54" rx="8" fill="white" stroke="#e5e6eb" strokeWidth="1.2" />
                  
                  {/* 文档卡片内的骨架线 */}
                  <rect x="64" y="56" width="36" height="5" rx="2.5" fill="#f2f3f5" />
                  <rect x="64" y="67" width="56" height="4" rx="2" fill="#f2f3f5" />
                  <rect x="64" y="77" width="44" height="4" rx="2" fill="#f2f3f5" />
                  
                  {/* 装饰性小细节 */}
                  <circle cx="116" cy="58" r="2" fill="#c9cdd4" />
                  
                  {/* 放大镜手柄投影 */}
                  <line x1="123" y1="92" x2="133" y2="102" stroke="#1d2129" strokeOpacity="0.08" strokeWidth="3" strokeLinecap="round" />
                  
                  {/* 放大镜镜圈投影 */}
                  <circle cx="112" cy="82" r="14" fill="#1d2129" fillOpacity="0.04" />
                  
                  {/* 放大镜外圈 */}
                  <circle cx="112" cy="81" r="14" fill="white" stroke="#14B886" strokeWidth="2.5" />
                  {/* 镜片内层浅绿色滤镜 */}
                  <circle cx="112" cy="81" r="11.5" fill="#14B886" fillOpacity="0.08" />
                  {/* 放大镜手柄 */}
                  <line x1="122" y1="91" x2="132" y2="101" stroke="#14B886" strokeWidth="3" strokeLinecap="round" />
                  <line x1="124.5" y1="93.5" x2="130" y2="99" stroke="#0d9e6d" strokeWidth="3" strokeLinecap="round" />
                  {/* 镜片内小问号 */}
                  <path d="M109.5 78 C109.5 76.5 110.7 75.5 112 75.5 C113.3 75.5 114.5 76.5 114.5 78 C114.5 79.2 113.7 79.7 112.8 80.5 C112 81.2 112 82.5 112 82.5 M112 85 L112 85.5" stroke="#14B886" strokeWidth="1.8" strokeLinecap="round" />
                  
                  {/* 闪烁的小星星 */}
                  <path d="M44 34 L45.5 37 L48.5 38.5 L45.5 40 L44 43 L42.5 40 L39.5 38.5 L42.5 37 Z" fill="#bbf2e3" />
                  <path d="M142 108 L143 110.5 L145.5 111.5 L143 112.5 L142 115 L141 112.5 L138.5 111.5 L141 110.5 Z" fill="#bbf2e3" />
                </svg>
              )}
            />
          </div>
        </section>

        {/* ==================== 颜色和样式参考 ==================== */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 ">
            🎨 设计系统参考
          </h2>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="rounded-xl border border-borderGray bg-surface p-5">
              <h3 className="text-lg font-semibold text-primaryText mb-4">颜色 Tokens（来自 tailwind.config.ts）</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-[var(--color-primary)]" />
                  <div className="text-sm">
                    <div className="font-medium text-primaryText">primary · #14B886</div>
                    <div className="text-tertiaryText">主品牌色（按钮/高亮）</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-[var(--color-success)]" />
                  <div className="text-sm">
                    <div className="font-medium text-primaryText">success · #00b42a</div>
                    <div className="text-tertiaryText">成功反馈</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-[var(--color-warning)]" />
                  <div className="text-sm">
                    <div className="font-medium text-primaryText">warning · #ff7d00</div>
                    <div className="text-tertiaryText">风险提示</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-[var(--color-danger)]" />
                  <div className="text-sm">
                    <div className="font-medium text-primaryText">danger · #f53f3f</div>
                    <div className="text-tertiaryText">错误/删除操作</div>
                  </div>
                </div>
                <div className="pt-3 mt-3 border-t border-lineSoft space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-secondaryText">primaryText</span>
                    <span className="font-medium text-primaryText">#1f1f1f</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-secondaryText">secondaryText</span>
                    <span className="font-medium text-primaryText">#444746</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-secondaryText">tertiaryText</span>
                    <span className="font-medium text-primaryText">#747775</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-borderGray bg-surface p-5">
              <h3 className="text-lg font-semibold text-primaryText mb-4">排版规范（字号/行高）</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div className="flex items-center justify-between border-b border-lineSoft pb-2">
                  <span className="text-secondaryText">xs</span>
                  <span className="font-medium text-primaryText">12 / 16</span>
                </div>
                <div className="flex items-center justify-between border-b border-lineSoft pb-2">
                  <span className="text-secondaryText">sm</span>
                  <span className="font-medium text-primaryText">14 / 20</span>
                </div>
                <div className="flex items-center justify-between border-b border-lineSoft pb-2">
                  <span className="text-secondaryText">base</span>
                  <span className="font-medium text-primaryText">16 / 24</span>
                </div>
                <div className="flex items-center justify-between border-b border-lineSoft pb-2">
                  <span className="text-secondaryText">lg</span>
                  <span className="font-medium text-primaryText">18 / 26</span>
                </div>
                <div className="flex items-center justify-between border-b border-lineSoft pb-2">
                  <span className="text-secondaryText">xl</span>
                  <span className="font-medium text-primaryText">20 / 28</span>
                </div>
                <div className="flex items-center justify-between border-b border-lineSoft pb-2">
                  <span className="text-secondaryText">2xl</span>
                  <span className="font-medium text-primaryText">24 / 32</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-secondaryText">3xl</span>
                  <span className="font-medium text-primaryText">28 / 36</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-secondaryText">4xl/5xl</span>
                  <span className="font-medium text-primaryText">32/40 · 36/44</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-borderGray bg-surface p-5">
              <h3 className="text-lg font-semibold text-primaryText mb-4">间距与圆角规范</h3>
              <div className="space-y-4 text-sm text-secondaryText">
                <div>
                  <div className="font-medium text-primaryText mb-1">Spacing Scale</div>
                  <div>2 / 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between rounded-md bg-bgLight px-3 py-2">
                    <span>sm</span>
                    <span className="font-medium text-primaryText">4px</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-bgLight px-3 py-2">
                    <span>md</span>
                    <span className="font-medium text-primaryText">8px</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-bgLight px-3 py-2">
                    <span>lg</span>
                    <span className="font-medium text-primaryText">12px</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-bgLight px-3 py-2">
                    <span>xl</span>
                    <span className="font-medium text-primaryText">16px</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-bgLight px-3 py-2">
                    <span>2xl/3xl</span>
                    <span className="font-medium text-primaryText">24 / 32px</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-bgLight px-3 py-2">
                    <span>full</span>
                    <span className="font-medium text-primaryText">999px</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-borderGray bg-surface p-5">
              <h3 className="text-lg font-semibold text-primaryText mb-4">阴影与交互状态</h3>
              <div className="space-y-3 text-sm text-secondaryText">
                <div className="flex items-center justify-between rounded-md bg-bgLight px-3 py-2">
                  <span>shadow-sm</span>
                  <span className="font-medium text-primaryText">0 2px 8px rgba(0,0,0,0.02)</span>
                </div>
                <div className="flex items-center justify-between rounded-md bg-bgLight px-3 py-2">
                  <span>shadow-md</span>
                  <span className="font-medium text-primaryText">0 4px 20px rgba(0,0,0,0.05)</span>
                </div>
                <div className="flex items-center justify-between rounded-md bg-bgLight px-3 py-2">
                  <span>shadow-lg</span>
                  <span className="font-medium text-primaryText">0 8px 30px rgba(0,0,0,0.08)</span>
                </div>
                <div className="pt-2 border-t border-lineSoft space-y-1">
                  <div><span className="font-medium text-primaryText">Button：</span>default / hover / active / disabled</div>
                  <div><span className="font-medium text-primaryText">Input：</span>focus 使用 primary 边框与 ring</div>
                  <div><span className="font-medium text-primaryText">Card：</span>hover 为 shadow + border 联动</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-lineSubtle bg-bgLight p-4">
            <h3 className="text-base font-semibold text-primaryText mb-2">执行要求（最新）</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-secondaryText">
              <div>· 禁止硬编码 #xxx / rgb / rgba，统一使用 Token。</div>
              <div>· 禁止非标间距，统一使用 2~48 的标准 scale。</div>
              <div>· 禁止自定义圆角，统一使用 sm / md / lg / xl / 2xl / 3xl / full。</div>
              <div>· 禁止自定义阴影与叠层阴影，仅使用 shadow-sm / md / lg。</div>
              <div>· 基础组件优先复用 BaseButton / BaseInput / BaseModal / BaseCard。</div>
              <div>· 静态视觉优先 Tailwind 类，不用内联 style 承载静态样式。</div>
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