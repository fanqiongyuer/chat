// 恢复历史对话脚本
// 在浏览器开发者工具的 Console 中粘贴并执行此代码

(function() {
  const chats = [{"id": "c5", "title": "新对话", "date": "历史对话", "count": 0, "projectId": "p-thal", "isPinned": false}, {"id": "it-loading-check-3", "title": "新对话", "date": "历史对话", "count": 0, "projectId": null, "isPinned": false}, {"id": "it-loading-check-2", "title": "新对话", "date": "历史对话", "count": 0, "projectId": null, "isPinned": false}, {"id": "it-loading-check-1", "title": "新对话", "date": "历史对话", "count": 0, "projectId": null, "isPinned": false}, {"id": "c1", "title": "新对话", "date": "历史对话", "count": 0, "projectId": null, "isPinned": false}, {"id": "conv-generic-001", "title": "新对话", "date": "历史对话", "count": 0, "projectId": "p-crispr", "isPinned": false}, {"id": "conv-fast-fail-002", "title": "新对话", "date": "历史对话", "count": 0, "projectId": "p-crispr", "isPinned": false}, {"id": "conv-check-003", "title": "新对话", "date": "历史对话", "count": 0, "projectId": "p-crispr", "isPinned": false}, {"id": "conv-debug-002", "title": "新对话", "date": "历史对话", "count": 0, "projectId": "p-crispr", "isPinned": false}, {"id": "c3", "title": "新对话", "date": "历史对话", "count": 0, "projectId": "p-crispr", "isPinned": false}, {"id": "c2", "title": "新对话", "date": "历史对话", "count": 0, "projectId": "p-crispr", "isPinned": false}, {"id": "c4", "title": "新对话", "date": "历史对话", "count": 0, "projectId": "p-thal", "isPinned": false}, {"id": "conv-debug-001", "title": "新对话", "date": "历史对话", "count": 0, "projectId": "p-crispr", "isPinned": false}];
  const messages = {"conv_id:c1": [{"role": "user", "content": "什么玩意"}, {"role": "assistant", "content": "模型服务当前不可用：Ollama 不可用：All connection attempts failed"}], "conv_id:c2": [{"role": "user", "content": "发送消息"}, {"role": "user", "content": "发送消息"}, {"role": "user", "content": "回家上班吧"}, {"role": "assistant", "content": "模型服务当前不可用：Ollama 不可用：All connection attempts failed"}, {"role": "user", "content": "后端呢"}, {"role": "assistant", "content": "模型服务当前不可用：Ollama 不可用：All connection attempts failed"}, {"role": "user", "content": "额雾里看花"}, {"role": "assistant", "content": "模型服务当前不可用：Ollama 不可用：All connection attempts failed"}, {"role": "user", "content": "恶如"}, {"role": "assistant", "content": "模型服务当前不可用：Ollama 不可用：All connection attempts failed"}], "conv_id:c3": [{"role": "user", "content": "你可以了吗"}, {"role": "user", "content": "测试一下"}, {"role": "assistant", "content": "模型服务当前不可用：Ollama 不可用：All connection attempts failed"}, {"role": "user", "content": "君君"}, {"role": "assistant", "content": "模型服务当前不可用：Ollama 不可用：All connection attempts failed"}, {"role": "user", "content": "j j"}, {"role": "assistant", "content": "模型服务当前不可用：Ollama 不可用：All connection attempts failed"}], "conv_id:c4": [{"role": "user", "content": "后端好了吗"}, {"role": "user", "content": "测试一下"}, {"role": "assistant", "content": "模型服务当前不可用：Ollama 不可用：All connection attempts failed"}, {"role": "user", "content": "测试"}, {"role": "assistant", "content": "模型服务当前不可用：Ollama 不可用：All connection attempts failed"}], "conv_id:c5": [{"role": "user", "content": "尽可能"}, {"role": "assistant", "content": "模型服务当前不可用：Ollama 不可用：All connection attempts failed"}, {"role": "user", "content": "离开你看你"}, {"role": "assistant", "content": "模型服务当前不可用：Ollama 不可用：All connection attempts failed"}, {"role": "user", "content": "你好，先用一句话介绍你能帮我做什么"}, {"role": "assistant", "content": "模型服务当前不可用：Ollama 不可用：All connection attempts failed"}], "conv_id:conv-check-003": [{"role": "user", "content": "你好"}], "conv_id:conv-debug-001": [{"role": "user", "content": "什么是CRISPR？请用三点简要说明。"}], "conv_id:conv-debug-002": [{"role": "user", "content": "你好，请回复OK"}], "conv_id:conv-fast-fail-002": [{"role": "user", "content": "你好"}, {"role": "assistant", "content": "模型服务当前不可用：Ollama 不可用：All connection attempts failed"}], "conv_id:conv-generic-001": [{"role": "user", "content": "你好"}, {"role": "assistant", "content": "模型服务当前不可用：Ollama 不可用：All connection attempts failed"}], "conv_id:it-loading-check-1": [{"role": "user", "content": "你好"}, {"role": "assistant", "content": "模型服务当前不可用：Ollama 不可用：All connection attempts failed"}], "conv_id:it-loading-check-2": [{"role": "user", "content": "请简单回复"}, {"role": "assistant", "content": "模型服务当前不可用：Ollama 不可用：All connection attempts failed"}], "conv_id:it-loading-check-3": [{"role": "user", "content": "test loading"}, {"role": "assistant", "content": "模型服务当前不可用：Ollama 不可用：All connection attempts failed"}]};
  
  console.log('📥 正在恢复对话数据...');
  
  // 恢复对话列表
  localStorage.setItem('deeptrace-chats', JSON.stringify(chats));
  console.log(`✅ 已恢复 ${chats.length} 个对话到 localStorage`);
  
  // 恢复消息数据
  localStorage.setItem('deeptrace-chat-messages', JSON.stringify(messages));
  
  let totalMessages = 0;
  Object.keys(messages).forEach(key => {
    totalMessages += messages[key].length;
  });
  console.log(`✅ 已恢复 ${totalMessages} 条消息到 localStorage`);
  
  console.log('🎉 恢复完成！请刷新页面查看恢复的对话。');
  console.log('📊 统计信息:');
  console.log(`   - 对话数: ${chats.length}`);
  console.log(`   - 消息数: ${totalMessages}`);
  
  // 自动刷新页面
  setTimeout(() => {
    console.log('🔄 即将刷新页面...');
    location.reload();
  }, 2000);
})();
