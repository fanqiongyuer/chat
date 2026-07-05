import React, { useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { type LayoutOutletContext } from '../components/Layout';
import { BaseModal, BaseSelect, BaseSegmented, BaseTable, type BaseTableColumn } from '@/components';
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
  members: string;
  usage: number;
  ratio: string;
};

type MemberUsageRow = MemberProfile & {
  usage: number;
  ratio: string;
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

const slotSelectOptions = [
  { label: '全部角色', value: 'all' },
  { label: '工作时段', value: 'work' },
  { label: '非工作时段', value: 'off' },
];

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
  { label: '自定义', value: 'custom' },
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

function UsageTrendChart({
  points,
  leftLabel,
  rightLabel,
}: {
  points: number[];
  leftLabel: string;
  rightLabel: string;
}) {
  const viewWidth = 1000;
  const viewHeight = 150;
  const viewPadding = 16;
  const chartRef = useRef<HTMLDivElement>(null);
  const [hoverData, setHoverData] = useState<{
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
    chartWidth: number;
    chartHeight: number;
    value: number;
  } | null>(null);

  const trendPath = useMemo(() => buildSvgPath(points, viewWidth, viewHeight, viewPadding), [points]);

  const metrics = useMemo(() => {
    const maxVal = Math.max(...points);
    const minVal = Math.min(...points);
    const range = Math.max(1, maxVal - minVal);
    const average = points.reduce((sum, value) => sum + value, 0) / Math.max(points.length, 1);
    return { maxVal, minVal, range, average };
  }, [points]);

  const getYByValue = (value: number) => {
    const drawableHeight = viewHeight - viewPadding * 2;
    return viewPadding + ((metrics.maxVal - value) / metrics.range) * drawableHeight;
  };

  const guideLineY = getYByValue(metrics.average);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!chartRef.current || points.length === 0) return;

    const rect = chartRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));

    const x = ratio * viewWidth;
    const position = ratio * (points.length - 1);
    const leftIndex = Math.floor(position);
    const rightIndex = Math.min(points.length - 1, leftIndex + 1);
    const progress = position - leftIndex;

    const leftValue = points[leftIndex];
    const rightValue = points[rightIndex];
    const interpolatedValue = leftValue + (rightValue - leftValue) * progress;
    const y = getYByValue(interpolatedValue);

    setHoverData({
      x,
      y,
      offsetX: event.clientX - rect.left,
      offsetY: (y / viewHeight) * rect.height,
      chartWidth: rect.width,
      chartHeight: rect.height,
      value: Math.max(0, Math.round(interpolatedValue)),
    });
  };

  const handleMouseLeave = () => {
    setHoverData(null);
  };

  const tooltipStyle = useMemo(() => {
    if (!hoverData) return undefined;

    const tooltipWidth = 136;
    const tooltipHeight = 56;
    const edgePadding = 8;
    const offset = 12;

    let left = hoverData.offsetX + offset;
    const maxLeft = Math.max(edgePadding, hoverData.chartWidth - tooltipWidth - edgePadding);

    if (left > maxLeft) {
      left = hoverData.offsetX - tooltipWidth - offset;
    }

    left = Math.max(edgePadding, Math.min(left, maxLeft));

    let top = hoverData.offsetY - tooltipHeight - offset;
    if (top < edgePadding) {
      top = hoverData.offsetY + offset;
    }

    const maxTop = Math.max(edgePadding, hoverData.chartHeight - tooltipHeight - edgePadding);
    top = Math.max(edgePadding, Math.min(top, maxTop));

    return { left: `${left}px`, top: `${top}px` };
  }, [hoverData]);

  return (
    <>
      <div
        ref={chartRef}
        className="relative mt-3 h-[150px] w-full cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <svg viewBox="0 0 1000 150" preserveAspectRatio="none" className="h-full w-full">
          <line
            x1="0"
            x2="1000"
            y1={guideLineY.toFixed(2)}
            y2={guideLineY.toFixed(2)}
            stroke="var(--color-line-subtle)"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <path d={trendPath} fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />
          {hoverData && (
            <>
              <line
                x1={hoverData.x.toFixed(2)}
                y1="0"
                x2={hoverData.x.toFixed(2)}
                y2={viewHeight - viewPadding}
                stroke="var(--color-primary)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <circle cx={hoverData.x.toFixed(2)} cy={hoverData.y.toFixed(2)} r="6" fill="var(--color-primary)" fillOpacity="0.24" />
              <circle cx={hoverData.x.toFixed(2)} cy={hoverData.y.toFixed(2)} r="3" fill="var(--color-primary)" />
            </>
          )}
        </svg>

        {hoverData && (
          <div
            className="pointer-events-none absolute z-30 rounded-lg bg-gray-7 px-2.5 py-2 text-sm text-white shadow-md"
            style={tooltipStyle}
          >
            <div className="text-sm text-tertiaryText">当前时刻消耗</div>
              <div className="font-semibold text-[var(--color-primary)]">
              {formatNumber(hoverData.value)}
              <span className="ml-1 text-sm font-normal text-white">Tokens</span>
            </div>
          </div>
        )}
      </div>

      <div className="-mt-1 flex items-center justify-between text-sm text-tertiaryText">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </>
  );
}

export default function AiUsagePage() {
  const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<LayoutOutletContext>();
  const [activeTab, setActiveTab] = useState<ViewTab>('analysis');
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot>('all');
  const [selectedRange, setSelectedRange] = useState<TimeRange>('yesterday');
  const [ratioView, setRatioView] = useState<RatioView>('project');
  const [showRechargeModal, setShowRechargeModal] = useState(false);

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
    const sourcePattern =
      selectedRange === 'yesterday'
        ? hourlyPattern
        : selectedRange === 'week'
          ? weekPattern
          : selectedRange === 'month'
            ? monthPattern
            : customPattern;

    const memberFactor = memberWeightSum / totalWeight;
    return sourcePattern.map((point) => point * memberFactor * slotFactor[selectedSlot]);
  }, [memberWeightSum, selectedRange, selectedSlot, totalWeight]);

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
    const rows = currentMembers.map((member) => {
      const usage = rangeBaseTotal[selectedRange] * (member.weight / totalWeight) * slotFactor[selectedSlot];
      return { ...member, usage };
    });

    const sum = rows.reduce((acc, row) => acc + row.usage, 0) || 1;
    return rows.map((row) => ({
      ...row,
      ratio: `${((row.usage / sum) * 100).toFixed(1)}%`,
    }));
  }, [currentMembers, selectedRange, selectedSlot, totalWeight]);

  // Top summary cards are global totals, not affected by detail filters.
  const monthlyTotal = useMemo(() => rangeBaseTotal.month, []);

  const sevenDayTotal = useMemo(() => rangeBaseTotal.week, []);

  const tokenTotal = useMemo(() => monthlyTotal * 11.7, [monthlyTotal]);

  const remainingDays = useMemo(() => {
    const summaryDailyAvg = sevenDayTotal / 7;
    if (summaryDailyAvg <= 0) return 0;
    return Math.max(0, Math.floor((40_000_000 - monthlyTotal) / summaryDailyAvg));
  }, [monthlyTotal, sevenDayTotal]);

  const overviewCards = useMemo(
    () => [
      { title: 'Token 用量', value: formatNumber(tokenTotal), helper: '' },
      { title: '本月消耗', value: formatNumber(monthlyTotal), helper: '环比上月↑18%' },
      { title: '近7日消耗', value: formatNumber(sevenDayTotal), helper: `日均 ${formatNumber(sevenDayTotal / 7)} /天` },
      { title: '剩余续航天数(天)', value: formatNumber(remainingDays), helper: '基于近7日，日均消耗量' },
    ],
    [monthlyTotal, remainingDays, sevenDayTotal, tokenTotal],
  );

  const rangeDateText = useMemo(() => getRangeDates(selectedRange), [selectedRange]);

  const trendRangeLabel = selectedRange === 'yesterday' ? '00:00' : selectedRange === 'week' ? '7天前' : '30天前';

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
        render: (value: string) => <span className="text-secondaryText">{value}</span>,
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

  const detailTableColumns = useMemo<BaseTableColumn<MemberUsageRow>[]>(
    () => [
      {
        title: '成员',
        dataIndex: 'name',
        width: '25%',
      },
      {
        title: '角色',
        dataIndex: 'role',
        width: '20%',
        render: (value: MemberProfile['role']) => <span className="text-secondaryText">{value}</span>,
      },
      {
        title: '当前周期消耗',
        dataIndex: 'usage',
        width: '30%',
        render: (value: number) => formatNumber(value),
      },
      {
        title: '建议日上限',
        dataIndex: 'usage',
        key: 'dailyLimit',
        width: '25%',
        render: (value: number) => <span className="text-secondaryText">{formatNumber(value / 7)}</span>,
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
          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {overviewCards.map((card) => (
              <div key={card.title} className="rounded-xl px-4 py-4" style={{ backgroundColor: 'rgba(242, 243, 245, 0.4)' }}>
                <div className="text-sm text-tertiaryText">{card.title}</div>
                <div className="mt-3 text-2xl leading-none font-semibold text-primaryText">{card.value}</div>
                <div className="mt-2 min-h-5 text-sm text-tertiaryText">{card.helper}</div>
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
                  帐户明细
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowRechargeModal(true)}
                className="pb-2 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors font-medium"
              >
                充值记录
              </button>
            </div>

            <div className="pl-0 pr-0 py-5">
              <div className="flex flex-wrap items-center gap-2 text-sm text-secondaryText">
                <BaseSelect
                  options={memberSelectOptions}
                  value={selectedMember}
                  onChange={(value) => setSelectedMember(String(value))}
                  size="medium"
                />

                <BaseSelect
                  options={slotSelectOptions}
                  value={selectedSlot}
                  onChange={(value) => setSelectedSlot(value as TimeSlot)}
                  size="medium"
                />

                <BaseSegmented
                  options={rangeOptions}
                  value={selectedRange}
                  onChange={(value) => setSelectedRange(value as TimeRange)}
                  size="middle"
                />

                <span className="ml-1 text-tertiaryText">{rangeDateText}</span>
              </div>
            </div>

            {activeTab === 'analysis' ? (
              <>
                <div className="pl-0 pr-0 py-4">
                  <div className="text-base font-medium text-primaryText">消耗趋势</div>
                  <div
                    className="mt-2 rounded-xl px-4 py-4"
                    style={{ backgroundColor: 'rgba(242, 243, 245, 0.4)' }}
                  >
                    <div className="text-sm text-tertiaryText">总消耗</div>
                    <div className="mt-3 text-2xl leading-none font-semibold text-primaryText">{formatNumber(currentTotal)}</div>

                    <UsageTrendChart
                      points={trendPoints}
                      leftLabel={trendRangeLabel}
                      rightLabel={selectedRange === 'yesterday' ? '23:59' : '今天'}
                    />
                  </div>
                </div>

                <div className="pl-0 pr-0 py-3.5">
                  <div className="mb-3 flex items-center gap-6">
                    <h3 className="text-base font-medium text-primaryText">消耗占比</h3>
                    <BaseSegmented
                      options={ratioOptions}
                      value={ratioView}
                      onChange={(value) => setRatioView(value as RatioView)}
                    />
                  </div>

                  <div className="border-b border-borderGray bg-white">
                    {ratioView === 'project' ? (
                      <BaseTable
                        className="task-table-scroll min-w-[760px]"
                        columns={projectTableColumns}
                        dataSource={projectRows}
                        rowKey="id"
                      />
                    ) : (
                      <BaseTable
                        className="task-table-scroll min-w-[760px]"
                        columns={memberTableColumns}
                        dataSource={memberRows}
                        rowKey="id"
                      />
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="pl-0 pr-0 -mt-2 pb-5">
                <div className="border-b border-borderGray bg-white">
                  <BaseTable
                    className="task-table-scroll min-w-[760px]"
                    columns={detailTableColumns}
                    dataSource={memberRows}
                    rowKey="id"
                  />
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* 充值记录弹窗 */}
      {showRechargeModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setShowRechargeModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <BaseModal
              visible={showRechargeModal}
              title="充值记录"
              okText="充值"
              cancelText="关闭"
              onConfirm={() => setShowRechargeModal(false)}
              onCancel={() => setShowRechargeModal(false)}
              width={600}
              maskClosable
            >
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto space-y-3">
                {[
                  { date: '2024.01.15', amount: '￥100', tokens: '+10,000 Tokens', status: '已到账' },
                  { date: '2024.01.10', amount: '￥50', tokens: '+5,000 Tokens', status: '已到账' },
                  { date: '2024.01.05', amount: '￥200', tokens: '+20,000 Tokens', status: '已到账' },
                  { date: '2024.12.28', amount: '￥150', tokens: '+15,000 Tokens', status: '已到账' },
                ].map((record, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border border-line-soft hover:border-borderGray transition-colors"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-primaryText">{record.amount}</div>
                      <div className="text-sm text-tertiaryText mt-1">{record.date}</div>
                    </div>
                    <div className="flex-1 text-right">
                      <div className="text-sm text-primaryText">{record.tokens}</div>
                      <div className="text-sm text-success mt-1">{record.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </BaseModal>
          </div>
        </>
      )}
    </div>
  );
}