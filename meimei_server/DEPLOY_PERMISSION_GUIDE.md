# Deploy.sh 执行权限配置说明

## 📋 问题描述

在 Ubuntu 系统中，`deploy.sh` 文件没有执行权限，导致无法直接运行部署脚本。

---

## ✅ 解决方案

### 方法一：手动添加执行权限（推荐）

在服务器上执行以下命令：

```bash
# 切换到项目目录
cd /path/to/meimei_server

# 添加执行权限
chmod u+x deploy.sh

# 验证权限是否添加成功
ls -l deploy.sh
```

预期输出：
```
-rwxr--r-- 1 user user 2048 May 18 10:00 deploy.sh
```

### 方法二：为所有用户添加执行权限

```bash
chmod +x deploy.sh
```

### 方法三：使用 sudo 直接运行

如果不想修改文件权限，可以使用 bash 直接执行：

```bash
sudo bash deploy.sh
```

---

## 🔧 脚本自动检测机制

我已经更新了 `deploy.sh` 脚本，添加了执行权限检测功能：

```bash
# 检查是否有执行权限（仅在实际部署时使用）
if [ ! -x "$0" ]; then
    echo "警告: 脚本没有执行权限"
    echo "请运行以下命令添加权限: chmod u+x deploy.sh"
    exit 1
fi
```

这样会在尝试运行时自动检测并提示用户添加权限。

---

## 🚀 使用方法

### 1. 添加权限后运行

```bash
# 添加执行权限
chmod u+x deploy.sh

# 运行部署脚本
./deploy.sh
```

### 2. 使用子命令

```bash
# 启动应用
./deploy.sh start

# 停止应用
./deploy.sh stop

# 重启应用
./deploy.sh restart

# 零停机重载
./deploy.sh reload

# 查看日志
./deploy.sh logs

# 查看状态
./deploy.sh status

# 打开监控面板
./deploy.sh monit

# 删除应用
./deploy.sh delete
```

---

## 📝 完整部署流程

### 本地推送代码到服务器

```bash
# 1. 在本地提交代码
git add .
git commit -m "Update deploy script"
git push origin master

# 2. SSH 登录服务器
ssh user@your-server.com

# 3. 进入项目目录
cd /path/to/meimei_server

# 4. 添加执行权限（首次使用时）
chmod u+x deploy.sh

# 5. 运行部署脚本
./deploy.sh restart
```

### 自动化部署（Git Hook）

如果你想实现自动化部署，可以配置 Git post-receive hook：

```bash
# 在服务器上配置 Git 仓库（bare repo）
cd /path/to/bare-repo.git
cat > hooks/post-receive << 'EOF'
#!/bin/bash
GIT_WORK_TREE=/path/to/meimei_server git checkout -f
cd /path/to/meimei_server
chmod u+x deploy.sh
./deploy.sh restart
EOF

chmod +x hooks/post-receive
```

---

## ⚠️ 注意事项

### 1. 权限问题

- **u+x**: 只给所有者添加执行权限（推荐）
- **g+x**: 给同组用户添加执行权限
- **o+x**: 给其他用户添加执行权限
- **+x**: 给所有用户添加执行权限

### 2. 安全建议

- 生产环境建议使用 `chmod u+x` 而非 `chmod +x`
- 避免给其他用户执行权限
- 定期审查文件权限

### 3. Docker 环境

如果你使用 Docker，可以在 Dockerfile 中添加：

```dockerfile
COPY deploy.sh /app/deploy.sh
RUN chmod u+x /app/deploy.sh
```

### 4. CI/CD 环境

在 GitHub Actions 中：

```yaml
- name: Make deploy.sh executable
  run: chmod u+x meimei_server/deploy.sh

- name: Deploy to server
  run: ./meimei_server/deploy.sh
```

---

## 🔍 常见问题

### Q1: 为什么我的脚本没有执行权限？

A: Linux 系统默认不会为新创建的文件添加执行权限。这是出于安全考虑。

### Q2: 如何查看所有文件的权限？

```bash
ls -l
```

输出示例：
```
-rwxr--r-- 1 user group 2048 May 18 10:00 deploy.sh
^  ^  ^
|  |  └── 其他用户
|  └───── 同组用户
└──────── 所有者
```

### Q3: 忘记密码怎么办？

如果遇到权限不足的错误：
```bash
# 使用 sudo
sudo chmod u+x deploy.sh

# 或使用 root
sudo -s
chmod u+x deploy.sh
exit
```

### Q4: Windows 开发的文件会有什么问题？

Windows 和 Linux 的换行符不同，可能导致错误：

```
/bin/bash^M: bad interpreter
```

解决方法：
```bash
# 安装 dos2unix
sudo apt install dos2unix

# 转换文件格式
dos2unix deploy.sh

# 重新添加权限
chmod u+x deploy.sh
```

---

## 🎯 推荐的最佳实践

### 1. Git 提交时自动处理权限

在项目根目录创建 `.husky/pre-commit`：

```bash
#!/bin/sh
# 确保 deploy.sh 有正确的权限
chmod +x meimei_server/deploy.sh
```

### 2. 在 README 中添加说明

在项目 README.md 中添部署章节：

```markdown
## 部署

### 首次部署

```bash
# 登录服务器
ssh user@server

# 进入项目目录
cd /path/to/meimei_server

# 添加执行权限
chmod u+x deploy.sh

# 运行部署
./deploy.sh start
```

### 日常部署

```bash
cd /path/to/meimei_server
./deploy.sh restart
```
```

### 3. 使用 PM2 开机自启

```bash
# 生成启动脚本
pm2 startup

# 根据输出的命令执行（通常需要 sudo）

# 保存当前进程列表
pm2 save
```

---

## 📞 技术支持

如遇到问题，请联系运维团队或查看 PM2 官方文档：https://pm2.keymetrics.io/
