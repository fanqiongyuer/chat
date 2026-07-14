import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ChevronDown, CircleHelp, Menu } from 'lucide-react';
import { type LayoutOutletContext } from '../components/Layout';
import { BaseActionMenu, BaseTable, type BaseActionMenuItem, type BaseTableColumn } from '../components';
import { mockProjects } from '../mock/projects';

type ViewTab = 'analysis' | 'users';
type TimeRange = 'yesterday' | 'week' | 'month' | 'custom';
type TimeSlot = 'all' | 'work' | 'off';
type RatioView = 'project' | 'member';

type MemberProfile = {
  id: string;
  name: string;
  role: '管理员' | '成员';
  weight: number;
};

type ProjectUsageRow = {
  id: string;
  name: string;
  members: number;
  usage: number;
  ratio: string;
};

type MemberUsageRow = MemberProfile & {
  usage: number;
  ratio: string;
};

type RechargeRecordRow = {
  id: string;
  amount: string;
  rechargeTime: string;
};

const memberProfiles: MemberProfile[] = [
  { id: 'mira', name: 'Mira', role: '管理员', weight: 1.25 },
  { id: 'maodan', name: '毛单', role: '成员', weight: 1.0 },
  { id: 'solit', name: 'Solit', role: '成员', weight: 0.92 },
  { id: 'zqj', name: '张庆杰', role: '成员', weight: 0.78 },
];

const memberSelectOptions = [
  { label: '全部成员', value: 'all' },
  ...memberProfiles.map((member) => ({ label: member.name, value: member.id })),
];

const monthSelectOptions = Array.from({ length: 12 }, (_, offset) => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - offset);

  const year = date.getFullYear();
  const month = date.getMonth();

  return {
    label: `${year}年${month + 1}月`,
    value: `${year}-${String(month + 1).padStart(2, '0')}`,
  };
});

const rangeLabelMap: Record<TimeRange, string> = {
  yesterday: '昨日',
  week: '近一周',
  month: '近一个月',
  custom: '自定义',
};

const rangeOptions: Array<{ label: string; value: TimeRange }> = [
  { label: '昨日', value: 'yesterday' },
  { label: '近一周', value: 'week' },
  { label: '近一个月', value: 'month' },
];

const ratioOptions: Array<{ label: string; value: RatioView }> = [
  { label: '项目', value: 'project' },
  { label: '成员', value: 'member' },
];

const rangeBaseTotal: Record<TimeRange, number> = {
  yesterday: 120_450,
  week: 703_100,
  month: 2_945_200,
  custom: 352_000,
};

const slotFactor: Record<TimeSlot, number> = {
  all: 1,
  work: 0.76,
  off: 0.24,
};

const hourlyPattern = [
  3200, 3200, 3200, 3200, 3200, 3250, 3400, 3800, 4400, 5200, 6000, 6600,
  6900, 6600, 6000, 5200, 4400, 3800, 3400, 3250, 3200, 3200, 3200, 3200,
];

const weekPattern = [88_000, 95_600, 91_200, 108_500, 103_300, 109_700, 106_800];

const monthPattern = Array.from({ length: 30 }, (_, index) => {
  const cycle = Math.sin((index / 30) * Math.PI * 2) * 0.22;
  return Math.round(91_000 + cycle * 18_000 + (index % 6) * 1200);
});

const customPattern = [76_000, 89_000, 95_000, 92_000];

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

function formatDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

function generateMonthTrendPoints(monthValue: string, memberFactor: number): number[] {
  const [yearText, monthText] = monthValue.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const daysInMonth = new Date(year, month, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const weekDay = new Date(year, month - 1, day).getDay();
    const isWeekend = weekDay === 0 || weekDay === 6;
    const base = 84_000 + ((month * 19 + day * 11) % 7) * 4_300;
    const wave = 1 + Math.sin((day / daysInMonth) * Math.PI * 2) * 0.16;
    const weekendFactor = isWeekend ? 0.72 : 1;
    return Math.round(base * wave * weekendFactor * memberFactor);
  });
}

function getRangeDates(range: TimeRange): string {
  const end = new Date();
  end.setHours(0, 0, 0, 0);

  const start = new Date(end);
  if (range === 'yesterday') {
    start.setDate(start.getDate() - 1);
    return `${formatDate(start)} - ${formatDate(start)}`;
  }

  if (range === 'week') start.setDate(start.getDate() - 6);
  if (range === 'month') start.setDate(start.getDate() - 29);
  if (range === 'custom') start.setDate(start.getDate() - 3);

  return `${formatDate(start)} - ${formatDate(end)}`;
}

function buildSvgPath(points: number[], width: number, height: number, padding = 10): string {
  if (points.length === 0) return '';

  const maxVal = Math.max(...points);
  const minVal = Math.min(...points);
  const drawableHeight = Math.max(1, height - padding * 2);
  const xGap = points.length > 1 ? width / (points.length - 1) : width;
  const range = Math.max(1, maxVal - minVal);

  const coords = points.map((point, index) => {
    const x = index * xGap;
    const y = padding + ((maxVal - point) / range) * drawableHeight;
    return { x, y };
  });

  if (coords.length <= 2) {
    return coords
      .map((coord, index) => `${index === 0 ? 'M' : 'L'}${coord.x.toFixed(2)} ${coord.y.toFixed(2)}`)
      .join(' ');
  }

  let path = `M${coords[0].x.toFixed(2)} ${coords[0].y.toFixed(2)}`;
  for (let index = 1; index < coords.length - 1; index += 1) {
    const current = coords[index];
    const next = coords[index + 1];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    path += ` Q${current.x.toFixed(2)} ${current.y.toFixed(2)}, ${midX.toFixed(2)} ${midY.toFixed(2)}`;
  }

  const penultimate = coords[coords.length - 2];
  const last = coords[coords.length - 1];
  path += ` Q${penultimate.x.toFixed(2)} ${penultimate.y.toFixed(2)}, ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;

  return path;
}

function UsageAmountBarChart({
  points,
  labels,
  totalAmount,
}: {
  points: number[];
  labels: string[];
  totalAmount: number;
}) {
  const chartLeft = 52;
  const chartRight = 980;
  const chartTop = 18;
  const chartBottom = 156;
  const chartHeight = chartBottom - chartTop;
  const chartWidth = chartRight - chartLeft;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxAmount = useMemo(() => Math.max(...points, 1), [points]);

  const axisTicks = useMemo(() => [maxAmount, 0], [maxAmount]);

  const labelStep = useMemo(() => {
    if (points.length <= 10) return 1;
    return Math.ceil(points.length / 6);
  }, [points.length]);

  const barGap = useMemo(() => {
    if (points.length <= 1) return 0;
    return Math.min(6, chartWidth / points.length / 2.5);
  }, [chartWidth, points.length]);

  const barWidth = useMemo(() => {
    if (points.length === 0) return 0;
    return Math.max(3, (chartWidth - (points.length - 1) * barGap) / points.length);
  }, [barGap, chartWidth, points.length]);

  const formatAxisAmount = (value: number) => {
    if (value >= 10_000) return `￥${(value / 10_000).toFixed(1)}万`;
    return `￥${formatNumber(value)}`;
  };

  return (
    <div>
      <div className="mb-3">
        <div className="text-sm font-semibold text-primaryText">月度用量</div>
        <div className="mt-1 text-xs text-tertiaryText">
          消耗金额
          <span className="ml-1 text-primaryText">￥{formatNumber(totalAmount)}</span>
        </div>
      </div>

      <div className="relative h-[190px] w-full">
        <svg viewBox="0 0 1000 190" preserveAspectRatio="none" className="h-full w-full">
          {axisTicks.map((tick) => {
            const y = chartBottom - (tick / maxAmount) * chartHeight;
            return (
              <g key={tick}>
                <line
                  x1={chartLeft}
                  x2={chartRight}
                  y1={y.toFixed(2)}
                  y2={y.toFixed(2)}
                  stroke="var(--color-line-subtle)"
                  strokeWidth="1"
                />
                <text x={chartLeft - 8} y={y + 4} textAnchor="end" fill="var(--color-tertiaryText)" fontSize="11">
                  {formatAxisAmount(tick)}
                </text>
              </g>
            );
          })}

          {points.map((point, index) => {
            const barHeight = (point / maxAmount) * chartHeight;
            const x = chartLeft + index * (barWidth + barGap);
            const y = chartBottom - barHeight;
            const label = labels[index] ?? '';
            const showLabel = index % labelStep === 0 || index === points.length - 1;

            return (
              <g key={`${label}-${index}`} onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)}>
                <rect
                  x={x.toFixed(2)}
                  y={y.toFixed(2)}
                  width={barWidth.toFixed(2)}
                  height={Math.max(1, barHeight).toFixed(2)}
                  rx="1.5"
                  fill={hoveredIndex === index ? '#059669' : '#10b981'}
                />
                {showLabel && (
                  <text
                    x={(x + barWidth / 2).toFixed(2)}
                    y={chartBottom + 14}
                    textAnchor="middle"
                    fill="var(--color-tertiaryText)"
                    fontSize="11"
                  >
                    {label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {hoveredIndex !== null && (
          <div
            className="pointer-events-none absolute top-0 z-20 -translate-x-1/2 rounded-lg bg-gray-7 px-2.5 py-2 text-xs text-white shadow-md"
            style={{
              left: `${((chartLeft + hoveredIndex * (barWidth + barGap) + barWidth / 2) / 1000) * 100}%`,
            }}
          >
            <div className="text-tertiaryText">{labels[hoveredIndex]}</div>
            <div className="mt-0.5 font-semibold text-[#10b981]">￥{formatNumber(points[hoveredIndex])}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AiUsagePage() {
  const { isSidebarOpen, setIsSidebarOpen, setAiUsageWarningActive } = useOutletContext<LayoutOutletContext>();
  const [activeTab, setActiveTab] = useState<ViewTab>('analysis');
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    monthSelectOptions[0]?.value ?? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
  );
  const selectedSlot: TimeSlot = 'all';
  const [selectedRange, setSelectedRange] = useState<TimeRange>('yesterday');
  const [ratioView, setRatioView] = useState<RatioView>('project');
  const [memberMenuOpen, setMemberMenuOpen] = useState(false);
  const [monthMenuOpen, setMonthMenuOpen] = useState(false);

  const selectedMemberLabel = useMemo(
    () => memberSelectOptions.find((option) => String(option.value) === selectedMember)?.label ?? '全部成员',
    [selectedMember],
  );

  const selectedMonthLabel = useMemo(
    () => monthSelectOptions.find((option) => String(option.value) === selectedMonth)?.label ?? selectedMonth,
    [selectedMonth],
  );

  const memberMenuItems = useMemo<BaseActionMenuItem[]>(
    () =>
      memberSelectOptions.map((option) => ({
        key: `member-${option.value}`,
        label: option.label,
        active: String(option.value) === selectedMember,
      })),
    [selectedMember],
  );

  const monthMenuItems = useMemo<BaseActionMenuItem[]>(
    () =>
      monthSelectOptions.map((option) => ({
        key: `month-${option.value}`,
        label: option.label,
        active: String(option.value) === selectedMonth,
      })),
    [selectedMonth],
  );

  const handleMemberMenuItemClick = useCallback((item: BaseActionMenuItem) => {
    const nextValue = item.key.replace('member-', '');
    setSelectedMember(nextValue);
    setMemberMenuOpen(false);
  }, []);

  const handleMonthMenuItemClick = useCallback((item: BaseActionMenuItem) => {
    const nextValue = item.key.replace('month-', '');
    setSelectedMonth(nextValue);
    setMonthMenuOpen(false);
  }, []);

  const currentMembers = useMemo(() => {
    if (selectedMember === 'all') return memberProfiles;
    return memberProfiles.filter((member) => member.id === selectedMember);
  }, [selectedMember]);

  const memberWeightSum = useMemo(
    () => currentMembers.reduce((sum, member) => sum + member.weight, 0),
    [currentMembers],
  );

  const totalWeight = useMemo(
    () => memberProfiles.reduce((sum, member) => sum + member.weight, 0),
    [],
  );

  const currentTotal = useMemo(() => {
    const base = rangeBaseTotal[selectedRange];
    const memberFactor = memberWeightSum / totalWeight;
    return base * memberFactor * slotFactor[selectedSlot];
  }, [memberWeightSum, selectedRange, selectedSlot, totalWeight]);

  const trendPoints = useMemo(() => {
    const memberFactor = memberWeightSum / totalWeight;
    return generateMonthTrendPoints(selectedMonth, memberFactor);
  }, [memberWeightSum, selectedMonth, totalWeight]);

  const projectRows = useMemo<ProjectUsageRow[]>(() => {
    const totalProjectChats = mockProjects.reduce((sum, project) => sum + project.count, 0) || 1;

    return mockProjects.map((project) => {
      const usage = currentTotal * (project.count / totalProjectChats);
      return {
        id: project.id,
        name: project.name,
        members: project.members,
        usage,
        ratio: `${((usage / currentTotal) * 100 || 0).toFixed(1)}%`,
      };
    });
  }, [currentTotal]);

  const memberRows = useMemo<MemberUsageRow[]>(() => {
    const monthTotal = trendPoints.reduce((sum, point) => sum + point, 0);
    const rows = currentMembers.map((member) => {
      const usage = monthTotal * (member.weight / totalWeight);
      return { ...member, usage };
    });

    const sum = rows.reduce((acc, row) => acc + row.usage, 0) || 1;
    return rows.map((row) => ({
      ...row,
      ratio: `${((row.usage / sum) * 100).toFixed(1)}%`,
    }));
  }, [currentMembers, totalWeight, trendPoints]);

  const filteredMonthlyTotal = useMemo(() => trendPoints.reduce((sum, point) => sum + point, 0), [trendPoints]);

  // Top summary cards are global totals, not affected by detail filters.
  const summaryTrendPoints = useMemo(
    () => generateMonthTrendPoints(monthSelectOptions[0]?.value ?? selectedMonth, 1),
    [selectedMonth],
  );

  const summaryMonthlyTotal = useMemo(
    () => summaryTrendPoints.reduce((sum, point) => sum + point, 0),
    [summaryTrendPoints],
  );

  const summarySevenDayTotal = useMemo(
    () => summaryTrendPoints.slice(-7).reduce((sum, point) => sum + point, 0),
    [summaryTrendPoints],
  );

  const accountBalance = useMemo(() => Math.max(0, 40_000_000 - summaryMonthlyTotal), [summaryMonthlyTotal]);

  const remainingDays = useMemo(() => {
    const summaryDailyAvg = summarySevenDayTotal / 7;
    if (summaryDailyAvg <= 0) return 0;
    // Mock: keep remaining days within 7 to verify warning UI.
    return Math.min(7, Math.max(0, Math.floor(accountBalance / summaryDailyAvg)));
  }, [accountBalance, summarySevenDayTotal]);

  const isBudgetLow = remainingDays <= 7;

  useEffect(() => {
    setAiUsageWarningActive(isBudgetLow);
  }, [isBudgetLow, setAiUsageWarningActive]);

  const overviewCards = useMemo(
    () => [
      { title: '帐户余额', value: formatNumber(accountBalance), helper: '' },
      { title: '本月消耗金额', value: formatNumber(summaryMonthlyTotal), helper: '' },
      {
        title: '剩余天数预估',
        value: formatNumber(remainingDays),
        helper: '',
        tooltip: '基于近7日日均消耗量预估',
        warningLabel: isBudgetLow ? '即将耗尽' : '',
      },
    ],
    [accountBalance, isBudgetLow, remainingDays, summaryMonthlyTotal],
  );

  const trendLabels = useMemo(() => {
    const [, monthText] = selectedMonth.split('-');
    const month = Number(monthText);
    return trendPoints.map((_, index) => `${month}-${index + 1}`);
  }, [selectedMonth, trendPoints]);

  const projectTableColumns = useMemo<BaseTableColumn<ProjectUsageRow>[]>(
    () => [
      {
        title: '项目',
        dataIndex: 'name',
        width: '34%',
        render: (value: string) => <span className="block truncate">{value}</span>,
      },
      {
        title: '成员数',
        dataIndex: 'members',
        width: '22%',
        render: (value: number) => <span className="text-secondaryText">{value}</span>,
      },
      {
        title: '消耗量',
        dataIndex: 'usage',
        width: '24%',
        render: (value: number) => formatNumber(value),
      },
      {
        title: '占比',
        dataIndex: 'ratio',
        width: '20%',
      },
    ],
    [],
  );

  const memberTableColumns = useMemo<BaseTableColumn<MemberUsageRow>[]>(
    () => [
      {
        title: '成员',
        dataIndex: 'name',
        width: '34%',
        render: (value: string) => <span className="block truncate">{value}</span>,
      },
      {
        title: '角色',
        dataIndex: 'role',
        width: '22%',
        render: (value: MemberProfile['role']) => <span className="text-secondaryText">{value}</span>,
      },
      {
        title: '消耗量',
        dataIndex: 'usage',
        width: '24%',
        render: (value: number) => formatNumber(value),
      },
      {
        title: '占比',
        dataIndex: 'ratio',
        width: '20%',
      },
    ],
    [],
  );

  const rechargeRows = useMemo<RechargeRecordRow[]>(
    () => [
      { id: 'r-20240115', amount: '￥100', rechargeTime: '2024.01.15' },
      { id: 'r-20240110', amount: '￥50', rechargeTime: '2024.01.10' },
      { id: 'r-20240105', amount: '￥200', rechargeTime: '2024.01.05' },
      { id: 'r-20231228', amount: '￥150', rechargeTime: '2023.12.28' },
    ],
    [],
  );

  const rechargeTableColumns = useMemo<BaseTableColumn<RechargeRecordRow>[]>(
    () => [
      {
        title: '充值金额',
        dataIndex: 'amount',
        width: '50%',
        render: (value: string) => <span className="text-primaryText font-medium">{value}</span>,
      },
      {
        title: '充值时间',
        dataIndex: 'rechargeTime',
        width: '50%',
        render: (value: string) => <span className="text-secondaryText">{value}</span>,
      },
    ],
    [],
  );

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <header className="z-10 flex h-16 shrink-0 items-center bg-white/80 px-4 backdrop-blur-sm">
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
            <span className="text-tertiaryText">系统设置</span>
            <span className="text-tertiaryText">/</span>
            <span className="font-medium text-primaryText">AI用量</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-10 pt-2 md:px-8 lg:px-10 md:pb-12 md:pt-3">
        <div className="max-w-[1240px] mx-auto space-y-5">
          <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {overviewCards.map((card) => (
              <div key={card.title} className="h-[118px] rounded-xl px-4" style={{ backgroundColor: 'rgba(242, 243, 245, 0.4)' }}>
                <div className="flex h-full flex-col justify-center">
                  <div className="flex items-center gap-1 text-sm text-tertiaryText">
                    <span>{card.title}</span>
                    {card.tooltip && (
                      <div className="group relative inline-flex">
                        <CircleHelp size={14} className="cursor-help text-tertiaryText opacity-80" />
                        <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-1.5 w-max -translate-x-1/2 rounded-md bg-gray-7 px-2 py-1 text-xs text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                          {card.tooltip}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="text-[30px] leading-none font-semibold text-primaryText whitespace-nowrap overflow-hidden text-ellipsis">{card.value}</div>
                    {card.warningLabel ? (
                      <span className="inline-flex shrink-0 items-center rounded-full bg-danger-soft px-2 py-0.5 text-xs font-medium text-danger">
                        {card.warningLabel}
                      </span>
                    ) : null}
                  </div>
                  {card.helper ? <div className="mt-2 text-sm text-tertiaryText">{card.helper}</div> : null}
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-xl bg-white">
            <div className="flex items-center justify-between border-b border-line-subtle pl-0 pr-0 pt-3">
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  onClick={() => setActiveTab('analysis')}
                  className={`pb-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'analysis'
                      ? 'border-[var(--color-primary)] text-primaryText'
                      : 'border-transparent text-tertiaryText'
                  }`}
                >
                  消耗分析
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className={`pb-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'users' ? 'border-[var(--color-primary)] text-primaryText' : 'border-transparent text-tertiaryText'
                  }`}
                >
                  充值记录
                </button>
              </div>
            </div>

            {activeTab === 'analysis' && (
              <div className="pl-0 pr-0 py-5">
                <div className="flex flex-wrap items-center gap-2 text-sm text-secondaryText">
                  <BaseActionMenu
                    open={memberMenuOpen}
                    onOpenChange={setMemberMenuOpen}
                    items={memberMenuItems}
                    onItemClick={handleMemberMenuItemClick}
                    placement="bottom-start"
                    width={172}
                    portal
                    menuClassName="!min-w-[172px] !rounded-lg !border !border-border !p-1.5 !shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
                    listClassName="max-h-[240px] overflow-y-auto"
                    trigger={
                      <span className="inline-flex h-10 min-w-[172px] items-center justify-between rounded-xl border border-border bg-white px-4 text-sm text-primaryText transition-colors hover:border-[var(--color-primary)]">
                        <span className="truncate">{selectedMemberLabel}</span>
                        <ChevronDown size={16} className={`ml-2 shrink-0 text-secondaryText transition-transform ${memberMenuOpen ? 'rotate-180' : ''}`} />
                      </span>
                    }
                  />

                  <BaseActionMenu
                    open={monthMenuOpen}
                    onOpenChange={setMonthMenuOpen}
                    items={monthMenuItems}
                    onItemClick={handleMonthMenuItemClick}
                    placement="bottom-start"
                    width={172}
                    portal
                    menuClassName="!min-w-[172px] !rounded-lg !border !border-border !p-1.5 !shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
                    listClassName="max-h-[240px] overflow-y-auto"
                    trigger={
                      <span className="inline-flex h-10 min-w-[172px] items-center justify-between rounded-xl border border-border bg-white px-4 text-sm text-primaryText transition-colors hover:border-[var(--color-primary)]">
                        <span className="truncate">{selectedMonthLabel}</span>
                        <ChevronDown size={16} className={`ml-2 shrink-0 text-secondaryText transition-transform ${monthMenuOpen ? 'rotate-180' : ''}`} />
                      </span>
                    }
                  />
                </div>
              </div>
            )}

            {activeTab === 'analysis' ? (
              <>
                <div className="pl-0 pr-0 py-4">
                  <UsageAmountBarChart points={trendPoints} labels={trendLabels} totalAmount={filteredMonthlyTotal} />
                </div>

              </>
            ) : (
              <div className="pl-0 pr-0 pt-4 pb-5">
                <div className="border-b border-borderGray bg-white">
                  <BaseTable
                    className="task-table-scroll min-w-[760px]"
                    columns={rechargeTableColumns}
                    dataSource={rechargeRows}
                    rowKey="id"
                  />
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

    </div>
  );
}