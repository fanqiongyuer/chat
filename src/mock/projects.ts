export type ProjectVisibility = 'private' | 'public';
export type PrivateProjectType = 'team' | 'personal';
export type ExperimentStatus = '进行中' | '已完成';
export type KnowledgeStatus = '对话沉淀' | '手工创建' | '外部导入';
export type ExperimentTimelineStatus =
  | '创建试验方案'
  | '修改试验方案'
  | '干试验模拟'
  | '湿试验记录'
  | '实验结束';

export interface MockProject {
  id: string;
  name: string;
  desc: string;
  count: number;
  knowledge: number;
  members: number;
  visibility: ProjectVisibility;
  privateType?: PrivateProjectType;
}

export interface ProjectMember {
  id: string;
  name: string;
}

export interface ProjectExperimentItem {
  id: string;
  title: string;
  summary: string;
  ownerId: string;
  status: ExperimentStatus;
  tags: string[];
}

export interface ProjectKnowledgeItem {
  id: string;
  title: string;
  summary: string;
  ownerId: string;
  status: KnowledgeStatus;
  tags: string[];
}

export interface ExperimentTimelineSection {
  title: string;
  content: string;
}

export interface ExperimentTimelineEntry {
  id: string;
  date: string;
  status: ExperimentTimelineStatus;
  summary: string;
  actor: string;
  updatedAt: string;
  detailTitle: string;
  detailDescription: string;
  detailSections: ExperimentTimelineSection[];
  attachments: string[];
  markdownContent?: string;
}

export interface ExperimentResourceItem {
  id: string;
  name: string;
}

export interface ProjectExperimentDetail extends ProjectExperimentItem {
  subtitle: string;
  updatedAt: string;
  timeline: ExperimentTimelineEntry[];
  resources: ExperimentResourceItem[];
}

export const mockProjects: MockProject[] = [
  {
    id: 'p-crispr',
    name: 'CRISPR实验优化',
    desc: '围绕 gRNA 设计、脱靶控制和编辑效率提升进行系统实验设计。',
    count: 5,
    knowledge: 18,
    members: 3,
    visibility: 'private',
    privateType: 'team',
  },
  {
    id: 'p-thal',
    name: '地贫基因治疗研究',
    desc: '整理地中海贫血相关通路、靶点和临床前验证方案。',
    count: 3,
    knowledge: 12,
    members: 5,
    visibility: 'public',
  },
  {
    id: 'p-organoid',
    name: '类器官模型验证',
    desc: '建立类器官实验流程并评估药物干预对比数据。',
    count: 2,
    knowledge: 9,
    members: 4,
    visibility: 'private',
    privateType: 'personal',
  },
];

export const PROJECT_MEMBERS: Record<string, ProjectMember[]> = {
  'p-crispr': [
    { id: 'm-wangping', name: '王平' },
    { id: 'm-songke', name: '宋可' },
    { id: 'm-wangzheyv', name: '王哲宇' },
    { id: 'm-teluoke', name: '特洛克' },
    { id: 'm-duyuesheng', name: '杜月笙' },
  ],
  'p-thal': [
    { id: 'm-zhouyan', name: '周妍' },
    { id: 'm-lijin', name: '李晋' },
    { id: 'm-chenxi', name: '陈曦' },
    { id: 'm-hexiao', name: '何晓' },
  ],
  'p-organoid': [
    { id: 'm-liting', name: '李婷' },
    { id: 'm-maodan', name: '毛单' },
    { id: 'm-xuqian', name: '徐倩' },
  ],
};

export const EXPERIMENT_DETAILS_BY_PROJECT: Record<string, ProjectExperimentDetail[]> = {
  'p-crispr': [
    {
      id: 'exp-crispr-1',
      title: 'gRNA 筛选实验',
      subtitle: '验证候选序列的编辑效率与脱靶风险，沉淀高置信实验路径',
      summary: '设计并比较 12 组 gRNA 候选序列，评估编辑效率与脱靶风险。',
      ownerId: 'm-wangping',
      status: '进行中',
      tags: ['实验目标', '脱靶控制'],
      updatedAt: '2026.06.02 10:20',
      timeline: [
        {
          id: 'exp-crispr-1-log-1',
          date: '2026.06.03',
          status: '实验结束',
          summary: '测序结果达到阈值，输出阶段性实验结论',
          actor: '王平',
          updatedAt: '2026.06.03 16:30',
          detailTitle: '实验结论确认',
          detailDescription:
            '汇总 12 组候选序列的测序结果，确认 3 组核心候选在编辑效率与脱靶风险间取得更优平衡，可进入后续重复验证。',
          detailSections: [
            {
              title: '关键结论',
              content:
                '候选 03、07、11 的编辑效率均超过 65%，其中候选 07 的脱靶评分最低，建议作为优先推进方案。',
            },
            {
              title: '风险提醒',
              content:
                '样本 2 在第二次重复实验中出现细胞活性下降，需要在下一轮验证中补充转染剂量对照。',
            },
          ],
          attachments: ['测序结果汇总.xlsx', '候选序列评分表.csv'],
        },
        {
          id: 'exp-crispr-1-log-2',
          date: '2026.06.02',
          status: '湿试验记录',
          summary: '完成 12 组样本转染并记录首轮观察结果',
          actor: '王平',
          updatedAt: '2026.06.02 10:20',
          detailTitle: '实验-转染样本首轮结果',
          detailDescription:
            '上午完成 12 组候选序列的转染操作，细胞状态整体稳定，记录了转染后 8 小时与 24 小时的活性和荧光信号变化。',
          markdownContent: `## 实验背景\n\n本次记录聚焦 **12 组候选序列** 的首轮转染结果，目标是快速筛选高潜力方案并识别风险样本。\n\n## 实验步骤\n\n1. 完成培养板编号与样本映射。\n2. 按方案配置转染液并分组加样。\n3. 在 8h 与 24h 两个时间点记录活性和荧光信号。\n\n## 观察结果\n\n- 候选 03、07 在 24h 节点荧光强度更高。\n- 候选 11 细胞贴壁状态更稳定。\n- 样本整体状态可控，未出现批量失活。\n\n## 下一步\n\n- [ ] 补充细胞活性染色结果\n- [ ] 联合脱靶预测模型完成第二轮优选\n- [ ] 输出下一轮实验样本清单\n\n> 备注：当前为首轮湿实验记录，结论以复现实验为准。`,
          detailSections: [
            {
              title: '实验步骤',
              content:
                '按预设分组完成培养板编号、转染液配置与加样操作。每组保留一份未转染对照样本，便于后续比较。',
            },
            {
              title: '观察记录',
              content:
                '候选 03、07 在 24 小时节点表现出更高荧光强度，候选 11 的细胞贴壁状态更稳定，建议继续追踪 48 小时指标。',
            },
            {
              title: '下一步',
              content:
                '补充细胞活性染色结果，联合脱靶预测模型做第二轮优选。',
            },
          ],
          attachments: ['实验记录表.docx', '显微图像-06-02.zip'],
        },
        {
          id: 'exp-crispr-1-log-3',
          date: '2026.06.01',
          status: '湿试验记录',
          summary: '完成样本准备与培养条件校验',
          actor: '宋可',
          updatedAt: '2026.06.01 18:10',
          detailTitle: '实验前样本准备',
          detailDescription:
            '补齐候选序列的样本标签、培养条件与试剂批次信息，确认样本量满足本轮实验要求。',
          detailSections: [
            {
              title: '准备结果',
              content: '12 组候选序列全部完成编号，培养箱温度与 CO2 条件已校验，无异常波动。',
            },
            {
              title: '依赖事项',
              content: '待测序平台确认插槽时间后，可同步预约 6 月 3 日下午的测序服务。',
            },
          ],
          attachments: ['样本清单.xlsx'],
        },
        {
          id: 'exp-crispr-1-log-4',
          date: '2026.05.31',
          status: '干试验模拟',
          summary: '离线评估候选序列可行性并完成首轮排序',
          actor: '王哲宇',
          updatedAt: '2026.05.31 21:15',
          detailTitle: '干试验模拟结果',
          detailDescription:
            '利用脱靶预测模型对 12 组候选序列进行评分，结合过往数据完成优先级排序，为湿实验输入高置信候选。',
          detailSections: [
            {
              title: '建模结果',
              content: '候选 03、07、11 在综合评分中位列前三，建议全部纳入湿实验验证。',
            },
          ],
          attachments: ['脱靶预测报告.pdf'],
        },
        {
          id: 'exp-crispr-1-log-5',
          date: '2026.05.29',
          status: '修改试验方案',
          summary: '补充对照组与细胞活性指标',
          actor: '王平',
          updatedAt: '2026.05.29 17:40',
          detailTitle: '试验方案修订',
          detailDescription:
            '根据评审意见补充空白对照组与剂量梯度设计，同时明确细胞活性和荧光信号为本轮核心指标。',
          detailSections: [
            {
              title: '修订内容',
              content: '新增 2 组剂量梯度与 1 组空白对照，统一采用 24 小时和 48 小时双节点记录。',
            },
          ],
          attachments: ['试验方案-v2.docx'],
        },
        {
          id: 'exp-crispr-1-log-6',
          date: '2026.05.29',
          status: '创建试验方案',
          summary: '完成初版 gRNA 筛选实验方案',
          actor: '王平',
          updatedAt: '2026.05.29 10:00',
          detailTitle: '创建试验方案',
          detailDescription:
            '确定候选序列来源、样本规模与主要评估指标，形成首版实验流程。',
          detailSections: [
            {
              title: '目标',
              content: '筛选高编辑效率、低脱靶风险的 gRNA 候选，用于后续细胞验证。',
            },
          ],
          attachments: ['试验方案-v1.docx'],
        },
      ],
      resources: [
        { id: 'exp-crispr-1-file-1', name: 'gRNA 候选序列清单.xlsx' },
        { id: 'exp-crispr-1-file-2', name: '测序平台参数说明.pdf' },
        { id: 'exp-crispr-1-file-3', name: '实验记录模板.docx' },
      ],
    },
    {
      id: 'exp-crispr-2',
      title: '细胞转染条件优化',
      subtitle: '通过不同转染试剂与时间窗口组合，提高 CRISPR 编辑稳定性',
      summary: '通过不同转染试剂与时间窗口组合，提高 CRISPR 编辑稳定性。',
      ownerId: 'm-songke',
      status: '进行中',
      tags: ['实验目标', '流程优化'],
      updatedAt: '2026.06.04 09:00',
      timeline: [
        {
          id: 'exp-crispr-2-log-1',
          date: '2026.06.04',
          status: '修改试验方案',
          summary: '新增受体细胞对照组与 48 小时观察点',
          actor: '宋可',
          updatedAt: '2026.06.04 09:00',
          detailTitle: '试验方案补充',
          detailDescription: '补充受体细胞对照组，避免不同细胞状态对转染效率判断造成干扰。',
          detailSections: [
            {
              title: '新增项',
              content: '对照组采用统一细胞密度，新增 48 小时节点记录细胞活性和转染信号。',
            },
          ],
          attachments: ['转染优化方案-v2.docx'],
        },
        {
          id: 'exp-crispr-2-log-2',
          date: '2026.06.01',
          status: '创建试验方案',
          summary: '完成初版实验流程与材料清单',
          actor: '宋可',
          updatedAt: '2026.06.01 14:30',
          detailTitle: '创建转染优化实验',
          detailDescription: '确定三种转染试剂、两类培养基和两个时间窗口作为首轮验证组合。',
          detailSections: [
            {
              title: '材料清单',
              content: '试剂 A/B/C 已备齐，培养基库存满足 2 轮试验。',
            },
          ],
          attachments: ['材料清单.xlsx'],
        },
      ],
      resources: [
        { id: 'exp-crispr-2-file-1', name: '转染试剂对比表.xlsx' },
        { id: 'exp-crispr-2-file-2', name: '培养基库存清单.xlsx' },
      ],
    },
    {
      id: 'exp-crispr-3',
      title: '测序验证流程',
      subtitle: '建立编辑结果的测序验证流程，输出标准化质控报告',
      summary: '建立编辑结果的测序验证流程，输出标准化质控报告。',
      ownerId: 'm-wangzheyv',
      status: '已完成',
      tags: ['结果验证'],
      updatedAt: '2026.05.30 20:20',
      timeline: [
        {
          id: 'exp-crispr-3-log-1',
          date: '2026.05.30',
          status: '实验结束',
          summary: '质控模板已固化并纳入项目 SOP',
          actor: '王哲宇',
          updatedAt: '2026.05.30 20:20',
          detailTitle: '测序流程验收完成',
          detailDescription: '完成平台对接、参数模板沉淀与异常数据处理约定，流程已可复用。',
          detailSections: [
            {
              title: '交付产物',
              content: '输出统一质控报告模板、测序异常处理说明与平台配置清单。',
            },
          ],
          attachments: ['质控报告模板.docx'],
        },
      ],
      resources: [{ id: 'exp-crispr-3-file-1', name: '测序质控模板.docx' }],
    },
    {
      id: 'exp-crispr-4',
      title: 'Cas9 活性对照实验',
      subtitle: '补充 Cas9 活性与细胞状态关联对照，验证稳定表达条件',
      summary: '补充 Cas9 活性与细胞状态关联对照，验证稳定表达条件。',
      ownerId: 'm-teluoke',
      status: '进行中',
      tags: ['实验目标', '性能评估'],
      updatedAt: '2026.06.03 11:00',
      timeline: [
        {
          id: 'exp-crispr-4-log-1',
          date: '2026.06.03',
          status: '湿试验记录',
          summary: '完成第一批细胞状态对照记录',
          actor: '特洛克',
          updatedAt: '2026.06.03 11:00',
          detailTitle: 'Cas9 活性记录',
          detailDescription: '第一批细胞状态对照样本已完成记录，后续补充重复组。',
          detailSections: [
            {
              title: '现状',
              content: '活性波动主要集中在低密度组，建议下一轮提高接种密度。',
            },
          ],
          attachments: ['活性对照记录表.xlsx'],
        },
      ],
      resources: [{ id: 'exp-crispr-4-file-1', name: 'Cas9 对照实验表.xlsx' }],
    },
  ],
  'p-thal': [
    {
      id: 'exp-thal-1',
      title: '地贫通路靶点筛选',
      subtitle: '从疾病通路中筛选关键靶点，并评估干预策略可行性',
      summary: '从疾病通路中筛选关键靶点，并评估干预策略可行性。',
      ownerId: 'm-zhouyan',
      status: '进行中',
      tags: ['靶点研究'],
      updatedAt: '2026.06.05 09:40',
      timeline: [
        {
          id: 'exp-thal-1-log-1',
          date: '2026.06.05',
          status: '湿试验记录',
          summary: '第二批样本已完成采集',
          actor: '周妍',
          updatedAt: '2026.06.05 09:40',
          detailTitle: '第二批样本采集',
          detailDescription: '完成第二批地贫样本采集和标签核对，待进入表达分析。',
          detailSections: [
            {
              title: '样本情况',
              content: '本轮共新增 16 份样本，其中 2 份需要补充临床分组信息。',
            },
          ],
          attachments: ['样本采集记录.xlsx'],
        },
      ],
      resources: [{ id: 'exp-thal-1-file-1', name: '靶点筛选候选池.csv' }],
    },
    {
      id: 'exp-thal-2',
      title: '临床前指标对照',
      subtitle: '统一临床前指标，搭建不同实验模型的对照基线',
      summary: '统一临床前指标，搭建不同实验模型的对照基线。',
      ownerId: 'm-lijin',
      status: '进行中',
      tags: ['流程优化'],
      updatedAt: '2026.06.02 12:00',
      timeline: [
        {
          id: 'exp-thal-2-log-1',
          date: '2026.06.02',
          status: '创建试验方案',
          summary: '对照指标表已完成草拟',
          actor: '李晋',
          updatedAt: '2026.06.02 12:00',
          detailTitle: '创建指标对照实验',
          detailDescription: '整理不同模型共用的血红蛋白、活性与安全性指标，准备进入评审。',
          detailSections: [
            {
              title: '覆盖指标',
              content: '包含表达量、细胞活性、毒性与脱靶风险四类核心指标。',
            },
          ],
          attachments: ['指标对照表-v1.xlsx'],
        },
      ],
      resources: [{ id: 'exp-thal-2-file-1', name: '指标对照表-v1.xlsx' }],
    },
  ],
  'p-organoid': [
    {
      id: 'exp-organoid-1',
      title: '类器官培养条件验证',
      subtitle: '验证类器官培养温度、营养条件对实验结果的一致性影响',
      summary: '验证类器官培养温度、营养条件对实验结果的一致性影响。',
      ownerId: 'm-liting',
      status: '进行中',
      tags: ['实验目标'],
      updatedAt: '2026.06.01 10:40',
      timeline: [
        {
          id: 'exp-organoid-1-log-1',
          date: '2026.06.01',
          status: '湿试验记录',
          summary: '完成第一轮培养温度记录',
          actor: '李婷',
          updatedAt: '2026.06.01 10:40',
          detailTitle: '培养条件记录',
          detailDescription: '完成 3 组温度和 2 组营养条件组合的观察记录。',
          detailSections: [
            {
              title: '观察结果',
              content: '37℃ 条件下器官球形态更稳定，低营养组需要继续验证。',
            },
          ],
          attachments: ['培养记录表.xlsx'],
        },
      ],
      resources: [{ id: 'exp-organoid-1-file-1', name: '类器官培养 SOP.pdf' }],
    },
  ],
};

export const KNOWLEDGE_BY_PROJECT: Record<string, ProjectKnowledgeItem[]> = {
  'p-crispr': [
    {
      id: 'kn-crispr-1',
      title: 'gRNA 设计规范（V2）',
      summary: '沉淀 gRNA 序列设计中的长度、GC 比例和候选过滤原则。',
      ownerId: 'm-wangping',
      status: '手工创建',
      tags: ['设计规范', '实验目标'],
    },
    {
      id: 'kn-crispr-2',
      title: 'CRISPR 文献要点汇总',
      summary: '汇总近 6 个月相关论文中的关键结论与可复用方法。',
      ownerId: 'm-songke',
      status: '对话沉淀',
      tags: ['文献', '结果验证'],
    },
    {
      id: 'kn-crispr-3',
      title: '测序平台参数模板',
      summary: '统一测序流程参数配置，减少重复配置和操作误差。',
      ownerId: 'm-wangzheyv',
      status: '手工创建',
      tags: ['流程优化'],
    },
    {
      id: 'kn-crispr-4',
      title: '脱靶风险评估方法',
      summary: '对比三种脱靶评估方法的准确率、成本与适用场景。',
      ownerId: 'm-teluoke',
      status: '外部导入',
      tags: ['脱靶控制'],
    },
    {
      id: 'kn-crispr-5',
      title: '实验异常排查清单',
      summary: '整理转染失败、表达异常等常见问题与排查路径。',
      ownerId: 'm-duyuesheng',
      status: '对话沉淀',
      tags: ['流程优化'],
    },
  ],
  'p-thal': [
    {
      id: 'kn-thal-1',
      title: '地贫研究知识图谱',
      summary: '构建地贫研究中的基因、靶点与疗法关系图谱。',
      ownerId: 'm-zhouyan',
      status: '手工创建',
      tags: ['靶点研究'],
    },
    {
      id: 'kn-thal-2',
      title: '临床前报告模板',
      summary: '统一实验报告结构，规范数据记录与结果输出格式。',
      ownerId: 'm-lijin',
      status: '对话沉淀',
      tags: ['流程优化'],
    },
  ],
  'p-organoid': [
    {
      id: 'kn-organoid-1',
      title: '类器官实验 SOP',
      summary: '沉淀类器官实验标准操作流程与关键注意事项。',
      ownerId: 'm-liting',
      status: '手工创建',
      tags: ['设计规范'],
    },
  ],
};

export const EXPERIMENTS_BY_PROJECT: Record<string, ProjectExperimentItem[]> = {};

Object.keys(EXPERIMENT_DETAILS_BY_PROJECT).forEach((projectId) => {
  EXPERIMENTS_BY_PROJECT[projectId] = EXPERIMENT_DETAILS_BY_PROJECT[projectId].map(
    ({ subtitle, updatedAt, timeline, resources, ...item }) => item,
  );
});

export const findProjectExperimentDetail = (projectId: string, experimentId: string) =>
  EXPERIMENT_DETAILS_BY_PROJECT[projectId]?.find(
    (experiment) => experiment.id === experimentId,
  );
