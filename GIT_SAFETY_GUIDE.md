# 🛡️ 代码安全指南 - 防止代码丢失

## 问题：为什么代码会"丢失"？

代码其实没有真的丢失，只是因为：
1. 你编写了新代码，但还没 `git commit` 提交
2. CatPaw 刷新或重新打开项目时，显示的是最后一个提交的版本
3. 新代码暂时"看不见"了

## ✅ 解决方案

### 方案 1：定期自动提交（推荐）

**每完成一个功能就提交一次：**

```bash
# 在项目根目录运行
./auto-commit.sh "你的提交信息"
```

示例：
```bash
./auto-commit.sh "feat: add user authentication"
./auto-commit.sh "fix: resolve chat loading issue"
./auto-commit.sh "style: update button styling"
```

### 方案 2：手动 Git 命令

```bash
# 1. 查看有哪些未提交的代码
git status

# 2. 提交代码
git add .
git commit -m "你的提交信息"

# 3. 查看提交历史
git log --oneline -10
```

### 方案 3：在 CatPaw 中使用 Git 源代码管理

1. 打开 CatPaw 中的 Source Control 面板（左侧栏）
2. 查看 Changes 选项卡
3. 点击 "+" 按钮暂存所有更改
4. 输入提交信息
5. 点击 ✓ 提交

---

## 🎯 最佳实践

### ✅ DO（应该做的）
- ✅ 每完成一个功能就提交一次
- ✅ 提交信息要清晰有意义
- ✅ 经常查看 `git status` 检查状态
- ✅ 定期 `git push` 到远程仓库

### ❌ DON'T（不要做的）
- ❌ 长时间不提交大量代码
- ❌ 提交信息写 "update" 或 "fix"（太模糊）
- ❌ 关闭 CatPaw 前不提交
- ❌ 忽视 "Changes not staged for commit" 的警告

---

## 📝 提交信息规范

```
feat:   新功能 (feature)
fix:    bug 修复 (fix)
docs:   文档更新 (documentation)
style:  代码风格（不影响功能）
refactor: 代码重构
perf:   性能优化
chore:  构建、依赖等变更
```

示例：
```
✅ git commit -m "feat: add password reset functionality"
✅ git commit -m "fix: resolve chat scroll issue"
✅ git commit -m "style: update modal component styling"
❌ git commit -m "update stuff"
❌ git commit -m "asdf"
```

---

## 🔄 恢复代码的三种方法

### 如果你的代码真的丢失了，可以这样恢复：

**方法 1：查看未提交的更改**
```bash
git diff
```

**方法 2：恢复到最后一个提交**
```bash
git checkout HEAD -- <filename>
```

**方法 3：查看提交历史**
```bash
git log --oneline -20
git show <commit-id>
```

---

## 🚀 快速参考

| 命令 | 作用 |
|------|------|
| `git status` | 查看当前状态 |
| `git add .` | 暂存所有更改 |
| `git commit -m "msg"` | 提交更改 |
| `git log --oneline` | 查看提交历史 |
| `./auto-commit.sh "msg"` | 自动提交脚本 |
| `git diff` | 查看具体改动 |
| `git push` | 推送到远程 |

---

## 💡 记住这一点

**你的代码永远不会真正丢失！** 

只要你的改动曾经被 Git 追踪过（即使没提交），通常都能找回：
- 查看 `git reflog` 历史
- 通过 `git fsck` 检查所有对象
- GitHub/GitLab 远程仓库中有备份

---

## 📞 需要帮助？

如果代码真的看不见了，运行：
```bash
git status
git diff
git log --oneline -20
```

这三个命令会告诉你一切！
