import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ChevronLeft, Menu, Plus, X, HelpCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { BaseButton } from '@/components';
import { type LayoutOutletContext } from '../components/Layout';

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

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const generateInviteCode = () => Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');

export default function MemberManagementPage() {
  const navigate = useNavigate();
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
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<MemberRole>('成员');
  const [formProjects, setFormProjects] = useState('');
  const [formDailyToken, setFormDailyToken] = useState('100w');

  const [errorMsg, setErrorMsg] = useState('');

  const adminCount = members.filter((m) => m.role === '管理员').length;

  const handleOpenInvite = () => {
    setInviteCode(generateInviteCode());
    setInviteCodeCopied(false);
    setErrorMsg('');
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
    setFormName(member.name);
    setFormEmail(member.email);
    setFormRole(member.role);
    setFormProjects(member.projects);
    setFormDailyToken(member.dailyToken);
    setErrorMsg('');
    setShowEditModal(true);
  };

  const handleOpenDelete = (member: TeamMember) => {
    setSelectedSelectedMember(member);
    setShowDeleteConfirm(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    const trimmedName = formName.trim();
    const trimmedEmail = formEmail.trim().toLowerCase();
    const trimmedProjects = formProjects.trim() || '未归属项目';

    if (!trimmedName) {
      setErrorMsg('请输入成员姓名');
      return;
    }
    if (!emailPattern.test(trimmedEmail)) {
      setErrorMsg('请输入有效的邮箱地址');
      return;
    }

    const emailExists = members.some(
      (m) => m.id !== selectedMember.id && m.email.toLowerCase() === trimmedEmail,
    );
    if (emailExists) {
      setErrorMsg('该邮箱已被占用，请使用其他邮箱');
      return;
    }

    setTeamMembers((prev) =>
      prev.map((m) =>
        m.id === selectedMember.id
          ? {
              ...m,
              name: trimmedName,
              email: trimmedEmail,
              role: formRole,
              projects: trimmedProjects,
              dailyToken: formDailyToken,
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
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="text-tertiaryText transition-colors hover:text-primaryText"
            >
              系统设置
            </button>
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
          {adminCount < 2 ? (
            <div className="!mt-3 bg-[#fff8f6] border border-[#ffe4e0] text-[#ff4d4f] px-4 py-3.5 rounded-xl text-sm flex items-center gap-2.5 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle size={16} className="text-[#ff4d4f] shrink-0" />
              <span className="font-normal">
                当前管理员1名，建议至少保留2名管理员，避免团队配置和成员管理只有单点负责人
              </span>
            </div>
          ) : (
            <div className="!mt-3 bg-[#f0fdf4] border border-[#bbf7d0] text-[#166534] px-4 py-3.5 rounded-xl text-sm flex items-center gap-2.5 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
              <ShieldCheck size={16} className="text-[#16a34a] shrink-0" />
              <span className="font-normal">
                团队已配置多名管理员，保障了管理控制权的安全与高可用性
              </span>
            </div>
          )}

          {/* 表格区域 */}
          <section className="space-y-3">
            <div className="task-table-scroll overflow-x-auto border-b border-[borderGray] bg-white">
              <div className="min-w-[940px]">
                {/* 表格标题行 */}
                <div className="grid grid-cols-[1.5fr_1fr_1fr_2.5fr_0.75fr_0.75fr] border-b border-[#edf1f5] pl-0 pr-3 py-2 text-[13px] text-[#8a94a0]">
                  <span>姓名</span>
                  <span className="flex items-center gap-1">
                    团队角色
                    <button
                      className="text-[#8a94a0] hover:text-[#8a94a0]"
                      title="管理员拥有全部权限；成员可协同开发与查看数据。"
                    >
                      <HelpCircle size={14} />
                    </button>
                  </span>
                  <span>加入时间</span>
                  <span>归属项目</span>
                  <span className="whitespace-nowrap">token限额</span>
                  <span className="text-left">操作</span>
                </div>

                {/* 成员列表数据行 */}
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="grid grid-cols-[1.5fr_1fr_1fr_2.5fr_0.75fr_0.75fr] items-center gap-2 border-b border-[#f1f4f7] pl-0 pr-3 py-2.5 text-[13px] last:border-b-0"
                  >
                    {/* 头像与姓名邮箱 */}
                    <div className="flex items-center min-w-0 pr-2">
                      <div className="w-10 h-10 rounded-full bg-bgLight flex items-center justify-center text-secondaryText font-medium text-[11px] border border-[#e2e8f0] mr-3 shrink-0">
                        {member.name.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-primaryText truncate">{member.name}</p>
                        <p className="text-[13px] text-secondaryText truncate mt-0.5">{member.email}</p>
                      </div>
                    </div>

                    {/* 团队角色 */}
                    <span className="text-primaryText">{member.role}</span>

                    {/* 加入时间 */}
                    <span className="text-secondaryText">{member.joinDate}</span>

                    {/* 归属项目 */}
                    <span className="text-secondaryText truncate pr-4" title={member.projects}>
                      {member.projects}
                    </span>

                    {/* token消耗/日 */}
                    <span className="text-secondaryText whitespace-nowrap">{member.dailyToken}</span>

                    {/* 操作 */}
                    <div className="flex justify-start items-center gap-2 text-left whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(member)}
                        className="text-primaryText hover:text-black transition-colors"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDelete(member)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        移除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
      {showInviteModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setShowInviteModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-[340px] max-w-[calc(100vw-32px)] rounded-lg bg-white shadow-popover overflow-hidden animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[borderGray] px-6 py-3.5">
                <h3 className="text-[17px] font-semibold text-primaryText">邀请新成员</h3>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="rounded-full p-2 text-secondaryText transition-colors hover:bg-bgLight hover:text-primaryText"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5">
                <h4 className="text-[17px] font-semibold text-primaryText">邀请码</h4>

                <div className="mt-4 grid grid-cols-6 gap-2">
                  {inviteCode.split('').map((digit, index) => (
                    <div
                      key={`${digit}-${index}`}
                      className="h-[44px] rounded-lg bg-[#f5f6f8] flex items-center justify-center text-[24px] font-medium text-primaryText"
                    >
                      {digit}
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-sm leading-6 text-[#98A2B3]">
                  请将6位数字邀请码分享给新成员，新成员通过邀请码加入后默认为成员，管理员可在成员列表中调整权限
                </p>

                <button
                  type="button"
                  onClick={handleCopyInviteCode}
                  className="mt-5 h-11 w-full rounded-lg bg-[#006D65] text-base font-semibold text-white transition-opacity hover:opacity-90"
                >
                  {inviteCodeCopied ? '已复制邀请码' : '复制邀请码'}
                </button>

                <button
                  type="button"
                  onClick={handleRegenerateInviteCode}
                  className="mt-3 w-full text-center text-base font-semibold text-[#006D65] hover:opacity-80"
                >
                  重新生成邀请码
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 编辑成员弹窗 */}
      {showEditModal && selectedMember && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setShowEditModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-[560px] rounded-2xl bg-white shadow-popover overflow-hidden animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[borderGray] px-6 py-4">
                <h3 className="text-base font-semibold text-primaryText">编辑成员信息</h3>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-full p-1.5 text-secondaryText transition-colors hover:bg-bgLight hover:text-primaryText"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit}>
                <div className="space-y-4 px-6 py-5">
                  <div>
                    <label className="block text-sm font-medium text-primaryText mb-1.5">成员姓名</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="请输入成员姓名"
                      className="w-full rounded-xl border border-[borderGray] px-3.5 py-2.5 text-sm text-primaryText outline-none transition-colors focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primaryText mb-1.5">成员邮箱</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full rounded-xl border border-[borderGray] px-3.5 py-2.5 text-sm text-primaryText outline-none transition-colors focus:border-black"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primaryText mb-1.5">团队角色</label>
                      <select
                        value={formRole}
                        onChange={(e) => setFormRole(e.target.value as MemberRole)}
                        className="w-full rounded-xl border border-[borderGray] bg-white px-3.5 py-2.5 text-sm text-primaryText outline-none focus:border-black"
                      >
                        <option value="成员">成员</option>
                        <option value="管理员">管理员</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-primaryText mb-1.5">每日 token 消耗限额</label>
                      <select
                        value={formDailyToken}
                        onChange={(e) => setFormDailyToken(e.target.value)}
                        className="w-full rounded-xl border border-[borderGray] bg-white px-3.5 py-2.5 text-sm text-primaryText outline-none focus:border-black"
                      >
                        <option value="30w">30w</option>
                        <option value="50w">50w</option>
                        <option value="80w">80w</option>
                        <option value="100w">100w</option>
                        <option value="120w">120w</option>
                        <option value="150w">150w</option>
                        <option value="200w">200w</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primaryText mb-1.5">归属项目</label>
                    <input
                      type="text"
                      value={formProjects}
                      onChange={(e) => setFormProjects(e.target.value)}
                      placeholder="例：CRISPR实验优化"
                      className="w-full rounded-xl border border-[borderGray] px-3.5 py-2.5 text-sm text-primaryText outline-none transition-colors focus:border-black"
                    />
                  </div>

                  {errorMsg && (
                    <p className="text-xs text-red-500 font-medium">{errorMsg}</p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-[borderGray] px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="rounded-full border border-[#d8e0ea] px-4 py-2 text-sm text-secondaryText transition-colors hover:bg-bgLight"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-[#1f1f1f] px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  >
                    保存修改
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* 移除成员确认弹窗 */}
      {showDeleteConfirm && selectedMember && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setShowDeleteConfirm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-[400px] rounded-2xl bg-white shadow-popover overflow-hidden animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 pt-6 pb-4">
                <h3 className="text-base font-semibold text-primaryText">确定要移除该成员吗？</h3>
                <p className="text-sm text-secondaryText mt-2">
                  您正在将成员 <span className="font-semibold text-primaryText">{selectedMember.name} ({selectedMember.email})</span> 移出该科研团队，此操作执行后无法撤销。
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 bg-[#f9fafb] px-6 py-3.5 border-t border-[borderGray]">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-full border border-[#d8e0ea] bg-white px-4 py-1.5 text-sm text-secondaryText transition-colors hover:bg-bgLight"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:bg-red-700"
                >
                  确认移除
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
