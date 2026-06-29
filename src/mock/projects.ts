export interface MockProject {
  id: string;
  name: string;
  desc: string;
  count: number;
  knowledge: number;
  members: number;
}

export const mockProjects: MockProject[] = [
  {
    id: 'p-crispr',
    name: 'CRISPR实验优化',
    desc: '围绕 gRNA 设计、脱靶控制和编辑效率提升进行系统实验设计。',
    count: 5,
    knowledge: 18,
    members: 3,
  },
  {
    id: 'p-thal',
    name: '地贫基因治疗研究',
    desc: '整理地中海贫血相关通路、靶点和临床前验证方案。',
    count: 3,
    knowledge: 12,
    members: 5,
  },
  {
    id: 'p-organoid',
    name: '类器官模型验证',
    desc: '建立类器官实验流程并评估药物干预对比数据。',
    count: 2,
    knowledge: 9,
    members: 4,
  },
];
