export interface MockChat {
  id: string;
  title: string;
  date: string;
  count: number;
  projectId?: string;
  isPinned?: boolean;
}

export const mockChats: MockChat[] = [
  {
    id: 'c1',
    title: '文献汇总整理',
    date: '今天 10:25',
    count: 3,
  },
  {
    id: 'c2',
    title: '编辑效率优化',
    date: '昨天 16:40',
    count: 5,
    projectId: 'p-crispr',
  },
  {
    id: 'c3',
    title: '脱靶效应预测',
    date: '昨天 14:10',
    count: 2,
    projectId: 'p-crispr',
  },
  {
    id: 'c4',
    title: '载体构建策略讨论',
    date: '周一 09:30',
    count: 4,
    projectId: 'p-thal',
  },
  {
    id: 'c5',
    title: '动物实验样本分组',
    date: '周一 11:20',
    count: 1,
    projectId: 'p-thal',
  },
  {
    id: 'c6',
    title: '培养条件记录',
    date: '上周五 18:06',
    count: 2,
    projectId: 'p-organoid',
  },
];
