import React, { useMemo, useState } from 'react';
import { Cascader, DatePicker, Radio, TimePicker } from 'antd';
import dayjs from 'dayjs';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Menu, Plus, MoreHorizontal, Pencil, Trash2, ChevronLeft, ChevronDown, Folder } from 'lucide-react';
import { mockProjects } from '../mock/projects';
import { BaseActionMenu, BaseButton, BaseInput, BaseModal, BaseTable, BaseToggle } from '../components';
import type { BaseActionMenuItem, BaseTableColumn, BaseActionMenuProps } from '../components';
import { type LayoutOutletContext } from '../components/Layout';

const { RangePicker } = DatePicker;

interface TaskTemplate {
  id: string;
  name: string;
  desc: string;
  defaultPrompt: string;
  trigger: string;
}

type TaskType = 'schedule' | 'literature';

interface UserTask {
  id: string;
  name: string;
  prompt: string;
  nextRun: string;
  trigger: string;
  isEnabled: boolean;
  taskType?: TaskType;
  templateId?: ModalTemplateId;
  scheduleConfig?: WeeklyScheduleForm;
  literatureConfig?: LiteratureTrackForm;
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
  repeatSubValue: string;
  startDate: string;
  endDate: string;
  runAt: string;
  taskPrompt: string;
  projectId: string | null;
}

type ModalTemplateId =
  | 'template-paper-track'
  | 'template-meeting-brief'
  | 'template-news-brief'
  | 'template-custom';

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
    taskType: 'schedule',
  },
  {
    id: 'task-2',
    name: '每日生信新闻周报',
    prompt: '检索并汇总过去 24 小时的重要生信新闻，重点关注技术进展。',
    nextRun: '6.28 08:47',
    trigger: 'Daily at 08:47',
    isEnabled: true,
    taskType: 'schedule',
  },
  {
    id: 'task-3',
    name: '行业摘要自动发送',
    prompt: '每日 9 点推送行业摘要到群组，包含 3 条重点新闻与点评。',
    nextRun: '--',
    trigger: 'Daily at 09:02',
    isEnabled: false,
    taskType: 'schedule',
  },
  {
    id: 'task-4',
    name: '实验风险词监测',
    prompt: '每天监测实验记录中的风险关键词，并生成风险提醒。',
    nextRun: '6.28 15:45',
    trigger: 'Daily at 15:45',
    isEnabled: true,
    taskType: 'schedule',
  },
  {
    id: 'task-5',
    name: '肿瘤免疫文献订阅',
    prompt: '主题：肿瘤免疫文献订阅；关键词：PD-1, CTLA-4, CAR-T；来源：PubMed；任务周期：2026-07-01 ~ 2026-09-30；PubMed 匹配：全部关键词',
    nextRun: '7.11 09:00',
    trigger: 'Daily at 09:00',
    isEnabled: true,
    taskType: 'literature',
    templateId: 'template-paper-track',
    literatureConfig: {
      topic: '肿瘤免疫文献订阅',
      periodStart: '2026-07-01',
      periodEnd: '2026-09-30',
      frequency: 'daily',
      sourceType: 'pubmed',
      keywords: 'PD-1, CTLA-4, CAR-T',
      pubmedMatchMode: 'all',
    },
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
  repeatSubValue: 'mon',
  startDate: '2026-06-04',
  endDate: '2026-08-04',
  runAt: '15:00',
  taskPrompt: '每周五 18:00 汇总本周实验进展、问题与下周安排。',
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
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
  { value: 'hourly', label: '每小时' },
];

const repeatWeekdayOptions: Array<{ value: string; label: string }> = [
  { value: 'mon', label: '周一' },
  { value: 'tue', label: '周二' },
  { value: 'wed', label: '周三' },
  { value: 'thu', label: '周四' },
  { value: 'fri', label: '周五' },
  { value: 'sat', label: '周六' },
  { value: 'sun', label: '周日' },
];

const repeatMonthDayOptions: Array<{ value: string; label: string }> = Array.from(
  { length: 31 },
  (_, index) => {
    const day = String(index + 1);
    return { value: day, label: `${day}号` };
  },
);

const repeatModeCascaderOptions: Array<{
  value: RepeatMode;
  label: string;
  children?: Array<{ value: string; label: string }>;
}> = [
  { value: 'none', label: '不重复' },
  { value: 'weekly', label: '每周', children: repeatWeekdayOptions },
  { value: 'monthly', label: '每月', children: repeatMonthDayOptions },
  { value: 'hourly', label: '每小时' },
];

const repeatModeLabelMap: Record<RepeatMode, string> = {
  none: '不重复',
  weekly: '每周',
  monthly: '每月',
  hourly: '每小时',
};

const repeatWeekdayLabelMap = repeatWeekdayOptions.reduce<Record<string, string>>((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

const repeatWeekdayValueMap = Object.entries(repeatWeekdayLabelMap).reduce<Record<string, string>>((acc, [value, label]) => {
  acc[label] = value;
  return acc;
}, {});

const englishWeekdayValueMap: Record<string, string> = {
  mon: 'mon',
  tue: 'tue',
  wed: 'wed',
  thu: 'thu',
  fri: 'fri',
  sat: 'sat',
  sun: 'sun',
};

const getRepeatLabel = (repeatMode: RepeatMode, repeatSubValue: string) => {
  if (repeatMode === 'weekly') {
    return `每周${repeatWeekdayLabelMap[repeatSubValue] ?? '周一'}`;
  }

  if (repeatMode === 'monthly') {
    return `每月${repeatSubValue || '1'}号`;
  }

  return repeatModeLabelMap[repeatMode];
};

const getRepeatTimePrefix = (repeatMode: RepeatMode, repeatSubValue: string) => {
  if (repeatMode === 'weekly') {
    return repeatWeekdayLabelMap[repeatSubValue] ?? '周一';
  }

  if (repeatMode === 'monthly') {
    return `${repeatSubValue || '1'}号`;
  }

  return repeatMode === 'none' ? '一次' : '每小时';
};

const pubmedMatchOptions: Array<{ value: PubMedMatchMode; label: string }> = [
  { value: 'all', label: '全部关键词' },
  { value: 'any', label: '任一关键词' },
  { value: 'advanced', label: '高级表达式' },
];

const pubmedMatchLabelValueMap: Record<string, PubMedMatchMode> = {
  全部关键词: 'all',
  任一关键词: 'any',
  高级表达式: 'advanced',
};

const parseScheduleFormFromTask = (task: UserTask): WeeklyScheduleForm => {
  if (task.scheduleConfig) {
    return {
      ...initialWeeklyScheduleForm,
      ...task.scheduleConfig,
      taskPrompt: task.scheduleConfig.taskPrompt || task.prompt,
    };
  }

  const timeMatch = task.trigger.match(/(\d{1,2}:\d{2})/);
  const rangeMatch = task.trigger.match(/(\d{4}-\d{2}-\d{2})~(\d{4}-\d{2}-\d{2})/);
  const weeklyCnMatch = task.trigger.match(/每周(周[一二三四五六日])/);
  const weeklyEnMatch = task.trigger.match(/^Weekly\s+(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/i);
  const monthlyMatch = task.trigger.match(/每月(\d{1,2})号/);

  let repeatMode: RepeatMode = initialWeeklyScheduleForm.repeatMode;
  let repeatSubValue = initialWeeklyScheduleForm.repeatSubValue;

  if (task.trigger.startsWith('每周') || /^Weekly/i.test(task.trigger)) {
    repeatMode = 'weekly';
    repeatSubValue = weeklyCnMatch
      ? repeatWeekdayValueMap[weeklyCnMatch[1]] ?? 'mon'
      : weeklyEnMatch
        ? englishWeekdayValueMap[weeklyEnMatch[1].toLowerCase()] ?? 'mon'
        : 'mon';
  } else if (task.trigger.startsWith('每月')) {
    repeatMode = 'monthly';
    repeatSubValue = monthlyMatch?.[1] ?? '1';
  } else if (task.trigger.startsWith('每小时') || /^Hourly/i.test(task.trigger)) {
    repeatMode = 'hourly';
    repeatSubValue = '';
  } else if (task.trigger.startsWith('不重复') || /^Daily/i.test(task.trigger)) {
    repeatMode = 'none';
    repeatSubValue = '';
  }

  const normalizedRunAt = timeMatch
    ? `${timeMatch[1].split(':')[0].padStart(2, '0')}:${timeMatch[1].split(':')[1]}`
    : initialWeeklyScheduleForm.runAt;

  return {
    ...initialWeeklyScheduleForm,
    repeatMode,
    repeatSubValue,
    startDate: rangeMatch?.[1] ?? initialWeeklyScheduleForm.startDate,
    endDate: rangeMatch?.[2] ?? initialWeeklyScheduleForm.endDate,
    runAt: normalizedRunAt,
    taskPrompt: task.prompt,
    projectId: null,
  };
};

const parseLiteratureFormFromTask = (task: UserTask): LiteratureTrackForm => {
  if (task.literatureConfig) {
    return {
      ...initialLiteratureTrackForm,
      ...task.literatureConfig,
      topic: task.literatureConfig.topic || task.name,
    };
  }

  const topicMatch = task.prompt.match(/主题：([^；;]+)/);
  const keywordsMatch = task.prompt.match(/关键词：([^；;]+)/);
  const sourceMatch = task.prompt.match(/来源：([^；;]+)/);
  const periodMatch = task.prompt.match(/任务周期：\s*(\d{4}-\d{2}-\d{2})\s*~\s*(\d{4}-\d{2}-\d{2})/);
  const matchModeMatch = task.prompt.match(/PubMed 匹配：([^；;]+)/);

  let frequency: FetchFrequency = initialLiteratureTrackForm.frequency;
  if (/^Weekly/i.test(task.trigger)) {
    frequency = 'weekly';
  } else if (/^Hourly/i.test(task.trigger) || task.trigger.startsWith('每小时')) {
    frequency = 'hourly';
  } else if (/^Daily/i.test(task.trigger)) {
    frequency = 'daily';
  }

  const sourceLabel = sourceMatch?.[1]?.trim() ?? '';
  const sourceType: SourceType = sourceLabel.toLowerCase().includes('biorxiv') ? 'biorxiv' : 'pubmed';
  const matchModeLabel = matchModeMatch?.[1]?.trim() ?? '';

  return {
    ...initialLiteratureTrackForm,
    topic: topicMatch?.[1]?.trim() || task.name,
    keywords: keywordsMatch?.[1]?.trim() || initialLiteratureTrackForm.keywords,
    sourceType,
    periodStart: periodMatch?.[1] ?? initialLiteratureTrackForm.periodStart,
    periodEnd: periodMatch?.[2] ?? initialLiteratureTrackForm.periodEnd,
    pubmedMatchMode: pubmedMatchLabelValueMap[matchModeLabel] ?? initialLiteratureTrackForm.pubmedMatchMode,
    frequency,
  };
};

const isLiteratureTask = (task: UserTask) => {
  if (task.taskType === 'literature' || task.templateId === 'template-paper-track') {
    return true;
  }

  return task.prompt.includes('关键词：') && task.prompt.includes('来源：') && task.prompt.includes('PubMed 匹配：');
};

const TASK_PROMPT_LINE_CHAR_LIMIT = 30;
const TASK_PROMPT_MAX_LINES = 3;

const buildTaskPromptPreview = (prompt: string) => {
  const promptChars = Array.from(prompt ?? '');
  const maxChars = TASK_PROMPT_LINE_CHAR_LIMIT * TASK_PROMPT_MAX_LINES;
  const hasOverflow = promptChars.length > maxChars;
  const visibleChars = hasOverflow
    ? [...promptChars.slice(0, Math.max(maxChars - 3, 0)), '.', '.', '.']
    : promptChars;

  const lines: string[] = [];
  for (let i = 0; i < visibleChars.length; i += TASK_PROMPT_LINE_CHAR_LIMIT) {
    lines.push(visibleChars.slice(i, i + TASK_PROMPT_LINE_CHAR_LIMIT).join(''));
  }

  return lines.join('\n');
};

export default function ToolsPage() {
  const navigate = useNavigate();
  const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<LayoutOutletContext>();
  const [tasks, setTasks] = useState<UserTask[]>(initialUserTasks);
  const [actionMenuTaskId, setActionMenuTaskId] = useState<string | null>(null);
  const [showLiteratureModal, setShowLiteratureModal] = useState(false);
  const [activeModalTemplateId, setActiveModalTemplateId] = useState<ModalTemplateId | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [pendingDeleteTaskId, setPendingDeleteTaskId] = useState<string | null>(null);
  const [literatureForm, setLiteratureForm] = useState<LiteratureTrackForm>(initialLiteratureTrackForm);
  const [weeklyScheduleForm, setWeeklyScheduleForm] = useState<WeeklyScheduleForm>(initialWeeklyScheduleForm);
  const [showWeeklyProjectDropdown, setShowWeeklyProjectDropdown] = useState(false);

  const closeTaskConfigModal = () => {
    setShowLiteratureModal(false);
    setActiveModalTemplateId(null);
    setEditingTaskId(null);
    setShowWeeklyProjectDropdown(false);
  };

  const isPaperTrackModal = activeModalTemplateId === 'template-paper-track';
  const isEditingTask = editingTaskId !== null;
  const modalTitle = isPaperTrackModal
    ? isEditingTask ? '修改文献订阅任务' : '设置文献订阅任务'
    : isEditingTask ? '修改定时任务' : '新建定时任务';
  const selectedWeeklyProject = mockProjects.find((project) => project.id === weeklyScheduleForm.projectId) ?? null;
  const pendingDeleteTask = useMemo(
    () => tasks.find((task) => task.id === pendingDeleteTaskId) ?? null,
    [tasks, pendingDeleteTaskId],
  );

  const repeatCascaderValue = useMemo<Array<string | number>>(() => {
    if (weeklyScheduleForm.repeatMode === 'weekly' || weeklyScheduleForm.repeatMode === 'monthly') {
      return [
        weeklyScheduleForm.repeatMode,
        weeklyScheduleForm.repeatSubValue ||
          (weeklyScheduleForm.repeatMode === 'weekly' ? 'mon' : '1'),
      ];
    }

    return [weeklyScheduleForm.repeatMode];
  }, [weeklyScheduleForm.repeatMode, weeklyScheduleForm.repeatSubValue]);

  const handleCreateFromTemplate = (template: TaskTemplate) => {
    if (template.id === 'template-paper-track') {
      setLiteratureForm({
        ...initialLiteratureTrackForm,
        topic: '',
      });
      setWeeklyScheduleForm(initialWeeklyScheduleForm);
      setShowWeeklyProjectDropdown(false);
      setEditingTaskId(null);
      setActiveModalTemplateId('template-paper-track');
      setShowLiteratureModal(true);
      return;
    }

    setLiteratureForm({
      ...initialLiteratureTrackForm,
      topic: template.name,
    });
    setWeeklyScheduleForm({
      ...initialWeeklyScheduleForm,
      taskPrompt: template.defaultPrompt,
      runAt: template.id === 'template-news-brief' ? '07:00' : initialWeeklyScheduleForm.runAt,
    });
    setShowWeeklyProjectDropdown(false);
    setEditingTaskId(null);
    setActiveModalTemplateId(template.id as ModalTemplateId);
    setShowLiteratureModal(true);
  };

  const handleCreateCustomTask = () => {
    setLiteratureForm({
      ...initialLiteratureTrackForm,
      topic: '',
    });
    setWeeklyScheduleForm({
      ...initialWeeklyScheduleForm,
      taskPrompt: '',
      projectId: null,
    });
    setShowWeeklyProjectDropdown(false);
    setEditingTaskId(null);
    setActiveModalTemplateId('template-custom');
    setShowLiteratureModal(true);
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

  const handleEditTask = (taskId: string) => {
    const targetTask = tasks.find((task) => task.id === taskId);
    if (!targetTask) return;

    const nextIsLiteratureTask = isLiteratureTask(targetTask);

    setEditingTaskId(taskId);
    setShowWeeklyProjectDropdown(false);

    if (nextIsLiteratureTask) {
      setActiveModalTemplateId('template-paper-track');
      setLiteratureForm(parseLiteratureFormFromTask(targetTask));
      setWeeklyScheduleForm(initialWeeklyScheduleForm);
      setShowLiteratureModal(true);
      setActionMenuTaskId(null);
      return;
    }

    setActiveModalTemplateId(
      targetTask.templateId && targetTask.templateId !== 'template-paper-track'
        ? targetTask.templateId
        : 'template-custom',
    );
    setLiteratureForm({
      ...initialLiteratureTrackForm,
      topic: targetTask.name,
    });
    setWeeklyScheduleForm(parseScheduleFormFromTask(targetTask));
    setShowLiteratureModal(true);
    setActionMenuTaskId(null);
  };

  const handleRequestDeleteTask = (taskId: string) => {
    setPendingDeleteTaskId(taskId);
    setActionMenuTaskId(null);
  };

  const handleCancelDeleteTask = () => {
    setPendingDeleteTaskId(null);
  };

  const handleConfirmDeleteTask = () => {
    if (!pendingDeleteTaskId) return;
    setTasks((prev) => prev.filter((task) => task.id !== pendingDeleteTaskId));
    setPendingDeleteTaskId(null);
  };

  const handleSourceTypeChange = (sourceType: SourceType) => {
    setLiteratureForm((prev) => ({
      ...prev,
      sourceType,
    }));
  };

  const handleRepeatCascaderChange = (value: Array<string | number>) => {
    const nextRepeatMode = String(value[0] ?? 'none') as RepeatMode;
    const nextSubValue = value[1] ? String(value[1]) : '';

    setWeeklyScheduleForm((prev) => ({
      ...prev,
      repeatMode: nextRepeatMode,
      repeatSubValue:
        nextRepeatMode === 'weekly'
          ? nextSubValue || (prev.repeatMode === 'weekly' ? prev.repeatSubValue : 'mon') || 'mon'
          : nextRepeatMode === 'monthly'
            ? nextSubValue || (prev.repeatMode === 'monthly' ? prev.repeatSubValue : '1') || '1'
            : '',
    }));
  };

  const buildLiteraturePrompt = () => {
    if (!isPaperTrackModal) {
      const repeatLabel = getRepeatLabel(
        weeklyScheduleForm.repeatMode,
        weeklyScheduleForm.repeatSubValue,
      );
      const projectLabel = selectedWeeklyProject?.name ?? '未选择';
      return `任务：${literatureForm.topic || '定时任务'}；项目：${projectLabel}；重复机制：${repeatLabel}；起止日期：${weeklyScheduleForm.startDate}~${weeklyScheduleForm.endDate}；执行时间：${weeklyScheduleForm.runAt}；任务内容：${weeklyScheduleForm.taskPrompt}`;
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

    if (!trimmedTopic) {
      return;
    }

    if (isPaperTrackModal) {
      if (
        !trimmedKeywords ||
        !literatureForm.periodStart ||
        !literatureForm.periodEnd ||
        literatureForm.periodStart > literatureForm.periodEnd
      ) {
        return;
      }
    } else if (!trimmedWeeklyPrompt) {
      return;
    }

    const normalizedScheduleForm: WeeklyScheduleForm = {
      ...weeklyScheduleForm,
      startDate: weeklyScheduleForm.startDate.replace(/\//g, '-'),
      endDate: weeklyScheduleForm.endDate.replace(/\//g, '-'),
      taskPrompt: trimmedWeeklyPrompt,
    };

    const normalizedLiteratureForm: LiteratureTrackForm = {
      ...literatureForm,
      topic: trimmedTopic,
      keywords: trimmedKeywords,
      periodStart: literatureForm.periodStart.replace(/\//g, '-'),
      periodEnd: literatureForm.periodEnd.replace(/\//g, '-'),
    };

    const triggerLabel = !isPaperTrackModal
      ? `${getRepeatLabel(normalizedScheduleForm.repeatMode, normalizedScheduleForm.repeatSubValue)} ${normalizedScheduleForm.startDate}~${normalizedScheduleForm.endDate} ${normalizedScheduleForm.runAt}`
      : normalizedLiteratureForm.frequency === 'daily'
        ? 'Daily at 09:00'
        : normalizedLiteratureForm.frequency === 'weekly'
          ? 'Weekly Mon 09:00'
          : 'Hourly';

    const nextTaskPayload: Omit<UserTask, 'id' | 'nextRun' | 'isEnabled'> = isPaperTrackModal
      ? {
          name: trimmedTopic,
          prompt: buildLiteraturePrompt(),
          trigger: triggerLabel,
          taskType: 'literature',
          templateId: 'template-paper-track',
          literatureConfig: normalizedLiteratureForm,
          scheduleConfig: undefined,
        }
      : {
          name: trimmedTopic,
          prompt: buildLiteraturePrompt(),
          trigger: triggerLabel,
          taskType: 'schedule',
          templateId: activeModalTemplateId ?? 'template-custom',
          scheduleConfig: normalizedScheduleForm,
          literatureConfig: undefined,
        };

    if (editingTaskId) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === editingTaskId
            ? {
                ...task,
                ...nextTaskPayload,
              }
            : task,
        ),
      );
      closeTaskConfigModal();
      return;
    }

    setTasks((prev) => [
      {
        id: `task-${Date.now()}`,
        nextRun: '--',
        isEnabled: true,
        ...nextTaskPayload,
      },
      ...prev,
    ]);

    closeTaskConfigModal();
  };

  const weeklyProjectMenuItems = useMemo<BaseActionMenuItem[]>(() => {
    const unselectedItem: BaseActionMenuItem = {
      key: 'none',
      label: '不选择项目',
      active: !selectedWeeklyProject,
    };

    const projectItems = mockProjects.map<BaseActionMenuItem>((project) => ({
      key: project.id,
      label: <span className="truncate">{project.name}</span>,
      active: selectedWeeklyProject?.id === project.id,
    }));

    return [unselectedItem, ...projectItems];
  }, [selectedWeeklyProject]);

  const weeklyProjectMenuFooterItems = useMemo<BaseActionMenuItem[]>(() => [
    {
      key: 'create',
      label: '新建项目',
      icon: <Plus size={16} />,
    },
  ], []);

  const handleWeeklyProjectMenuClick: BaseActionMenuProps['onItemClick'] = (item) => {
    if (item.key === 'create') {
      setShowWeeklyProjectDropdown(false);
      return;
    }

    setWeeklyScheduleForm((prev) => ({
      ...prev,
      projectId: item.key === 'none' ? null : item.key,
    }));
    setShowWeeklyProjectDropdown(false);
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
        render: (prompt) => (
          <span className="whitespace-pre-line break-all text-secondaryText">
            {buildTaskPromptPreview(String(prompt ?? ''))}
          </span>
        ),
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
            { key: 'delete', label: '删除', icon: <Trash2 size={14} />, danger: true },
          ];

          return (
            <BaseActionMenu
              open={actionMenuTaskId === task.id}
              onOpenChange={(open) => setActionMenuTaskId(open ? task.id : null)}
              placement="bottom-end"
              width={132}
              portal
              menuClassName="!min-w-[132px]"
              trigger={
                <span className="inline-flex rounded-md p-1 text-secondaryText transition-colors hover:bg-bgLight hover:text-primaryText">
                  <MoreHorizontal size={16} />
                </span>
              }
              items={actionItems}
              onItemClick={(item) => {
                if (item.key === 'rename') {
                  handleEditTask(task.id);
                  return;
                }
                handleRequestDeleteTask(task.id);
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
        visible={pendingDeleteTaskId !== null}
        title="确认删除任务"
        width={420}
        maskClosable={false}
        cancelText="取消"
        okText="删除"
        onCancel={handleCancelDeleteTask}
        onConfirm={handleConfirmDeleteTask}
        okButtonProps={{
          className: '!bg-[#F04438] !border-[#F04438] hover:!bg-[#D92D20] hover:!border-[#D92D20]',
        }}
      >
        <p className="text-sm text-primaryText">
          任务删除后将无法恢复，您确定要删除吗？
        </p>
      </BaseModal>

      <BaseModal
        visible={showLiteratureModal}
        title={modalTitle}
        width={600}
        className="tools-task-modal"
        okText={isEditingTask ? '保存修改' : '创建任务'}
        cancelText="取消"
        onCancel={closeTaskConfigModal}
        onConfirm={handleCreateLiteratureTask}
        okButtonProps={{
          disabled:
            !literatureForm.topic.trim() ||
            (isPaperTrackModal ? !literatureForm.keywords.trim() : !weeklyScheduleForm.taskPrompt.trim()),
        }}
      >
        <div className="space-y-5">
                <div>
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="text-sm font-medium text-primaryText">任务名称</span>
                  </div>
                  <BaseInput
                    value={literatureForm.topic}
                    onChange={(event) =>
                      setLiteratureForm((prev) => ({
                        ...prev,
                        topic: event.target.value,
                      }))
                    }
                    placeholder="请输入任务名称"
                    size="medium"
                    containerClassName="!px-3.5"
                  />
                </div>

                {!isPaperTrackModal ? (
                  <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <div className="mb-1.5 text-sm font-medium text-primaryText">任务周期</div>
                        <RangePicker
                          format="YYYY/MM/DD"
                          className="task-period-picker w-full"
                          popupClassName="task-period-picker-popup"
                          value={[
                            weeklyScheduleForm.startDate
                              ? dayjs(weeklyScheduleForm.startDate, 'YYYY-MM-DD')
                              : null,
                            weeklyScheduleForm.endDate
                              ? dayjs(weeklyScheduleForm.endDate, 'YYYY-MM-DD')
                              : null,
                          ]}
                          onChange={(_, dateStrings) => {
                            const [startDate, endDate] = dateStrings;
                            setWeeklyScheduleForm((prev) => ({
                              ...prev,
                              startDate,
                              endDate,
                            }));
                          }}
                        />
                      </div>

                      <div>
                        <div className="mb-1.5 text-sm font-medium text-primaryText">触发时间</div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="relative">
                            <Cascader
                              value={repeatCascaderValue as unknown as RepeatMode[]}
                              options={repeatModeCascaderOptions as unknown as { value: RepeatMode; label: string }[]}
                              onChange={(value) => handleRepeatCascaderChange(value as Array<string | number>)}
                              className="task-repeat-cascader w-full"
                              popupClassName="task-repeat-cascader-popup"
                              placeholder="请选择重复方式"
                            />
                          </div>

                          <div>
                            <TimePicker
                              value={dayjs(weeklyScheduleForm.runAt, 'HH:mm')}
                              format="HH:mm"
                              minuteStep={1}
                              allowClear={false}
                              onChange={(value) =>
                                setWeeklyScheduleForm((prev) => ({
                                  ...prev,
                                  runAt: value ? value.format('HH:mm') : prev.runAt,
                                }))
                              }
                              className="task-run-time-picker w-full"
                              popupClassName="task-run-time-picker-popup"
                            />
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
                        <div className="absolute bottom-4 left-3 z-20">
                          <BaseActionMenu
                            open={showWeeklyProjectDropdown}
                            onOpenChange={setShowWeeklyProjectDropdown}
                            placement="top-start"
                            width={260}
                            trigger={
                              <span className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-secondaryText transition-colors hover:bg-bgLight">
                                <Folder size={14} />
                                <span className="max-w-[140px] truncate">
                                  {selectedWeeklyProject ? selectedWeeklyProject.name : '工作项目'}
                                </span>
                                <ChevronDown size={14} />
                              </span>
                            }
                            items={weeklyProjectMenuItems}
                            onItemClick={handleWeeklyProjectMenuClick}
                            className="!inline-flex"
                            listClassName="max-h-[220px] overflow-y-auto"
                            footerItems={weeklyProjectMenuFooterItems}
                          />
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

                {isPaperTrackModal && (
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