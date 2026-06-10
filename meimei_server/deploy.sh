#!/bin/bash
# ========================================
# PM2 管理脚本
# 用法: ./deploy.sh [deploy|start|stop|restart|reload|hard|logs|status|monit|delete]
#   deploy  - git pull + build + reload (零停机更新代码) ← 推荐日常使用
#   hard    - git pull + build + delete + start (硬重启，更新 env_file)
#   restart - 仅重启（不拉代码、不构建）
#   reload  - 仅零停机重载（不拉代码、不构建）
#   start   - 仅启动
#   stop    - 仅停止
#   delete  - 删除进程
#   logs    - 查看日志
#   status  - 查看状态
#   monit   - 监控面板
# ========================================

APP_NAME="meimei_server_3000"      # 必须和 ecosystem.config.js 里的 name 一致
CONFIG_FILE="ecosystem.config.js"

# 切换到脚本所在目录
cd "$(dirname "$0")"

# 检查是否有执行权限（仅在实际部署时使用）
if [ ! -x "$0" ]; then
    echo "警告: 脚本没有执行权限"
    sudo chmod 777 deploy.sh
fi

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# git pull + 构建（仅 deploy/hard 调用）
do_pull_and_build() {
    echo -e "${BLUE}>> git pull origin master ...${NC}"
    git pull origin master -X theirs --no-edit
    if [ $? -ne 0 ]; then
        echo -e "${RED}git pull 失败！${NC}"
        exit 1
    fi

    echo -e "${BLUE}>> npm run build ...${NC}"
    npm run build
    if [ $? -ne 0 ]; then
        echo -e "${RED}构建失败！终止部署${NC}"
        exit 1
    fi

    # 校验构建产物：若 dist 不存在则报错
    if [ ! -f "dist/main.js" ]; then
        echo -e "${RED}dist/main.js 不存在，构建可能失败${NC}"
        exit 1
    fi
}

case "$1" in
    deploy)
        echo -e "${GREEN}>> 部署模式：拉代码 + 构建 + 零停机 reload${NC}"
        do_pull_and_build
        # 检查进程是否存在
        if pm2 describe ${APP_NAME} > /dev/null 2>&1; then
            echo -e "${BLUE}>> pm2 reload ${APP_NAME} --update-env${NC}"
            pm2 reload ${APP_NAME} --update-env
        else
            echo -e "${BLUE}>> 首次启动: pm2 start ${CONFIG_FILE} --env production${NC}"
            pm2 start ${CONFIG_FILE} --env production
        fi
        pm2 save
        pm2 status
        ;;

    hard)
        echo -e "${YELLOW}>> 硬重启模式：拉代码 + 构建 + delete + start（会重新加载 env_file）${NC}"
        do_pull_and_build
        pm2 delete ${APP_NAME} 2>/dev/null || true
        pm2 start ${CONFIG_FILE} --env production
        pm2 save
        pm2 status
        ;;

    start)
        echo -e "${GREEN}>> 启动 ${APP_NAME}...${NC}"
        pm2 start ${CONFIG_FILE} --env production
        pm2 save
        pm2 status
        ;;

    stop)
        echo -e "${YELLOW}>> 停止 ${APP_NAME}...${NC}"
        pm2 stop ${APP_NAME}
        ;;

    restart)
        echo -e "${BLUE}>> 重启 ${APP_NAME}（仅重启，不拉代码不构建）...${NC}"
        pm2 restart ${APP_NAME} --update-env
        pm2 status
        ;;

    reload)
        echo -e "${BLUE}>> 零停机 reload ${APP_NAME}...${NC}"
        pm2 reload ${APP_NAME} --update-env
        ;;

    logs)
        echo -e "${GREEN}>> 实时日志 (Ctrl+C 退出)...${NC}"
        pm2 logs ${APP_NAME} --lines 100
        ;;

    status)
        echo -e "${GREEN}>> 应用状态：${NC}"
        pm2 status
        ;;

    monit)
        pm2 monit
        ;;

    delete)
        echo -e "${YELLOW}>> 删除 ${APP_NAME}...${NC}"
        pm2 delete ${APP_NAME}
        pm2 save
        ;;

    *)
        echo "用法: $0 {deploy|hard|start|stop|restart|reload|logs|status|monit|delete}"
        echo ""
        echo "命令说明："
        echo "  deploy  - 拉代码 + 构建 + 零停机 reload  ← 日常更新代码用这个"
        echo "  hard    - 拉代码 + 构建 + 硬重启（重新加载 env_file）  ← 改了 .env 用这个"
        echo "  restart - 仅重启（不拉代码、不构建）"
        echo "  reload  - 仅零停机重载（不拉代码、不构建）"
        echo "  start   - 启动"
        echo "  stop    - 停止"
        echo "  delete  - 删除进程"
        echo "  logs    - 查看实时日志"
        echo "  status  - 查看应用状态"
        echo "  monit   - 打开监控面板"
        exit 1
        ;;
esac
