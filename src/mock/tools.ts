export interface MockTool {
  id: string;
  name: string;
  desc: string;
  icon: 'Dna' | 'Wrench' | 'BookOpen';
}

export const mockTools: MockTool[] = [
  {
    id: 't-seq-align',
    name: '序列比对助手',
    desc: '支持 DNA/RNA 序列快速比对并输出同源性摘要。',
    icon: 'Dna',
  },
  {
    id: 't-primer-check',
    name: '引物检查器',
    desc: '快速检查引物长度、GC 含量和二聚体风险。',
    icon: 'Wrench',
  },
  {
    id: 't-paper-brief',
    name: '文献速览',
    desc: '自动提取论文要点，输出实验流程与关键指标。',
    icon: 'BookOpen',
  },
];
