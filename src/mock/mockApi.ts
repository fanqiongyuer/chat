export interface StreamChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * 任务状态阶段，对齐豆包交互范式
 */
export type StatusPhase = 'thinking' | 'searching' | 'generating';

export interface SearchStep {
  type: 'knowledge' | 'web' | 'tool';
  label: string;
}

interface StreamChatParams {
  conversationId: string;
  messages: StreamChatMessage[];
  projectId?: string;
  onChunk: (chunk: string) => void;
  onStatusChange?: (phase: StatusPhase, steps: SearchStep[]) => void;
}

export type ChatStreamErrorCode =
  | 'FIRST_EVENT_TIMEOUT'
  | 'SERVER_ERROR'
  | 'HTTP_ERROR'
  | 'NETWORK_ERROR'
  | 'ABORTED';

export class ChatStreamError extends Error {
  code: ChatStreamErrorCode;
  status?: number;

  constructor(code: ChatStreamErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'ChatStreamError';
    this.code = code;
    this.status = status;
  }
}

const importMetaEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
const API_BASE_URL = importMetaEnv?.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8000';
const CHAT_STREAM_URL = `${API_BASE_URL}/api/v1/chat/stream`;
const FIRST_EVENT_TIMEOUT_MS = 15000;
const MOCK_CHAT_DELAY_MS = 24;

const BIO_PAPER_DOC_1 = [
  '# 生物文献测试 1：单细胞肿瘤微环境图谱',
  '',
  ':microscope: 目标：验证长文段落、表格、公式、Mermaid、代码块、PDF 预览。',
  '',
  '## 研究问题',
  '作者通过单细胞 RNA 测序，分析肿瘤微环境中免疫细胞组成与功能状态变化。',
  '',
  '## 核心结论',
  '- CD8 T 细胞在耗竭亚群中显著富集',
  '- 肿瘤相关巨噬细胞存在 M2 偏向',
  '- 仍需跨队列复现验证',
  '',
  '## 数据摘要',
  '| 指标 | 结果 |',
  '|---|---|',
  '| 样本数 | 48 |',
  '| 单细胞数 | 162,341 |',
  '| 主要平台 | 10x Genomics |',
  '| 关键发现 | T cell exhaustion pathway up |',
  '',
  '## 热力学示例公式',
  '$$\\Delta G = \\Delta H - T\\Delta S$$',
  '',
  '## 机制示意（Mermaid）',
  '```mermaid',
  'mindmap',
  '  root((Tumor Microenvironment))',
  '    CD8 T cell exhaustion',
  '      PD-1 up',
  '      LAG3 up',
  '    TAM polarization',
  '      M2 signature',
  '```',
  '',
  '## 复现实验命令示例',
  '```bash',
  'cellranger count --id=sampleA --transcriptome=/refdata-gex-GRCh38 --fastqs=/data/fastq',
  '```',
  '',
  '相关 DOI： [10.1038/s41586-019-1234-5](https://doi.org/10.1038/s41586-019-1234-5)',
  '相关 PMID： [PubMed: 31444322](https://pubmed.ncbi.nlm.nih.gov/31444322/)',
  '',
  '[PDF原文（示例）](https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf)',
].join('\n');

const BIO_PAPER_DOC_2 = [
  '# 生物文献测试 2：CRISPR 碱基编辑在遗传病模型中的应用',
  '',
  ':dna: 目标：验证序列图、引用块、代码块与链接样式。',
  '',
  '> 研究关注点：在不引入双链断裂条件下提高编辑精度并降低脱靶。',
  '',
  '## 研究流程（时序图）',
  '```mermaid',
  'sequenceDiagram',
  '  participant R as Researcher',
  '  participant C as CellLine',
  '  participant S as Sequencing',
  '  R->>C: 转染 BE4max + gRNA',
  '  C-->>R: 72h 后收集样本',
  '  R->>S: Amplicon 测序',
  '  S-->>R: 编辑效率与脱靶报告',
  '```',
  '',
  '## 关键指标',
  '| 指标 | 数据 |',
  '|---|---|',
  '| On-target 编辑效率 | 62.4% |',
  '| Top5 位点平均脱靶 | 0.14% |',
  '| 细胞活率 | 91.7% |',
  '',
  '## 统计检验',
  '$$p < 0.01,\\quad CI_{95\\%}=[0.55,0.68]$$',
  '',
  '相关 DOI： [10.1126/science.aav1234](https://doi.org/10.1126/science.aav1234)',
  '相关 PMID： [PubMed: 30487357](https://pubmed.ncbi.nlm.nih.gov/30487357/)',
].join('\n');

const BIO_PAPER_DOC_3 = [
  '# 生物文献测试 3：类器官药敏筛选与转化评估',
  '',
  ':pill: 目标：验证多级标题、长段落、表格、列表混排。',
  '',
  '## 背景',
  '患者来源类器官（PDO）可更贴近体内表型，用于候选药物初筛与联合用药策略评估。',
  '',
  '### 实验设计',
  '1. 建立 24 个 PDO 样本库',
  '2. 进行 12 种药物单药曲线测试',
  '3. 对前 3 名候选方案进行联合验证',
  '',
  '### 结果摘要',
  '| 方案 | ORR proxy | 备注 |',
  '|---|---|---|',
  '| Drug A | 58% | KRAS 突变亚群表现更优 |',
  '| Drug B | 41% | 高剂量出现毒性窗口 |',
  '| A + C | 67% | 观察到协同效应 |',
  '',
  '### 风险与建议',
  '- 建议增加批次平衡，降低培养条件差异引入的偏差',
  '- 建议在动物模型进一步验证 A+C 联合方案',
  '- 建议补充药代动力学参数以支撑临床可行性',
  '',
].join('\n');

const BIO_PAPER_DOC_BUNDLE = [
  '下面给你 3 篇可直接用于渲染测试的样例文献：',
  '',
  '---',
  '',
  BIO_PAPER_DOC_1,
  '',
  '---',
  '',
  BIO_PAPER_DOC_2,
  '',
  '---',
  '',
  BIO_PAPER_DOC_3,
  '',
  '---',
  '',
  '可继续发送关键词触发单篇：`生物文献1` / `生物文献2` / `生物文献3`。',
].join('\n');

const PAPER_LIST_MARKER = '[[PAPER_LIST_JSON]]';

const PAPER_RECOMMENDATION_PAYLOAD = {
  items: [
    {
      title: 'Integrating gut microbiome and host transcriptomics for the personalized management of IBD',
      pmid: '4172135',
      doi: '10.1080/17501911.2025.2591594',
    },
    {
      title: 'Longitudinal multi-omics signatures predict flare-up risk in ulcerative colitis',
      pmid: '39284511',
      doi: '10.1136/gutjnl-2023-330217',
    },
  ],
};

const MOCK_RESPONSE_LIBRARY: Array<{ keywords: string[]; response: string }> = [
  {
    keywords: ['一句话介绍', '你能帮我做什么', '介绍你能'],
    response: '【脚本01-基础响应】我是科研对话助手，可帮你做问题拆解、实验方案草拟、文献要点提炼与风险提示。',
  },
  {
    keywords: ['实验框架', 'a药', 'b药'],
    response: '【脚本02-方案草拟】实验框架：1) 明确终点指标；2) 设置A/B与对照组；3) 设定采样与统计方法；4) 记录偏差并复核。',
  },
  {
    keywords: ['压缩成3条', '三条最关键步骤'],
    response: '【脚本03-多轮记忆】三条关键步骤：1) 分组与随机化；2) 按时间点采样检测；3) 用统一统计口径比较A/B差异。',
  },
  {
    keywords: ['第二个方案成本和风险', '第二个方案'],
    response: '【脚本04-指代理解】第二个方案（小鼠实验）成本更高，主要风险是样本量不足、个体差异大、伦理审批周期长。',
  },
  {
    keywords: ['最新那篇文献', '根据我们项目里最新'],
    response: '【脚本05-信息不足】当前未提供具体文献标题/摘要，我不能直接下结论。请补充文献内容后我再给结论。',
  },
  {
    keywords: ['markdown表格', '表格输出'],
    response: '【脚本06-结构化输出】| 维度 | 内容 |\n|---|---|\n| 实验目标 | 比较A/B抑瘤效果 |\n| 变量 | 给药剂量、给药周期 |\n| 评价指标 | 肿瘤体积、存活率 |\n| 风险控制 | 随机分组、盲法评估 |',
  },
  {
    keywords: ['三点结论', '两个风险', '下一步建议'],
    response: '【脚本07-长文总结】结论：①A组趋势更优；②差异集中在中后期；③样本波动需复核。风险：样本量偏小、批次效应。建议：补充重复实验并统一检测窗口。',
  },
  {
    keywords: ['5条bullet', '不超过18个字'],
    response: '【脚本08-约束遵循】\n- 明确实验目标\n- 固定分组标准\n- 统一采样时点\n- 记录异常偏差\n- 输出统计结论',
  },
  {
    keywords: ['继续上次回答', '从样本分组开始'],
    response: '【脚本09-错误恢复】继续上次内容：样本分组建议按基线体重分层随机，A/B/对照1:1:1，记录剔除标准并预注册。',
  },
  {
    keywords: ['超时', '没有回复', '没反应'],
    response: '【脚本10-异常提示】已收到请求。若超过15秒无首包，建议检查模型服务连通性或先切换本地mock联调。',
  },
  {
    keywords: ['安全', '越权', 'token', '密码'],
    response: '【脚本11-安全策略】该请求涉及敏感信息，我不能提供凭据或越权操作。可改为提供安全排查清单。',
  },
  {
    keywords: [
      '放几篇生物文献',
      '生物文献测试',
      'markdown文献展示',
      'markdown文展示',
      'markdwon文展示',
      'markdwon文档展示',
      'markdwon展示',
      'markdown文档展示',
      'markdown展示',
      '文献展示',
      '文献测试合集',
    ],
    response: BIO_PAPER_DOC_BUNDLE,
  },
  {
    keywords: ['生物文献1', '文献测试1', 'paper test 1'],
    response: BIO_PAPER_DOC_1,
  },
  {
    keywords: ['生物文献2', '文献测试2', 'paper test 2'],
    response: BIO_PAPER_DOC_2,
  },
  {
    keywords: ['生物文献3', '文献测试3', 'paper test 3'],
    response: BIO_PAPER_DOC_3,
  },
  {
    keywords: ['查找文献', '找文献', '推荐文献', '文献列表', 'paper list', 'literature'],
    response: `${PAPER_LIST_MARKER} ${JSON.stringify(PAPER_RECOMMENDATION_PAYLOAD)}`,
  },
  {
    keywords: ['文献', 'paper', '总结'],
    response: '【脚本12-文献速览】先提炼研究问题、方法、关键结果，再标注适用边界与复现条件。',
  },
  {
    keywords: ['实验', '方案', 'protocol'],
    response: '【脚本13-实验建议】先明确目标，再确定变量与分组，最后给出评价指标和风险控制点。',
  },
  {
    keywords: ['你好', 'hello'],
    response: '【脚本14-问候】你好，我已进入固定回归测试模式，你可以按脚本编号逐条验证。',
  },
];

function shouldUseMockChat(): boolean {
  const runtimeMockFlag = window.localStorage.getItem('use_mock_chat');
  if (runtimeMockFlag === '1') return true;
  if (runtimeMockFlag === '0') return false;

  if (importMetaEnv?.VITE_USE_MOCK_CHAT === 'true') return true;
  if (importMetaEnv?.VITE_USE_MOCK_CHAT === 'false') return false;

  // 默认启用 mock，避免本地联调时因模型服务不可用导致无回复。
  return true;
}

function buildMockReply(messages: StreamChatMessage[], projectId?: string): string {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.content?.trim() ?? '';
  const lowerText = lastUserMessage.toLowerCase();

  const compactText = lowerText.replace(/\s+/g, '');
  const hasMarkdownIntent =
    /(markdown|md)/.test(compactText) ||
    /(markdwon|markdon|mardown|markdwon)/.test(compactText) ||
    (compactText.includes('mark') && compactText.includes('down'));
  const hasDocIntent = /(文献|文档|文展示|展示|测试|paper|bio)/.test(lastUserMessage.toLowerCase());

  const wantsMarkdownBioDocs =
    (hasMarkdownIntent && hasDocIntent) ||
    (/生物/.test(lastUserMessage) && /(文献|paper)/.test(lowerText));

  if (wantsMarkdownBioDocs) {
    return BIO_PAPER_DOC_BUNDLE;
  }

  const matchedTemplate = MOCK_RESPONSE_LIBRARY.find(({ keywords }) =>
    keywords.some((keyword) => lowerText.includes(keyword.toLowerCase())),
  );

  if (matchedTemplate) {
    return `${matchedTemplate.response}${projectId ? `（项目：${projectId}）` : ''}`;
  }

  return `这是模拟回复：已收到你的问题“${lastUserMessage || '（空输入）'}”。你可以继续追问，我会保持多轮上下文用于联调。`;
}

async function streamMockResponse(
  messages: StreamChatMessage[],
  projectId: string | undefined,
  onChunk: (chunk: string) => void,
  onStatusChange?: (phase: StatusPhase, steps: SearchStep[]) => void,
): Promise<void> {
  const mockReply = buildMockReply(messages, projectId);

  /* ── 阶段 1：思考 ── */
  onStatusChange?.('thinking', []);
  await new Promise((resolve) => window.setTimeout(resolve, 600 + Math.random() * 400));

  /* ── 阶段 2：搜索（按意图生成搜索步骤） ── */
  const steps = buildMockSearchSteps(messages);
  onStatusChange?.('searching', steps);
  await new Promise((resolve) => window.setTimeout(resolve, 500 + Math.random() * 500));

  /* ── 阶段 3：生成 ── */
  onStatusChange?.('generating', steps);

  let chunkSize = 1;
  let delay = MOCK_CHAT_DELAY_MS;

  if (mockReply.length > 2200) {
    chunkSize = 28;
    delay = 8;
  } else if (mockReply.length > 900) {
    chunkSize = 14;
    delay = 12;
  }

  for (let i = 0; i < mockReply.length; i += chunkSize) {
    onChunk(mockReply.slice(i, i + chunkSize));
    await new Promise((resolve) => window.setTimeout(resolve, delay));
  }
}

/**
 * 根据用户输入内容生成模拟搜索步骤，让状态展示更真实
 */
function buildMockSearchSteps(messages: StreamChatMessage[]): SearchStep[] {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  const lower = lastUserMessage.toLowerCase();
  const steps: SearchStep[] = [];

  if (/(文献|paper|bio|生物|论文|研究)/.test(lower)) {
    steps.push(
      { type: 'knowledge', label: '在知识库中检索相关文献…' },
      { type: 'web', label: `搜索「${lastUserMessage.slice(0, 30)}」相关论文` },
      { type: 'knowledge', label: '整合 3 篇文献摘要' },
    );
  } else if (/(实验|protocol|方案|设计)/.test(lower)) {
    steps.push(
      { type: 'knowledge', label: '检索实验方案模板…' },
      { type: 'tool', label: '调用实验设计助手' },
    );
  } else if (/(数据|分析|统计|图表)/.test(lower)) {
    steps.push(
      { type: 'knowledge', label: '检索数据分析方法…' },
      { type: 'tool', label: '调用统计分析工具' },
    );
  } else {
    steps.push(
      { type: 'knowledge', label: '检索相关知识…' },
    );
  }

  return steps;
}

function parseEventPayload(payload: string): { event: string; data: string } | null {
  const lines = payload
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  let event = 'message';
  let data = '';

  lines.forEach((line) => {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      data = line.slice(5).trim();
    }
  });

  if (!data) return null;
  return { event, data };
}

function parseJsonData(data: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

export async function streamChatResponse({
  conversationId,
  messages,
  projectId,
  onChunk,
  onStatusChange,
}: StreamChatParams): Promise<void> {
  if (shouldUseMockChat()) {
    await streamMockResponse(messages, projectId, onChunk, onStatusChange);
    return;
  }

  // 真实 SSE 连接后立刻进入 thinking 阶段
  onStatusChange?.('thinking', []);

  const controller = new AbortController();
  let hasReceivedEvent = false;
  let hasReceivedMessageChunk = false;

  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, FIRST_EVENT_TIMEOUT_MS);

  const markEventReceived = () => {
    if (hasReceivedEvent) return;
    hasReceivedEvent = true;
    window.clearTimeout(timeoutId);
  };

  try {
    const response = await fetch(CHAT_STREAM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        messages,
        project_id: projectId,
      }),
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      throw new ChatStreamError('HTTP_ERROR', `请求失败: ${response.status}`, response.status);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';

      for (const eventBlock of events) {
        const parsed = parseEventPayload(eventBlock);
        if (!parsed) continue;

        markEventReceived();
        const payload = parseJsonData(parsed.data);

        if (parsed.event === 'message') {
          const chunk = payload?.content;
          if (typeof chunk === 'string' && chunk) {
            if (!hasReceivedMessageChunk) {
              // 首次收到内容片段时切换到 generating 阶段
              onStatusChange?.('generating', []);
            }
            hasReceivedMessageChunk = true;
            onChunk(chunk);
          }
          continue;
        }

        // 后端搜索事件：event: search  data: {"steps":[...]}
        if (parsed.event === 'search') {
          const rawSteps = Array.isArray(payload?.steps) ? payload.steps : [];
          const steps: SearchStep[] = rawSteps
            .filter((s: unknown) => s && typeof s === 'object')
            .map((s: Record<string, unknown>) => ({
              type: (s.type as SearchStep['type']) ?? 'tool',
              label: typeof s.label === 'string' ? s.label : '',
            }))
            .filter((s: SearchStep) => s.label);
          onStatusChange?.('searching', steps);
          continue;
        }

        if (parsed.event === 'error') {
          const serverError = typeof payload?.message === 'string' ? payload.message : '服务端返回错误';
          throw new ChatStreamError('SERVER_ERROR', serverError);
        }

        if (parsed.event === 'done') {
          const fullContent = payload?.full_content;
          if (!hasReceivedMessageChunk && typeof fullContent === 'string' && fullContent) {
            onChunk(fullContent);
          }
          return;
        }
      }
    }

    if (buffer.trim()) {
      const parsed = parseEventPayload(buffer);
      if (parsed) {
        markEventReceived();
      }
    }
  } catch (error) {
    if (error instanceof ChatStreamError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      if (!hasReceivedEvent) {
        throw new ChatStreamError('FIRST_EVENT_TIMEOUT', '请求已发送，但服务端长时间未开始返回数据');
      }
      throw new ChatStreamError('ABORTED', '请求被中断');
    }

    throw new ChatStreamError('NETWORK_ERROR', `网络请求失败: ${String(error)}`);
  } finally {
    window.clearTimeout(timeoutId);
  }
}