import React, { useMemo, useState } from 'react';
import { DatePicker, Radio } from 'antd';
import dayjs from 'dayjs';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Menu, Plus, MoreHorizontal, Pencil, Copy, Trash2, Check, ChevronLeft, ChevronDown, ChevronRight, CalendarDays, Clock3, Folder } from 'lucide-react';
import { mockProjects } from '../mock/projects';
import { BaseActionMenu, BaseButton, BaseInput, BaseModal, BaseTable, BaseToggle } from '../components';
import type { BaseActionMenuItem, BaseTableColumn } from '../components';
import { type LayoutOutletContext } from '../components/Layout';

const { RangePicker } = DatePicker;

interface TaskTemplate {
  id: string;
  name: string;
  desc: string;
  defaultPrompt: string;
  trigger: string;
}

interface UserTask {
  id: string;
  name: string;
  prompt: string;
  nextRun: string;
  trigger: string;
  isEnabled: boolean;
}

type FetchFrequency = 'daily' | 'weekly' | 'hourly';
type SourceType = 'pubmed' | 'biorxiv';
type PubMedMatchMode = 'all' | 'any' | 'advanced';
type RepeatMode = 'none' | 'monthly' | 'weekly' | 'hourly';

interface LiteratureTrackForm {
  topic: string;
  periodStart: string;
  periodEnd: string;
  frequency: FetchFrequency;
  sourceType: SourceType;
  keywords: string;
  pubmedMatchMode: PubMedMatchMode;
}

interface WeeklyScheduleForm {
  repeatMode: RepeatMode;
  startDate: string;
  endDate: string;
  runAt: string;
  taskPrompt: string;
  keepInSameConversation: boolean;
  notifyByEmail: boolean;
  emailRecipient: string;
  projectId: string | null;
}

type ModalTemplateId = 'template-paper-track' | 'template-meeting-brief';

const taskTemplates: TaskTemplate[] = [
  {
    id: 'template-paper-track',
    name: '文献追踪',
    desc: '每天跟踪指定关键词的新论文，并生成摘要与要点。',
    defaultPrompt: '每天整理 CRISPR 与基因编辑方向的新论文，输出 5 条核心结论。',
    trigger: 'Daily at 08:30',
  },
  {
    id: 'template-meeting-brief',
    name: '每周工作总结',
    desc: '每周自动汇总实验进度、风险点和下周计划。',
    defaultPrompt: '每周五 18:00 汇总本周实验进展、问题与下周安排。',
    trigger: 'Weekly Fri 18:00',
  },
  {
    id: 'template-news-brief',
    name: '项目进展汇总',
    desc: '按日/周聚合项目里程碑、风险项和待办，自动生成进度概览。',
    defaultPrompt: '每周汇总项目关键进展、阻塞问题与下一步计划，按模块输出并标注负责人。',
    trigger: 'Daily at 07:00',
  },
];

const initialUserTasks: UserTask[] = [
  {
    id: 'task-1',
    name: '每日工作总结',
    prompt: '总结近 1 天的工作总结，整理常见异常与处理思路。',
    nextRun: '--',
    trigger: 'Daily at 23:49',
    isEnabled: true,
  },
  {
    id: 'task-2',
    name: '每日生信新闻周报',
    prompt: '检索并汇总过去 24 小时的重要生信新闻，重点关注技术进展。',
    nextRun: '6.28 08:47',
    trigger: 'Daily at 08:47',
    isEnabled: true,
  },
  {
    id: 'task-3',
    name: '行业摘要自动发送',
    prompt: '每日 9 点推送行业摘要到群组，包含 3 条重点新闻与点评。',
    nextRun: '--',
    trigger: 'Daily at 09:02',
    isEnabled: false,
  },
  {
    id: 'task-4',
    name: '实验风险词监测',
    prompt: '每天监测实验记录中的风险关键词，并生成风险提醒。',
    nextRun: '6.28 15:45',
    trigger: 'Daily at 15:45',
    isEnabled: true,
  },
];

const initialLiteratureTrackForm: LiteratureTrackForm = {
  topic: '',
  periodStart: '2026-06-01',
  periodEnd: '2026-06-30',
  frequency: 'daily',
  sourceType: 'pubmed',
  keywords: 'CRISPR, prime editing, base editor',
  pubmedMatchMode: 'all',
};

const initialWeeklyScheduleForm: WeeklyScheduleForm = {
  repeatMode: 'weekly',
  startDate: '2026-06-04',
  endDate: '2026-08-04',
  runAt: '15:00',
  taskPrompt: '每周五 18:00 汇总本周实验进展、问题与下周安排。',
  keepInSameConversation: true,
  notifyByEmail: true,
  emailRecipient: 'Mira',
  projectId: null,
};

const sourceTypeMeta: Record<SourceType, { label: string; desc: string }> = {
  pubmed: {
    label: 'PubMed 文献',
    desc: '追踪正式发表论文',
  },
  biorxiv: {
    label: 'bioRxiv 预印本',
    desc: '追踪早期研究进展',
  },
};

const frequencyOptions: Array<{ value: FetchFrequency; label: string }> = [
  { value: 'daily', label: '每天' },
  { value: 'weekly', label: '每周' },
  { value: 'hourly', label: '每小时' },
];

const repeatModeOptions: Array<{ value: RepeatMode; label: string }> = [
  { value: 'none', label: '不重复' },
  { value: 'monthly', label: '每月' },
  { value: 'weekly', label: '每周' },
  { value: 'hourly', label: '每小时' },
];

const repeatModeTimePrefix: Record<RepeatMode, string> = {
  none: '一次',
  monthly: '每月1日',
  weekly: '周一',
  hourly: '每小时',
};

const emailRecipientOptions = ['Mira', '研发组邮箱'];

const pubmedMatchOptions: Array<{ value: PubMedMatchMode; label: string }> = [
  { value: 'all', label: '全部关键词' },
  { value: 'any', label: '任一关键词' },
  { value: 'advanced', label: '高级表达式' },
];

export default function ToolsPage() {
  const navigate = useNavigate();
  const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<LayoutOutletContext>();
  const [tasks, setTasks] = useState<UserTask[]>(initialUserTasks);
  const [actionMenuTaskId, setActionMenuTaskId] = useState<string | null>(null);
  const [showLiteratureModal, setShowLiteratureModal] = useState(false);
  const [activeModalTemplateId, setActiveModalTemplateId] = useState<ModalTemplateId | null>(null);
  const [literatureForm, setLiteratureForm] = useState<LiteratureTrackForm>(initialLiteratureTrackForm);
  const [weeklyScheduleForm, setWeeklyScheduleForm] = useState<WeeklyScheduleForm>(initialWeeklyScheduleForm);
  const [showWeeklyProjectDropdown, setShowWeeklyProjectDropdown] = useState(false);

  const closeTaskConfigModal = () => {
    setShowLiteratureModal(false);
    setActiveModalTemplateId(null);
    setShowWeeklyProjectDropdown(false);
  };

  const modalTitle =
    activeModalTemplateId === 'template-meeting-brief' ? '新建定时任务' : '设置文献订阅任务';
  const selectedWeeklyProject = mockProjects.find((project) => project.id === weeklyScheduleForm.projectId) ?? null;

  const handleCreateFromTemplate = (template: TaskTemplate) => {
    if (template.id === 'template-paper-track' || template.id === 'template-meeting-brief') {
      setLiteratureForm({
        ...initialLiteratureTrackForm,
        topic: template.id === 'template-meeting-brief' ? '每周工作总结' : '',
        frequency: template.id === 'template-meeting-brief' ? 'weekly' : initialLiteratureTrackForm.frequency,
      });
      if (template.id === 'template-meeting-brief') {
        setWeeklyScheduleForm({
          ...initialWeeklyScheduleForm,
          taskPrompt: template.defaultPrompt,
        });
      }
      setShowWeeklyProjectDropdown(false);
      setActiveModalTemplateId(template.id);
      setShowLiteratureModal(true);
      return;
    }

    setTasks((prev) => [
      {
        id: `task-${Date.now()}`,
        name: `${template.name} ${prev.length + 1}`,
        prompt: template.defaultPrompt,
        nextRun: '--',
        trigger: template.trigger,
        isEnabled: true,
      },
      ...prev,
    ]);
  };

  const handleCreateCustomTask = () => {
    const taskName = window.prompt('请输入任务名称', '新建任务');
    if (!taskName) return;

    const taskPrompt = window.prompt('请输入任务 Prompt', '描述你想让任务自动执行的内容');
    if (!taskPrompt) return;

    setTasks((prev) => [
      {
        id: `task-${Date.now()}`,
        name: taskName.trim() || '新建任务',
        prompt: taskPrompt.trim() || '描述你想让任务自动执行的内容',
        nextRun: '--',
        trigger: 'Daily at 09:00',
        isEnabled: true,
      },
      ...prev,
    ]);
  };

  const handleToggleStatus = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              isEnabled: !task.isEnabled,
            }
          : task,
      ),
    );
  };

  const handleRenameTask = (taskId: string) => {
    const targetTask = tasks.find((task) => task.id === taskId);
    if (!targetTask) return;

    const nextName = window.prompt('修改任务名称', targetTask.name);
    if (!nextName) return;

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              name: nextName.trim() || task.name,
            }
          : task,
      ),
    );
    setActionMenuTaskId(null);
  };

  const handleCopyTask = (taskId: string) => {
    const sourceTask = tasks.find((task) => task.id === taskId);
    if (!sourceTask) return;

    setTasks((prev) => [
      {
        ...sourceTask,
        id: `task-copy-${Date.now()}`,
        name: `${sourceTask.name} 副本`,
        nextRun: '--',
      },
      ...prev,
    ]);
    setActionMenuTaskId(null);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    setActionMenuTaskId(null);
  };

  const handleSourceTypeChange = (sourceType: SourceType) => {
    setLiteratureForm((prev) => ({
      ...prev,
      sourceType,
    }));
  };

  const buildLiteraturePrompt = () => {
    if (activeModalTemplateId === 'template-meeting-brief') {
      const repeatLabel = repeatModeOptions.find((option) => option.value === weeklyScheduleForm.repeatMode)?.label ?? '每周';
      const emailLabel = weeklyScheduleForm.notifyByEmail
        ? `发送至邮箱(${weeklyScheduleForm.emailRecipient})`
        : '不发送邮箱';
      const projectLabel = selectedWeeklyProject?.name ?? '未选择';
      return `任务：${literatureForm.topic || '每周工作总结'}；项目：${projectLabel}；重复机制：${repeatLabel}；起止日期：${weeklyScheduleForm.startDate}~${weeklyScheduleForm.endDate}；执行时间：${weeklyScheduleForm.runAt}；任务内容：${weeklyScheduleForm.taskPrompt}；保留同一对话：${weeklyScheduleForm.keepInSameConversation ? '是' : '否'}；通知方式：${emailLabel}`;
    }

    const sourceLabel = literatureForm.sourceType === 'pubmed' ? 'PubMed' : 'bioRxiv';

    const matchModeLabel =
      literatureForm.pubmedMatchMode === 'all'
        ? '全部关键词'
        : literatureForm.pubmedMatchMode === 'any'
          ? '任一关键词'
          : '高级表达式';

    return `主题：${literatureForm.topic || '文献追踪'}；关键词：${literatureForm.keywords}；来源：${sourceLabel}；任务周期：${literatureForm.periodStart} ~ ${literatureForm.periodEnd}；PubMed 匹配：${matchModeLabel}`;
  };

  const handleCreateLiteratureTask = () => {
    const trimmedTopic = literatureForm.topic.trim();
    const trimmedKeywords = literatureForm.keywords.trim();
    const trimmedWeeklyPrompt = weeklyScheduleForm.taskPrompt.trim();

    if (
      !trimmedTopic ||
      (activeModalTemplateId === 'template-meeting-brief' && !trimmedWeeklyPrompt) ||
      (activeModalTemplateId !== 'template-meeting-brief' &&
        (!trimmedKeywords ||
          !literatureForm.periodStart ||
          !literatureForm.periodEnd ||
          literatureForm.periodStart > literatureForm.periodEnd))
    ) {
      return;
    }

    const triggerLabel =
      activeModalTemplateId === 'template-meeting-brief'
        ? `${repeatModeOptions.find((option) => option.value === weeklyScheduleForm.repeatMode)?.label ?? '每周'} ${weeklyScheduleForm.startDate}~${weeklyScheduleForm.endDate} ${weeklyScheduleForm.runAt}`
        : literatureForm.frequency === 'daily'
          ? 'Daily at 09:00'
          : literatureForm.frequency === 'weekly'
            ? 'Weekly Mon 09:00'
            : 'Hourly';

    setTasks((prev) => [
      {
        id: `task-${Date.now()}`,
        name: trimmedTopic,
        prompt: buildLiteraturePrompt(),
        nextRun: '--',
        trigger: triggerLabel,
        isEnabled: true,
      },
      ...prev,
    ]);

    closeTaskConfigModal();
  };

  const taskTableColumns = useMemo<BaseTableColumn<UserTask>[]>(
    () => [
      {
        title: '任务名称',
        dataIndex: 'name',
        width: '20%',
        render: (name) => <span className="truncate text-primaryText">{name}</span>,
      },
      {
        title: '任务内容',
        dataIndex: 'prompt',
        width: '40%',
        render: (prompt) => <span className="truncate text-secondaryText">{prompt}</span>,
      },
      {
        title: '下次运行',
        dataIndex: 'nextRun',
        width: '14%',
        render: (nextRun) => <span className="text-secondaryText">{nextRun}</span>,
      },
      {
        title: '触发方式',
        dataIndex: 'trigger',
        width: '16%',
        render: (trigger) => <span className="text-secondaryText">{trigger}</span>,
      },
      {
        title: '状态',
        dataIndex: 'isEnabled',
        width: '7%',
        render: (_, task) => (
          <BaseToggle
            size="small"
            checked={task.isEnabled}
            onChange={() => handleToggleStatus(task.id)}
            aria-label={task.isEnabled ? '关闭任务' : '开启任务'}
          />
        ),
      },
      {
        title: '操作',
        dataIndex: 'id',
        width: '3%',
        align: 'right',
        render: (_, task) => {
          const actionItems: BaseActionMenuItem[] = [
            { key: 'rename', label: '编辑', icon: <Pencil size={14} /> },
            { key: 'copy', label: '复制', icon: <Copy size={14} /> },
            { key: 'delete', label: '删除', icon: <Trash2 size={14} />, danger: true },
          ];

          return (
            <BaseActionMenu
              open={actionMenuTaskId === task.id}
              onOpenChange={(open) => setActionMenuTaskId(open ? task.id : null)}
              placement="bottom-end"
              width={144}
              trigger={
                <span className="inline-flex rounded-md p-1 text-secondaryText transition-colors hover:bg-bgLight hover:text-primaryText">
                  <MoreHorizontal size={16} />
                </span>
              }
              items={actionItems}
              onItemClick={(item) => {
                if (item.key === 'rename') {
                  handleRenameTask(task.id);
                  return;
                }
                if (item.key === 'copy') {
                  handleCopyTask(task.id);
                  return;
                }
                handleDeleteTask(task.id);
              }}
            />
          );
        },
      },
    ],
    [actionMenuTaskId, tasks],
  );

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <header className="z-10 flex h-16 shrink-0 items-center justify-between bg-white/80 px-4 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-secondaryText hover:bg-bgLight rounded-full transition-colors"
              title="展开边栏"
            >
              <Menu size={20} />
            </button>
          )}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-primaryText">任务</span>
          </div>
        </div>
        <BaseButton
          type="primary"
          size="small"
          rounded="large"
          icon={<Plus size={14} />}
          className="shrink-0"
          onClick={handleCreateCustomTask}
        >
          新建任务
        </BaseButton>
      </header>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-12 pt-4 md:px-8 lg:px-10 md:pb-12 md:pt-6">
        <div className="max-w-[1240px] mx-auto space-y-10">
          <section>
            <h2 className="text-2xl font-semibold text-primaryText">定时任务</h2>
            <div className="mt-6 grid grid-cols-1 gap-[18px] md:grid-cols-2 lg:grid-cols-3">
              {taskTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleCreateFromTemplate(template)}
                  className="rounded-lg border border-[#e9edf2] bg-white p-4 text-left transition-all hover:shadow-sm hover:border-[#dde3ea] flex flex-col"
                >
                  <h3 className="text-[17px] font-medium text-primaryText">{template.name}</h3>
                  <p className="mt-1 line-clamp-2 min-h-[38px] text-sm leading-5 text-secondaryText">{template.desc}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-[15px] font-medium text-primaryText">已设置任务</h2>
            </div>

            <div className="border-b border-borderGray bg-white">
              <BaseTable
                className="task-table-scroll w-full [&_table]:min-w-[940px]"
                columns={taskTableColumns}
                dataSource={tasks}
                rowKey="id"
                striped={false}
              />
            </div>
          </section>
        </div>
      </div>

      <BaseModal
        visible={showLiteratureModal}
        title={modalTitle}
        width={600}
        className="tools-task-modal"
        okText="创建任务"
        cancelText="取消"
        onCancel={closeTaskConfigModal}
        onConfirm={handleCreateLiteratureTask}
        okButtonProps={{
          disabled:
            !literatureForm.topic.trim() ||
            (activeModalTemplateId === 'template-meeting-brief' && !weeklyScheduleForm.taskPrompt.trim()) ||
            (activeModalTemplateId !== 'template-meeting-brief' && !literatureForm.keywords.trim()),
        }}
      >
        <div className="space-y-5">
                <div>
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="text-sm font-medium text-primaryText">任务名称</span>
                    <span className="text-[13px] text-tertiaryText">
                      {activeModalTemplateId === 'template-meeting-brief'
                        ? '建议填写本任务名称，默认已带入“每周工作总结”。'
                        : '留空时会自动使用一个关键词生成“文献订阅”名称。'}
                    </span>
                  </div>
                  <BaseInput
                    value={literatureForm.topic}
                    onChange={(event) =>
                      setLiteratureForm((prev) => ({
                        ...prev,
                        topic: event.target.value,
                      }))
                    }
                    placeholder={activeModalTemplateId === 'template-meeting-brief' ? '例：每周工作总结' : '例：EGFR resistance'}
                    size="medium"
                    containerClassName="!px-3.5"
                  />
                </div>

                {activeModalTemplateId === 'template-meeting-brief' ? (
                  <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <div className="mb-1.5 text-sm font-medium text-primaryText">任务周期</div>
                        <div className="relative flex h-11 items-center gap-2 rounded-lg border border-[borderGray] bg-white px-3.5">
                          <input
                            type="date"
                            value={weeklyScheduleForm.startDate}
                            onChange={(event) =>
                              setWeeklyScheduleForm((prev) => ({
                                ...prev,
                                startDate: event.target.value,
                              }))
                            }
                            className="min-w-0 flex-1 border-none bg-transparent p-0 text-sm text-primaryText outline-none"
                          />
                          <span className="text-sm text-secondaryText">~</span>
                          <input
                            type="date"
                            value={weeklyScheduleForm.endDate}
                            onChange={(event) =>
                              setWeeklyScheduleForm((prev) => ({
                                ...prev,
                                endDate: event.target.value,
                              }))
                            }
                            className="min-w-0 flex-1 border-none bg-transparent p-0 text-sm text-primaryText outline-none"
                          />
                          <CalendarDays size={16} className="text-[#98A2B3]" />
                        </div>
                      </div>

                      <div>
                        <div className="mb-1.5 text-sm font-medium text-primaryText">触发时间</div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="relative">
                            <select
                              value={weeklyScheduleForm.repeatMode}
                              onChange={(event) =>
                                setWeeklyScheduleForm((prev) => ({
                                  ...prev,
                                  repeatMode: event.target.value as RepeatMode,
                                }))
                              }
                              className="h-11 w-full appearance-none rounded-lg border border-[borderGray] bg-white px-3.5 pr-9 text-sm text-primaryText outline-none transition-colors focus:border-[#34D399]"
                            >
                              {repeatModeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <ChevronRight size={16} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                          </div>

                          <div className="relative flex h-11 items-center rounded-lg border border-[borderGray] bg-white px-3 pr-9">
                            <span className="mr-2 shrink-0 text-sm font-medium text-primaryText">
                              {repeatModeTimePrefix[weeklyScheduleForm.repeatMode]}
                            </span>
                            <input
                              type="time"
                              value={weeklyScheduleForm.runAt}
                              onChange={(event) =>
                                setWeeklyScheduleForm((prev) => ({
                                  ...prev,
                                  runAt: event.target.value,
                                }))
                              }
                              className="min-w-0 flex-1 border-none bg-transparent p-0 text-sm text-primaryText outline-none"
                            />
                            <Clock3 size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="mb-1.5 text-sm font-medium text-primaryText">
                        提示词 (Prompt)
                        <span className="text-red-500"> *</span>
                      </div>
                      <div className="relative">
                        <textarea
                          value={weeklyScheduleForm.taskPrompt}
                          onChange={(event) =>
                            setWeeklyScheduleForm((prev) => ({
                              ...prev,
                              taskPrompt: event.target.value,
                            }))
                          }
                          placeholder="输入任何内容，使用 '/' 选择技能或 '@' 引用资源..."
                          rows={5}
                          className="w-full resize-none rounded-lg border border-[borderGray] px-3.5 pb-10 pt-2.5 text-sm text-primaryText outline-none transition-colors placeholder:text-tertiaryText focus:border-[#34D399]"
                        />
                        <div className="absolute bottom-2.5 left-3 z-20">
                          <button
                            type="button"
                            onClick={() => setShowWeeklyProjectDropdown((prev) => !prev)}
                            className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-secondaryText transition-colors hover:bg-bgLight"
                          >
                            <Folder size={14} />
                            <span className="max-w-[140px] truncate">
                              {selectedWeeklyProject ? selectedWeeklyProject.name : '在项目中工作'}
                            </span>
                            <ChevronDown size={14} />
                          </button>

                          {showWeeklyProjectDropdown && (
                            <>
                              <div className="fixed inset-0 z-20" onClick={() => setShowWeeklyProjectDropdown(false)}></div>
                              <div className="absolute bottom-full left-0 z-30 mb-2 w-60 overflow-hidden rounded-xl bg-white py-2 shadow-popover animate-in fade-in slide-in-from-bottom-2">
                                <div className="max-h-[200px] overflow-y-auto">
                                  <button
                                    type="button"
                                    className={`mx-2 flex w-[calc(100%-1rem)] items-center justify-between rounded-lg px-4 py-2.5 text-left text-sm transition-colors ${
                                      !selectedWeeklyProject ? 'bg-green-100 font-medium text-green-700' : 'text-primaryText hover:bg-bgLight'
                                    }`}
                                    onClick={() => {
                                      setWeeklyScheduleForm((prev) => ({
                                        ...prev,
                                        projectId: null,
                                      }));
                                      setShowWeeklyProjectDropdown(false);
                                    }}
                                  >
                                    不选择项目
                                  </button>
                                  {mockProjects.map((project) => (
                                    <button
                                      key={project.id}
                                      type="button"
                                      className={`mx-2 flex w-[calc(100%-1rem)] items-center justify-between rounded-lg px-4 py-2.5 text-left text-sm transition-colors ${
                                        selectedWeeklyProject?.id === project.id
                                          ? 'bg-green-100 font-medium text-green-700'
                                          : 'text-primaryText hover:bg-bgLight'
                                      }`}
                                      onClick={() => {
                                        setWeeklyScheduleForm((prev) => ({
                                          ...prev,
                                          projectId: project.id,
                                        }));
                                        setShowWeeklyProjectDropdown(false);
                                      }}
                                    >
                                      <span className="truncate">{project.name}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-medium text-primaryText">保留在同一对话</div>
                        <p className="mt-1 text-[13px] leading-5 text-tertiaryText">
                          所有复盘任务的结果将显示在同一个对话中，方便不同运行之间进行查看和比较。
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setWeeklyScheduleForm((prev) => ({
                            ...prev,
                            keepInSameConversation: !prev.keepInSameConversation,
                          }))
                        }
                        className={`inline-flex h-6 w-10 shrink-0 items-center rounded-full p-[2px] transition-colors ${
                          weeklyScheduleForm.keepInSameConversation ? 'justify-end bg-[#10b981]' : 'justify-start bg-[#d9dee5]'
                        }`}
                        role="switch"
                        aria-checked={weeklyScheduleForm.keepInSameConversation}
                        aria-label={weeklyScheduleForm.keepInSameConversation ? '关闭同一对话保留' : '开启同一对话保留'}
                      >
                        <span className="h-5 w-5 rounded-full bg-white shadow" />
                      </button>
                    </div>

                    <div>
                      <div className="mb-2 text-sm font-medium text-primaryText">任务完成时通知方式</div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() =>
                            setWeeklyScheduleForm((prev) => ({
                              ...prev,
                              notifyByEmail: !prev.notifyByEmail,
                            }))
                          }
                          className="inline-flex items-center gap-2 rounded-md p-0.5 transition-opacity hover:opacity-90"
                        >
                          <span
                            className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-sm ${
                              weeklyScheduleForm.notifyByEmail
                                ? 'bg-[#10c786]'
                                : 'border border-[#d9e2ec] bg-white'
                            }`}
                          >
                            <Check
                              size={12}
                              className={weeklyScheduleForm.notifyByEmail ? 'text-white' : 'text-transparent'}
                            />
                          </span>
                          <span
                            className={`text-base font-normal leading-none ${
                              weeklyScheduleForm.notifyByEmail ? 'text-primaryText' : 'text-secondaryText'
                            }`}
                          >
                            发送至邮箱
                          </span>
                        </button>

                        <div className="relative">
                          <select
                            value={weeklyScheduleForm.emailRecipient}
                            onChange={(event) =>
                              setWeeklyScheduleForm((prev) => ({
                                ...prev,
                                emailRecipient: event.target.value,
                              }))
                            }
                            disabled={!weeklyScheduleForm.notifyByEmail}
                            className="h-8 min-w-[96px] appearance-none rounded-lg border border-[borderGray] bg-white px-2.5 pr-7 text-[13px] text-primaryText outline-none transition-colors focus:border-[#34D399] disabled:cursor-not-allowed disabled:bg-[#f8fafc] disabled:text-tertiaryText"
                          >
                            {emailRecipientOptions.map((recipient) => (
                              <option key={recipient} value={recipient}>
                                {recipient}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <div className="mb-1.5 text-sm font-medium text-primaryText">抓取频率</div>
                      <div className="relative">
                        <select
                          value={literatureForm.frequency}
                          onChange={(event) =>
                            setLiteratureForm((prev) => ({
                              ...prev,
                              frequency: event.target.value as FetchFrequency,
                            }))
                          }
                          className="h-9 w-full appearance-none rounded-lg border border-[borderGray] bg-white px-3 pr-10 text-sm text-primaryText outline-none transition-colors focus:border-[#34D399]"
                        >
                          {frequencyOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                      </div>
                    </div>

                    <div>
                      <div className="mb-1.5 text-sm font-medium text-primaryText">任务周期</div>
                      <RangePicker
                        format="YYYY-MM-DD"
                        className="task-period-picker w-full"
                        popupClassName="task-period-picker-popup"
                        value={[
                          literatureForm.periodStart ? dayjs(literatureForm.periodStart, 'YYYY-MM-DD') : null,
                          literatureForm.periodEnd ? dayjs(literatureForm.periodEnd, 'YYYY-MM-DD') : null,
                        ]}
                        onChange={(_, dateStrings) => {
                          const [periodStart, periodEnd] = dateStrings;
                          setLiteratureForm((prev) => ({
                            ...prev,
                            periodStart,
                            periodEnd,
                          }));
                        }}
                        placeholder={['开始日期', '结束日期']}
                        allowClear={false}
                      />
                    </div>
                  </div>
                )}

                {activeModalTemplateId !== 'template-meeting-brief' && (
                  <>
                    <div>
                      <div className="mb-2 text-sm font-medium text-primaryText">订阅来源</div>
                      <Radio.Group
                        value={literatureForm.sourceType}
                        onChange={(event) => handleSourceTypeChange(event.target.value as SourceType)}
                        className="w-full task-radio-group"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          {(Object.keys(sourceTypeMeta) as SourceType[]).map((sourceType) => {
                            const source = sourceTypeMeta[sourceType];
                            return (
                              <label
                                key={sourceType}
                                className="flex items-start gap-2.5 rounded-lg border border-[borderGray] bg-white px-3.5 py-3 hover:border-[#cad6e5]"
                              >
                                <Radio value={sourceType} className="mt-0.5" />
                                <span>
                                  <span className="block text-sm font-medium text-primaryText">{source.label}</span>
                                  <span className="mt-0.5 block text-[13px] text-secondaryText">{source.desc}</span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </Radio.Group>
                      <p className="mt-1.5 text-[13px] text-tertiaryText">当前版本支持 PubMed 和 bioRxiv，单次任务请选择一个来源。</p>
                    </div>

                    <div>
                      <div className="mb-1.5 text-sm font-medium text-primaryText">关键词</div>
                      <input
                        value={literatureForm.keywords}
                        onChange={(event) =>
                          setLiteratureForm((prev) => ({
                            ...prev,
                            keywords: event.target.value,
                          }))
                        }
                        placeholder="例：CRISPR, prime editing, base editor"
                        className="w-full rounded-lg border border-[borderGray] px-3.5 py-2.5 text-sm text-primaryText outline-none transition-colors placeholder:text-tertiaryText focus:border-[#34D399]"
                      />
                    </div>

                    <div>
                      <div className="mb-2 text-sm font-medium text-primaryText">PubMed 匹配方式</div>
                      <Radio.Group
                        value={literatureForm.pubmedMatchMode}
                        onChange={(event) =>
                          setLiteratureForm((prev) => ({
                            ...prev,
                            pubmedMatchMode: event.target.value as PubMedMatchMode,
                          }))
                        }
                        className="task-radio-group"
                      >
                        <div className="flex flex-wrap gap-5">
                          {pubmedMatchOptions.map((option) => (
                            <Radio key={option.value} value={option.value}>
                              {option.label}
                            </Radio>
                          ))}
                        </div>
                      </Radio.Group>
                    </div>
                  </>
                )}
        </div>
      </BaseModal>
    </div>
  );
}