import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { mockProjects, type MockProject } from '../mock/projects';
import { Plus, Menu, LayoutTemplate, MoreHorizontal } from 'lucide-react';
import { BaseActionMenu, BaseButton, BaseDocumentUpload, BaseInput, BaseModal } from '../components';
import type { BaseActionMenuItem } from '../components';
import { type LayoutOutletContext } from '../components/Layout';

// ─── 模版类型 ─────────────────────────────────────────────────────────────────
export type TemplateScope = 'team' | 'personal';

export interface ProjectTemplate {
  id: string;
  name: string;
  content: string;
  /** 模版正文，Markdown 格式，用于渲染真实样式预览 */
  body: string;
  builtin?: boolean;
  creator?: string;
  modifier?: string;
  updatedAt?: string;
  scope?: TemplateScope;
}

export const DEFAULT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'tpl-blank',
    name: '空白项目',
    content: '从零开始创建项目',
    builtin: true,
    scope: 'team',
    creator: '张明',
    modifier: '张明',
    updatedAt: '2024-01-15',
    body: `## 项目简介

请输入项目背景与目标。

## 待办事项

- [ ] 明确项目目标
- [ ] 梳理关键里程碑
`,
  },
  {
    id: 'tpl-research',
    name: '科研项目',
    content: '适合文献调研与论文写作',
    builtin: true,
    scope: 'team',
    creator: '李华',
    modifier: '李华',
    updatedAt: '2024-02-20',
    body: `## 研究背景

围绕课题的研究现状、存在的问题与研究意义展开说明。

## 研究目标

1. 明确核心科学问题
2. 界定研究范围与边界
3. 设定可衡量的阶段性目标

## 实验设计

- 实验方案与对照组设置
- 关键指标与评估标准
- 数据采集与分析方法

## 参考文献

> 请补充相关领域的核心文献与引用。
`,
  },
  {
    id: 'tpl-product',
    name: '产品研发',
    content: '需求梳理与迭代管理',
    builtin: true,
    scope: 'team',
    creator: '王芳',
    modifier: '王芳',
    updatedAt: '2024-03-10',
    body: `## 需求背景

描述用户痛点、业务目标与需求来源。

## 功能范围

| 模块 | 优先级 | 状态 |
| --- | --- | --- |
| 核心流程 | P0 | 待评审 |
| 辅助能力 | P1 | 规划中 |

## 迭代计划

1. 需求评审
2. 设计与开发
3. 测试与灰度
4. 全量发布

## 验收标准

- 功能可用性达到预期
- 关键性能指标达标
`,
  },
  {
    id: 'tpl-legal',
    name: '法律案件',
    content: '案件资料与合规分析',
    builtin: true,
    scope: 'team',
    creator: '赵强',
    modifier: '赵强',
    updatedAt: '2024-01-28',
    body: `## 案件概况

简述案件类型、当事人信息与争议焦点。

## 事实梳理

- 时间线梳理
- 关键证据清单
- 相关法律条款

## 法律分析

1. 争议焦点分析
2. 适用法律依据
3. 潜在风险评估

## 处理建议

> 请补充下一步的应对策略与建议。
`,
  },
  {
    id: 'tpl-marketing',
    name: '市场营销',
    content: 'campaign 策划与效果复盘',
    builtin: true,
    scope: 'team',
    creator: '陈露',
    modifier: '陈露',
    updatedAt: '2024-02-15',
    body: `## 活动背景

阐述市场环境、目标人群与营销诉求。

## 传播策略

- 核心卖点提炼
- 渠道组合与投放节奏
- 创意物料清单

## 执行排期

1. 前期筹备
2. 上线曝光
3. 数据追踪与优化

## 效果复盘

> 请补充关键数据指标与复盘结论。
`,
  },
  {
    id: 'tpl-training',
    name: '培训课程',
    content: '课程大纲与考核设计',
    builtin: true,
    scope: 'team',
    creator: '孙伟',
    modifier: '孙伟',
    updatedAt: '2024-03-05',
    body: `## 课程目标

明确学员画像与预期收获。

## 课程大纲

1. 基础概念导入
2. 核心方法讲解
3. 实战演练
4. 总结答疑

## 考核方式

- 随堂练习
- 结业测评

## 资料清单

> 请补充课件、案例与参考资料链接。
`,
  },
  {
    id: 'tpl-event',
    name: '活动策划',
    content: '流程编排与物料清单',
    builtin: true,
    scope: 'team',
    creator: '周婷',
    modifier: '周婷',
    updatedAt: '2024-02-08',
    body: `## 活动概述

说明活动主题、时间地点与参与对象。

## 流程编排

| 时间 | 环节 | 负责人 |
| --- | --- | --- |
| 09:00 | 签到入场 | 待定 |
| 09:30 | 开场致辞 | 待定 |

## 物料清单

- 现场物料
- 宣传物料
- 应急预案

## 复盘总结

> 请补充活动效果与改进建议。
`,
  },
  {
    id: 'tpl-interview',
    name: '用户访谈',
    content: '提纲设计与洞察沉淀',
    builtin: true,
    scope: 'team',
    creator: '吴鹏',
    modifier: '吴鹏',
    updatedAt: '2024-01-18',
    body: `## 访谈目的

明确本次访谈希望验证的假设与问题。

## 访谈提纲

1. 背景与使用场景
2. 核心痛点挖掘
3. 期望与建议收集

## 受访者信息

- 姓名 / 角色
- 使用频率
- 联系方式

## 洞察总结

> 请补充关键发现与后续行动项。
`,
  },
  {
    id: 'tpl-budget',
    name: '财务预算',
    content: '预算编制与支出跟踪',
    builtin: true,
    scope: 'team',
    creator: '郑洁',
    modifier: '郑洁',
    updatedAt: '2024-03-12',
    body: `## 预算背景

说明预算周期、编制依据与总体目标。

## 预算科目

| 科目 | 预算金额 | 执行进度 |
| --- | --- | --- |
| 人力成本 | 待填写 | 0% |
| 物料采购 | 待填写 | 0% |

## 审批流程

1. 部门初审
2. 财务复核
3. 管理层审批

## 跟踪计划

> 请补充预算执行的跟踪频率与责任人。
`,
  },
];

export default function ProjectsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<LayoutOutletContext>();
  const [projects, setProjects] = useState<MockProject[]>(() => [...mockProjects]);

  // 创建项目相关
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectDocs, setProjectDocs] = useState<File[]>([]);
  const [createProjectError, setCreateProjectError] = useState('');

  // 模版管理相关
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState<ProjectTemplate[]>(DEFAULT_TEMPLATES);
  const [templateScope, setTemplateScope] = useState<TemplateScope>('team');
  const [activeTemplateMenuId, setActiveTemplateMenuId] = useState<string | null>(null);

  const filteredTemplates = templates.filter((tpl) => (tpl.scope ?? 'team') === templateScope);

  const openTemplateModal = () => {
    setShowTemplateModal(true);
  };
  const closeTemplateModal = () => {
    setShowTemplateModal(false);
    setActiveTemplateMenuId(null);
  };

  const handleToggleTemplateScope = (tpl: ProjectTemplate) => {
    tpl.scope = tpl.scope === 'team' ? 'personal' : 'team';
    setActiveTemplateMenuId(null);
    // 强制刷新列表
    setTemplates([...templates]);
  };

  const getTemplateMenuItems = (tpl: ProjectTemplate): BaseActionMenuItem[] => [
    {
      key: 'toggleScope',
      label: tpl.scope === 'team' ? '转为个人模版' : '转为团队模版',
    },
  ];

  // 从模版详情/编辑页返回时，自动重新打开项目模版弹窗
  useEffect(() => {
    const state = location.state as { reopenTemplateModal?: boolean } | null;
    if (state?.reopenTemplateModal) {
      setShowTemplateModal(true);
      // 清除 state，避免刷新后重复触发
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const openCreateProjectModal = () => {
    setProjectName('');
    setProjectDesc('');
    setProjectDocs([]);
    setCreateProjectError('');
    setShowCreateProjectModal(true);
  };

  const closeCreateProjectModal = () => {
    setShowCreateProjectModal(false);
    setCreateProjectError('');
  };

  const handleCreateProject = () => {
    const trimmedName = projectName.trim();
    if (!trimmedName) {
      setCreateProjectError('请输入项目名称');
      return;
    }

    const newProject: MockProject = {
      id: `p-local-${Date.now()}`,
      name: trimmedName,
      desc: projectDesc.trim() || '暂无项目描述',
      count: 0,
      knowledge: projectDocs.length,
      members: 1,
      visibility: 'private',
      privateType: 'team',
    };

    setProjects((prev) => [newProject, ...prev]);
    closeCreateProjectModal();
  };

  const goEditTemplate = (id: string) => {
    closeTemplateModal();
    navigate(`/project-templates/${id}`);
  };

  const goViewTemplate = (id: string) => {
    closeTemplateModal();
    navigate(`/project-templates/${id}`, { state: { mode: 'preview' } });
  };

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <header className="z-10 flex h-16 shrink-0 items-center justify-between bg-white/80 px-4 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          {!isSidebarOpen && (
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-secondaryText hover:bg-bgLight rounded-full transition-colors" title="展开边栏">
              <Menu size={20} />
            </button>
          )}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-primaryText">项目</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <BaseButton
            type="secondary"
            size="small"
            rounded="large"
            icon={<LayoutTemplate size={14} />}
            onClick={openTemplateModal}
          >
            项目模版
          </BaseButton>
          <BaseButton
            type="primary"
            size="small"
            rounded="large"
            icon={<Plus size={14} />}
            className="!gap-[6px] !pl-[10px]"
            onClick={openCreateProjectModal}
          >
            新建项目
          </BaseButton>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-4 pb-12 pt-4 md:px-8 lg:px-10 md:pb-12 md:pt-6">
        <div className="max-w-[1240px] mx-auto">
          <section className="pb-0">
            <h2 className="text-2xl font-semibold text-primaryText">科研项目</h2>
          </section>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((proj) => (
              <button
                key={proj.id}
                type="button"
                onClick={() => navigate(`/project/${proj.id}`)}
                className="group rounded-lg border border-[var(--color-line-subtle)] bg-[var(--color-surface)] px-4 py-3.5 text-left transition-all hover:border-[var(--color-gray-3)] hover:shadow-sm"
              >
                <div className="mb-1">
                  <h3 className="truncate text-lg font-medium text-primaryText">{proj.name}</h3>
                </div>

                <p className="line-clamp-2 min-h-[40px] text-sm leading-5 text-secondaryText">{proj.desc}</p>

                <div className="mt-4 flex items-center gap-2 text-sm text-tertiaryText">
                  <span>{proj.knowledge}文档</span>
                  <span>·</span>
                  <span>{proj.count}对话</span>
                </div>
              </button>
            ))}

            {projects.length === 0 && (
              <div className="col-span-full rounded-lg border border-dashed border-[var(--color-border-soft)] px-4 py-10 text-center text-sm text-tertiaryText">
                暂无项目
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 项目模版管理弹窗 ──────────────────────────────────────────── */}
      <BaseModal
        visible={showTemplateModal}
        title="项目模版"
        width={1040}
        maskClosable={false}
        footer={null}
        onCancel={closeTemplateModal}
        bodyClassName="!px-6 !py-5 !h-[720px] !overflow-y-auto"
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-lg bg-bgLight p-0.5">
            <button
              type="button"
              onClick={() => setTemplateScope('team')}
              className={`rounded-md px-3 py-1 text-sm transition-colors ${
                templateScope === 'team'
                  ? 'bg-white text-primaryText shadow-sm'
                  : 'text-secondaryText hover:text-primaryText'
              }`}
            >
              团队模版
            </button>
            <button
              type="button"
              onClick={() => setTemplateScope('personal')}
              className={`rounded-md px-3 py-1 text-sm transition-colors ${
                templateScope === 'personal'
                  ? 'bg-white text-primaryText shadow-sm'
                  : 'text-secondaryText hover:text-primaryText'
              }`}
            >
              个人模版
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {/* 新建模版卡片 */}
          <button
            type="button"
            onClick={() => goEditTemplate('new')}
            className="group flex flex-col overflow-hidden rounded-lg border border-dashed border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-left transition-colors hover:border-[var(--color-primary)]"
          >
            <div className="px-3 pt-3">
              <span className="truncate text-sm font-semibold text-primaryText">新建模版</span>
            </div>

            <div className="relative mx-3 mb-3 mt-2.5 aspect-[4/5] overflow-hidden rounded-md bg-white">
              <div className="flex h-full w-full items-center justify-center">
                <Plus size={28} className="text-[var(--color-gray-3)] transition-colors group-hover:text-[var(--color-primary)]" />
              </div>
            </div>
          </button>

          {filteredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="group flex flex-col overflow-hidden rounded-lg border border-[var(--color-line-subtle)] bg-[var(--color-surface-muted)]"
            >
              <div className="flex items-center justify-between px-3 pt-3">
                <span className="truncate text-sm font-semibold text-primaryText">{tpl.name}</span>
                <div className="opacity-0 transition-opacity group-hover:opacity-100">
                  <BaseActionMenu
                    open={activeTemplateMenuId === tpl.id}
                    onOpenChange={(open) => setActiveTemplateMenuId(open ? tpl.id : null)}
                    placement="bottom-end"
                    width={140}
                    trigger={
                      <span className="inline-flex rounded-md p-1 text-secondaryText transition-colors hover:bg-bgLight hover:text-primaryText">
                        <MoreHorizontal size={16} />
                      </span>
                    }
                    items={getTemplateMenuItems(tpl)}
                    onItemClick={(item) => {
                      if (item.key === 'toggleScope') {
                        handleToggleTemplateScope(tpl);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="relative mx-3 mb-3 mt-2.5 aspect-[4/5] overflow-hidden rounded-md bg-white">
                <div className="pointer-events-none origin-top-left scale-[0.62] px-3 py-2.5" style={{ width: '161%' }}>
                  <div className="prose prose-slate max-w-none text-primaryText prose-p:my-1.5 prose-p:text-xs prose-p:leading-5 prose-li:text-xs prose-li:leading-5 prose-headings:text-primaryText prose-h2:mt-0 prose-h2:mb-1.5 prose-h2:text-sm prose-h2:font-semibold prose-h3:mt-2 prose-h3:mb-1 prose-h3:text-xs prose-h3:font-semibold prose-strong:text-primaryText prose-hr:my-2 prose-li:my-0.5 prose-ol:pl-4 prose-ul:pl-4 prose-table:text-xs prose-th:py-1 prose-td:py-1 prose-blockquote:border-l-2 prose-blockquote:pl-2 prose-blockquote:text-secondaryText">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{tpl.body}</ReactMarkdown>
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />

                {/* hover 蒙层：查看 */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/70 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                  <BaseButton
                    type="primary"
                    size="small"
                    rounded="large"
                    onClick={() => goViewTemplate(tpl.id)}
                  >
                    查看
                  </BaseButton>
                </div>
              </div>
            </div>
          ))}

          {filteredTemplates.length === 0 && (
            <div className="col-span-full py-10 text-center text-sm text-tertiaryText">暂无模版</div>
          )}
        </div>
      </BaseModal>

      <BaseModal
        visible={showCreateProjectModal}
        title="新建项目"
        width={560}
        maskClosable={false}
        okText="创建"
        cancelText="取消"
        onCancel={closeCreateProjectModal}
        onConfirm={handleCreateProject}
        bodyClassName="!px-6 !py-5"
      >
        <div className="space-y-4">
          <section className="space-y-2">
            <div className="text-sm font-medium text-primaryText">
              项目名称 <span className="text-[var(--color-danger)]">*</span>
            </div>
            <BaseInput
              value={projectName}
              placeholder="请输入项目名称"
              onChange={(event) => {
                setProjectName(event.target.value);
                if (createProjectError) {
                  setCreateProjectError('');
                }
              }}
            />
          </section>

          <section className="space-y-2">
            <div className="text-sm font-medium text-primaryText">项目描述（选填）</div>
            <textarea
              value={projectDesc}
              onChange={(event) => setProjectDesc(event.target.value)}
              placeholder="请输入项目描述"
              rows={4}
              className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-primaryText transition-colors placeholder:text-tertiaryText hover:border-[var(--color-gray-3)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </section>

          <section className="space-y-2">
            <div className="text-sm font-medium text-primaryText">项目文档（选填）</div>
            <BaseDocumentUpload
              value={projectDocs}
              maxCount={5}
              maxSize={20 * 1024 * 1024}
              onChange={setProjectDocs}
              onError={(error) => setCreateProjectError(error.message)}
            />
          </section>

          {createProjectError && <div className="text-sm text-[var(--color-danger)]">{createProjectError}</div>}
        </div>
      </BaseModal>
    </div>
  );
}
