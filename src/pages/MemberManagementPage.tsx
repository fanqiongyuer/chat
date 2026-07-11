import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Menu, Plus, HelpCircle, AlertCircle, ShieldCheck, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Radio, Select } from 'antd';
import { BaseActionMenu, BaseButton, BaseModal, BasePagination, BaseTable } from '../components';
import type { BaseActionMenuItem, BaseTableColumn } from '../components';
import { type LayoutOutletContext } from '../components/Layout';
import { mockProjects } from '../mock/projects';

type MemberRole = '管理员' | '成员';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  joinDate: string;
  projects: string;
  dailyToken: string;
}

const initialTeamMembers: TeamMember[] = [
  {
    id: 'm1',
    name: '待永明',
    email: '755647890@11.com',
    role: '管理员',
    joinDate: '2026.03.06',
    projects: 'CRISPR实验优化、地贫基因治疗研究等4个',
    dailyToken: '100w',
  },
  {
    id: 'm2',
    name: 'Solit',
    email: '755647890@11.com',
    role: '成员',
    joinDate: '2026.03.06',
    projects: 'CRISPR实验优化',
    dailyToken: '100w',
  },
  {
    id: 'm3',
    name: '周妍',
    email: 'zhouyan@deptrace.ai',
    role: '成员',
    joinDate: '2026.03.11',
    projects: '地贫基因治疗研究',
    dailyToken: '50w',
  },
  {
    id: 'm4',
    name: '李聪',
    email: 'licong@deptrace.ai',
    role: '成员',
    joinDate: '2026.03.14',
    projects: '肿瘤免疫疗法探索、细胞系改良',
    dailyToken: '80w',
  },
  {
    id: 'm5',
    name: '陈曦',
    email: 'chenxi@deptrace.ai',
    role: '成员',
    joinDate: '2026.04.01',
    projects: '高通量筛选平台开发',
    dailyToken: '120w',
  },
  {
    id: 'm6',
    name: '蒋晨',
    email: 'jiangchen@deptrace.ai',
    role: '成员',
    joinDate: '2026.04.18',
    projects: '单细胞转录组测序分析',
    dailyToken: '30w',
  },
  {
    id: 'm7',
    name: '王浩',
    email: 'wanghao@deptrace.ai',
    role: '成员',
    joinDate: '2026.05.09',
    projects: '蛋白质结构预测模型',
    dailyToken: '200w',
  },
  {
    id: 'm8',
    name: '张敏',
    email: 'zhangmin@deptrace.ai',
    role: '成员',
    joinDate: '2026.05.15',
    projects: 'CAR-T 细胞治疗研究',
    dailyToken: '60w',
  },
  {
    id: 'm9',
    name: '赵阳',
    email: 'zhaoyang@deptrace.ai',
    role: '成员',
    joinDate: '2026.05.20',
    projects: '病毒载体设计与包装',
    dailyToken: '40w',
  },
  {
    id: 'm10',
    name: '孙丽',
    email: 'sunli@deptrace.ai',
    role: '成员',
    joinDate: '2026.05.25',
    projects: '类器官培养与药物筛选',
    dailyToken: '70w',
  },
  {
    id: 'm11',
    name: '钱坤',
    email: 'qiankun@deptrace.ai',
    role: '成员',
    joinDate: '2026.06.01',
    projects: '染色质免疫共沉淀测序',
    dailyToken: '50w',
  },
  {
    id: 'm12',
    name: '林凡',
    email: 'linfan@deptrace.ai',
    role: '成员',
    joinDate: '2026.06.05',
    projects: '碱基编辑效率评估',
    dailyToken: '150w',
  },
  {
    id: 'm13',
    name: '吴双',
    email: 'wushuang@deptrace.ai',
    role: '成员',
    joinDate: '2026.06.10',
    projects: '非同源末端连接通路分析',
    dailyToken: '90w',
  },
  {
    id: 'm14',
    name: '郑佳',
    email: 'zhengjia@deptrace.ai',
    role: '成员',
    joinDate: '2026.06.15',
    projects: '脱靶效应深测序分析',
    dailyToken: '110w',
  },
  {
    id: 'm15',
    name: '冯毅',
    email: 'fengyi@deptrace.ai',
    role: '成员',
    joinDate: '2026.06.20',
    projects: '高保真 Cas9 突变体筛选',
    dailyToken: '80w',
  },
  {
    id: 'm16',
    name: '陈默',
    email: 'chenmo@deptrace.ai',
    role: '成员',
    joinDate: '2026.06.25',
    projects: '诱导多能干细胞定向分化',
    dailyToken: '100w',
  },
  {
    id: 'm17',
    name: '杨光',
    email: 'yangguang@deptrace.ai',
    role: '成员',
    joinDate: '2026.06.30',
    projects: '基因回路设计与合成',
    dailyToken: '120w',
  },
];

const generateInviteCode = () => Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');

const parseProjectNames = (projectsText: string) => {
  const cleaned = projectsText.replace(/等\d+个(?:项目)?$/, '').trim();
  if (!cleaned || cleaned === '未归属项目') {
    return [];
  }

  return cleaned
    .split(/[、,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const formatProjectsPreview = (projectsText: string) => {
  const trimmed = projectsText.trim();
  if (!trimmed || trimmed === '未归属项目') {
    return '未归属项目';
  }

  const parsedNames = parseProjectNames(trimmed);
  if (parsedNames.length === 0) {
    return '未归属项目';
  }

  const countMatch = trimmed.match(/等(\d+)个(?:项目)?$/);
  const totalCount = countMatch ? Number(countMatch[1]) : parsedNames.length;

  if (totalCount <= 1) {
    return parsedNames[0];
  }

  return `${parsedNames[0]}等${totalCount}个项目`;
};

export default function MemberManagementPage() {
  const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<LayoutOutletContext>();

  const [members, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers);

  // Modal 状态
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCode, setInviteCode] = useState(() => generateInviteCode());
  const [inviteCodeCopied, setInviteCodeCopied] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedMember, setSelectedSelectedMember] = useState<TeamMember | null>(null);

  // 表单状态
  const [formRole, setFormRole] = useState<MemberRole>('成员');
  const [formProjects, setFormProjects] = useState<string[]>([]);

  const [memberActionMenuId, setMemberActionMenuId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const adminCount = members.filter((m) => m.role === '管理员').length;

  const roleOptions = useMemo(
    () => [
      { label: '成员', value: '成员' },
      { label: '管理员', value: '管理员' },
    ],
    [],
  );

  const projectOptions = useMemo(() => {
    const names = new Set<string>();

    mockProjects.forEach((project) => {
      names.add(project.name);
    });

    members.forEach((member) => {
      parseProjectNames(member.projects).forEach((name) => names.add(name));
    });

    return Array.from(names).map((name) => ({ label: name, value: name }));
  }, [members]);

  const memberActionMenuItems = useMemo<BaseActionMenuItem[]>(() => [
    { key: 'edit', label: '编辑', icon: <Pencil size={14} /> },
    { key: 'remove', label: '移除', icon: <Trash2 size={14} />, danger: true },
  ], []);

  const pagedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return members.slice(start, start + pageSize);
  }, [members, currentPage, pageSize]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(members.length / pageSize));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [members.length, pageSize, currentPage]);

  const handleOpenInvite = () => {
    setInviteCode(generateInviteCode());
    setInviteCodeCopied(false);
    setShowInviteModal(true);
  };

  const handleRegenerateInviteCode = () => {
    setInviteCode(generateInviteCode());
    setInviteCodeCopied(false);
  };

  const handleCopyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = inviteCode;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    setInviteCodeCopied(true);
    window.setTimeout(() => {
      setInviteCodeCopied(false);
    }, 1500);
  };

  const handleOpenEdit = (member: TeamMember) => {
    setSelectedSelectedMember(member);
    setFormRole(member.role);
    setFormProjects(parseProjectNames(member.projects));
    setShowEditModal(true);
  };

  const handleOpenDelete = (member: TeamMember) => {
    setSelectedSelectedMember(member);
    setShowDeleteConfirm(true);
  };

  const handleEditSubmit = () => {
    if (!selectedMember) return;

    const normalizedProjects = formProjects
      .map((item) => item.trim())
      .filter(Boolean);
    const projectsText = normalizedProjects.length > 0 ? normalizedProjects.join('、') : '未归属项目';

    setTeamMembers((prev) =>
      prev.map((m) =>
        m.id === selectedMember.id
          ? {
              ...m,
              role: formRole,
              projects: projectsText,
            }
          : m,
      ),
    );
    setShowEditModal(false);
  };

  const handleDeleteConfirm = () => {
    if (!selectedMember) return;
    setTeamMembers((prev) => prev.filter((m) => m.id !== selectedMember.id));
    setShowDeleteConfirm(false);
  };

  const memberTableColumns = useMemo<BaseTableColumn<TeamMember>[]>(
    () => [
      {
        title: '姓名',
        dataIndex: 'name',
        width: '24%',
        render: (_, member) => (
          <div className="flex min-w-0 items-center pr-2">
            <div className="mr-3 h-10 w-10 shrink-0 rounded-full border border-[#e2e8f0] bg-bgLight text-[11px] font-medium text-secondaryText flex items-center justify-center">
              {member.name.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-primaryText">{member.name}</p>
              <p className="mt-0.5 truncate text-[13px] text-secondaryText">{member.email}</p>
            </div>
          </div>
        ),
      },
      {
        title: (
          <span className="flex items-center gap-1">
            团队角色
            <button
              className="text-[#8a94a0] hover:text-[#8a94a0]"
              title="管理员拥有全部权限；成员可协同开发与查看数据。"
            >
              <HelpCircle size={14} />
            </button>
          </span>
        ),
        dataIndex: 'role',
        width: '14%',
        render: (role) => <span className="text-primaryText">{role}</span>,
      },
      {
        title: '加入时间',
        dataIndex: 'joinDate',
        width: '14%',
        render: (joinDate) => <span className="text-secondaryText">{joinDate}</span>,
      },
      {
        title: '归属项目',
        dataIndex: 'projects',
        width: '34%',
        render: (projects) => {
          const projectsText = String(projects);
          const previewText = formatProjectsPreview(projectsText);

          return (
            <span className="block truncate text-secondaryText" title={projectsText}>
              {previewText}
            </span>
          );
        },
      },
      {
        title: '操作',
        dataIndex: 'id',
        width: '8%',
        align: 'left',
        render: (_, member) => (
          <BaseActionMenu
            open={memberActionMenuId === member.id}
            onOpenChange={(open) => setMemberActionMenuId(open ? member.id : null)}
            placement="bottom-end"
            width={132}
            menuClassName="!min-w-[132px]"
            trigger={(
              <span className="inline-flex rounded-md p-1 text-secondaryText transition-colors hover:bg-bgLight hover:text-primaryText">
                <MoreHorizontal size={16} />
              </span>
            )}
            items={memberActionMenuItems}
            onItemClick={(item, event) => {
              event.stopPropagation();
              setMemberActionMenuId(null);
              if (item.key === 'edit') {
                handleOpenEdit(member);
                return;
              }
              handleOpenDelete(member);
            }}
          />
        ),
      },
    ],
    [memberActionMenuId, memberActionMenuItems],
  );

  return (
    <div className="flex h-full w-full flex-col bg-white">
      {/* 头部标题栏 */}
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
            <span className="text-tertiaryText">系统设置</span>
            <span className="text-tertiaryText">/</span>
            <span className="font-medium text-primaryText">成员管理</span>
          </div>
        </div>
        <BaseButton
          type="primary"
          size="small"
          rounded="large"
          icon={<Plus size={14} />}
          className="shrink-0"
          onClick={handleOpenInvite}
        >
          邀请新成员
        </BaseButton>
      </header>

      {/* 主体内容区 */}
      <div className="flex-1 overflow-y-auto px-4 pb-12 pt-4 md:px-8 lg:px-10 md:pb-12 md:pt-6">
        <div className="max-w-[1240px] mx-auto space-y-6">
          {/* 科研队名称 & 成员数徽章 */}
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl md:text-2xl font-semibold text-primaryText">中科2院攻坚科研队</h2>
            <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[13px] font-medium text-secondaryText bg-[#f1f4f7]">
              共{members.length}人
            </span>
          </div>

          {/* 管理员安全警示 Banner */}
          {adminCount < 2 && (
            <div className="!mt-3 bg-[#fff8f6] border border-[#ffe4e0] text-[#ff4d4f] px-4 py-3.5 rounded-xl text-sm flex items-center gap-2.5 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle size={16} className="text-[#ff4d4f] shrink-0" />
              <span className="font-normal">
                当前管理员1名，建议至少保留2名管理员，避免团队配置和成员管理只有单点负责人
              </span>
            </div>
          )}

          {/* 表格区域 */}
          <section className="space-y-3">
            <div className="bg-white">
              <BaseTable
                className="task-table-scroll w-full [&_table]:min-w-[940px] [&_thead_th]:py-2 [&_thead_th]:text-[13px] [&_thead_th]:text-[#8a94a0] [&_tbody_td]:py-2.5 [&_tbody_td]:text-[13px]"
                columns={memberTableColumns}
                dataSource={pagedMembers}
                rowKey="id"
                striped={false}
              />
              <BasePagination
                current={currentPage}
                total={members.length}
                pageSize={pageSize}
                onChange={setCurrentPage}
                showSizeChanger
                pageSizeOptions={[5, 10, 20]}
                onShowSizeChange={(_, nextPageSize) => {
                  setPageSize(nextPageSize);
                  setCurrentPage(1);
                }}
              />
            </div>
          </section>

          {/* 审计尾部说明 */}
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-tertiaryText select-none">
            <ShieldCheck size={14} className="text-tertiaryText shrink-0" />
            <span>所有成员均已纳入实验室合规性审计流水线</span>
          </div>
        </div>
      </div>

      {/* 邀请新成员弹窗 */}
      <BaseModal
        visible={showInviteModal}
        title="邀请新成员"
        width={360}
        maskClosable
        onCancel={() => setShowInviteModal(false)}
        footer={null}
        bodyClassName="!px-6 !py-5"
      >
        <div>
          <h4 className="text-[17px] font-semibold text-primaryText">邀请码</h4>

          <div className="mt-4 grid grid-cols-6 gap-2">
            {inviteCode.split('').map((digit, index) => (
              <div
                key={`${digit}-${index}`}
                className="flex h-[44px] items-center justify-center rounded-lg bg-[#f5f6f8] text-[24px] font-medium text-primaryText"
              >
                {digit}
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm leading-6 text-[#98A2B3]">
            请将6位数字邀请码分享给新成员，新成员通过邀请码加入后默认为成员，管理员可在成员列表中调整权限
          </p>

          <BaseButton
            type="primary"
            size="large"
            rounded="large"
            fullWidth
            className="mt-5"
            onClick={handleCopyInviteCode}
          >
            {inviteCodeCopied ? '已复制邀请码' : '复制邀请码'}
          </BaseButton>

          <button
            type="button"
            onClick={handleRegenerateInviteCode}
            className="mt-3 block w-full bg-transparent text-center text-sm font-semibold text-[var(--color-primary)] transition-opacity hover:opacity-80"
          >
            重新生成邀请码
          </button>
        </div>
      </BaseModal>

      {/* 编辑成员弹窗 */}
      <BaseModal
        visible={showEditModal && !!selectedMember}
        title="编辑成员信息"
        width={560}
        maskClosable={false}
        cancelText="取消"
        okText="保存修改"
        onCancel={() => setShowEditModal(false)}
        onConfirm={handleEditSubmit}
        className="tools-task-modal"
        bodyClassName="!px-6 !py-5"
      >
        {selectedMember && (
          <div className="space-y-4">
            <div>
              <div className="mb-2 text-sm font-medium text-primaryText">团队角色</div>
              <Radio.Group
                value={formRole}
                onChange={(event) => setFormRole(event.target.value as MemberRole)}
                className="task-radio-group"
              >
                <div className="flex flex-wrap items-center gap-8">
                  {roleOptions.map((option) => (
                    <Radio key={option.value} value={option.value}>
                      {option.label}
                    </Radio>
                  ))}
                </div>
              </Radio.Group>
            </div>

            <div>
              <div className="mb-1.5 text-sm font-medium text-primaryText">归属项目</div>
              <Select
                mode="multiple"
                value={formProjects}
                options={projectOptions}
                onChange={(values) => setFormProjects(values as string[])}
                optionFilterProp="label"
                allowClear
                placeholder="请选择归属项目"
                className="member-project-select w-full"
                popupClassName="member-project-select-dropdown"
              />
            </div>
          </div>
        )}
      </BaseModal>

      {/* 移除成员确认弹窗 */}
      <BaseModal
        visible={showDeleteConfirm && !!selectedMember}
        title="确定要移除该成员吗？"
        width={420}
        maskClosable={false}
        cancelText="取消"
        okText="确认移除"
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        okButtonProps={{
          className: '!bg-[#F04438] !border-[#F04438] hover:!bg-[#D92D20] hover:!border-[#D92D20]',
        }}
      >
        {selectedMember && (
          <p className="text-sm text-secondaryText">
            您正在将成员 <span className="font-semibold text-primaryText">{selectedMember.name} ({selectedMember.email})</span> 移出该科研团队，此操作执行后无法撤销。
          </p>
        )}
      </BaseModal>
    </div>
  );
}