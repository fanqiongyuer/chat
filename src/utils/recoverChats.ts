/**
 * 自动恢复历史对话的工具函数
 * 在应用启动时调用即可自动恢复所有对话
 */

interface MockChat {
  id: string;
  title: string;
  date: string;
  count: number;
  projectId?: string;
  isPinned?: boolean;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// 从数据库导出的所有对话数据
const RECOVERED_CHATS: MockChat[] = [
  { id: 'c5', title: '新对话', date: '历史对话', count: 0, projectId: 'p-thal', isPinned: false },
  { id: 'it-loading-check-3', title: '新对话', date: '历史对话', count: 0, projectId: null, isPinned: false },
  { id: 'it-loading-check-2', title: '新对话', date: '历史对话', count: 0, projectId: null, isPinned: false },
  { id: 'it-loading-check-1', title: '新对话', date: '历史对话', count: 0, projectId: null, isPinned: false },
  { id: 'c1', title: '新对话', date: '历史对话', count: 0, projectId: null, isPinned: false },
  { id: 'conv-generic-001', title: '新对话', date: '历史对话', count: 0, projectId: 'p-crispr', isPinned: false },
  { id: 'conv-fast-fail-002', title: '新对话', date: '历史对话', count: 0, projectId: 'p-crispr', isPinned: false },
  { id: 'conv-check-003', title: '新对话', date: '历史对话', count: 0, projectId: 'p-crispr', isPinned: false },
  { id: 'conv-debug-002', title: '新对话', date: '历史对话', count: 0, projectId: 'p-crispr', isPinned: false },
  { id: 'c3', title: '新对话', date: '历史对话', count: 0, projectId: 'p-crispr', isPinned: false },
  { id: 'c2', title: '新对话', date: '历史对话', count: 0, projectId: 'p-crispr', isPinned: false },
  { id: 'c4', title: '新对话', date: '历史对话', count: 0, projectId: 'p-thal', isPinned: false },
  { id: 'conv-debug-001', title: '新对话', date: '历史对话', count: 0, projectId: 'p-crispr', isPinned: false },
];

// 从数据库导出的所有消息数据
const RECOVERED_MESSAGES: Record<string, Message[]> = {
  'conv_id:c1': [
    { role: 'user', content: '什么玩意' },
    { role: 'assistant', content: '模型服务当前不可用：Ollama 不可用：All connection attempts failed' },
  ],
  'conv_id:c2': [
    { role: 'user', content: '发送消息' },
    { role: 'user', content: '发送消息' },
    { role: 'user', content: '回家上班吧' },
    { role: 'assistant', content: '模型服务当前不可用：Ollama 不可用：All connection attempts failed' },
    { role: 'user', content: '后端呢' },
    { role: 'assistant', content: '模型服务当前不可用：Ollama 不可用：All connection attempts failed' },
    { role: 'user', content: '额雾里看花' },
    { role: 'assistant', content: '模型服务当前不可用：Ollama 不可用：All connection attempts failed' },
    { role: 'user', content: '恶如' },
    { role: 'assistant', content: '模型服务当前不可用：Ollama 不可用：All connection attempts failed' },
  ],
  'conv_id:c3': [
    { role: 'user', content: '你可以了吗' },
    { role: 'user', content: '测试一下' },
    { role: 'assistant', content: '模型服务当前不可用：Ollama 不可用：All connection attempts failed' },
    { role: 'user', content: '君君' },
    { role: 'assistant', content: '模型服务当前不可用：Ollama 不可用：All connection attempts failed' },
    { role: 'user', content: 'j j' },
    { role: 'assistant', content: '模型服务当前不可用：Ollama 不可用：All connection attempts failed' },
  ],
  'conv_id:c4': [
    { role: 'user', content: '后端好了吗' },
    { role: 'user', content: '测试一下' },
    { role: 'assistant', content: '模型服务当前不可用：Ollama 不可用：All connection attempts failed' },
    { role: 'user', content: '测试' },
    { role: 'assistant', content: '模型服务当前不可用：Ollama 不可用：All connection attempts failed' },
  ],
  'conv_id:c5': [
    { role: 'user', content: '尽可能' },
    { role: 'assistant', content: '模型服务当前不可用：Ollama 不可用：All connection attempts failed' },
    { role: 'user', content: '离开你看你' },
    { role: 'assistant', content: '模型服务当前不可用：Ollama 不可用：All connection attempts failed' },
    { role: 'user', content: '你好，先用一句话介绍你能帮我做什么' },
    { role: 'assistant', content: '模型服务当前不可用：Ollama 不可用：All connection attempts failed' },
  ],
  'conv_id:conv-check-003': [
    { role: 'user', content: '你好' },
  ],
  'conv_id:conv-debug-001': [
    { role: 'user', content: '什么是CRISPR？请用三点简要说明。' },
  ],
  'conv_id:conv-debug-002': [
    { role: 'user', content: '你好，请回复OK' },
  ],
  'conv_id:conv-fast-fail-002': [
    { role: 'user', content: '你好' },
    { role: 'assistant', content: '模型服务当前不可用：Ollama 不可用：All connection attempts failed' },
  ],
  'conv_id:conv-generic-001': [
    { role: 'user', content: '你好' },
    { role: 'assistant', content: '模型服务当前不可用：Ollama 不可用：All connection attempts failed' },
  ],
  'conv_id:it-loading-check-1': [
    { role: 'user', content: '你好' },
    { role: 'assistant', content: '模型服务当前不可用：Ollama 不可用：All connection attempts failed' },
  ],
  'conv_id:it-loading-check-2': [
    { role: 'user', content: '请简单回复' },
    { role: 'assistant', content: '模型服务当前不可用：Ollama 不可用：All connection attempts failed' },
  ],
  'conv_id:it-loading-check-3': [
    { role: 'user', content: 'test loading' },
    { role: 'assistant', content: '模型服务当前不可用：Ollama 不可用：All connection attempts failed' },
  ],
};

/**
 * 自动恢复所有历史对话
 * 在 Layout 或 App 组件的 useEffect 中调用
 */
export function autoRecoverChats(): void {
  if (typeof window === 'undefined') return;

  try {
    const CHATS_STORAGE_KEY = 'deeptrace-chats';
    const CHAT_MESSAGES_STORAGE_KEY = 'deeptrace-chat-messages';

    // 检查是否已恢复过
    const existingChats = localStorage.getItem(CHATS_STORAGE_KEY);
    if (existingChats) {
      console.log('✅ 对话已存在，跳过恢复');
      return;
    }

    // 恢复对话列表
    localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(RECOVERED_CHATS));
    console.log(`✅ 已恢复 ${RECOVERED_CHATS.length} 个对话`);

    // 恢复消息数据
    localStorage.setItem(CHAT_MESSAGES_STORAGE_KEY, JSON.stringify(RECOVERED_MESSAGES));
    const totalMessages = Object.values(RECOVERED_MESSAGES).reduce((sum, msgs) => sum + msgs.length, 0);
    console.log(`✅ 已恢复 ${totalMessages} 条消息`);

    console.log('🎉 对话恢复完成！');
  } catch (error) {
    console.error('❌ 对话恢复失败:', error);
  }
}
