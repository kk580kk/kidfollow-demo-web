#!/bin/bash
# 5/23 上线启动脚本

set -e

echo "=== KIDFOLLOW 生产环境启动 ==="

# 配置
PROJECT_DIR="/Volumes/Serene 2T/Workspaces/github.com/kk580kk/kidfollow-demo-web"
LOG_DIR="/var/log/kidfollow"
PID_DIR="/var/run/kidfollow"

# 创建日志目录
mkdir -p "$LOG_DIR"
mkdir -p "$PID_DIR"

# 函数：检查服务是否运行
check_service() {
    local port=$1
    local name=$2
    
    if nc -z localhost $port 2>/dev/null; then
        echo "   ✅ $name 已在端口 $port 运行"
        return 0
    else
        return 1
    fi
}

# 函数：停止服务
stop_service() {
    local name=$1
    local pid_file="$PID_DIR/$name.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo "   停止 $name (PID: $pid)..."
            kill "$pid"
            sleep 2
        fi
        rm -f "$pid_file"
    fi
}

# 1. 检查并停止现有服务
echo "1. 检查现有服务..."
stop_service "backend"
stop_service "frontend"
pkill -f "kidfollow-demo-backend" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2
echo "   ✅ 旧服务已停止"

# 2. 检查端口占用
echo "2. 检查端口占用..."
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    echo "   ❌ 端口 8080 被占用"
    exit 1
fi
if lsof -Pi :5174 -sTCP:LISTEN -t >/dev/null ; then
    echo "   ❌ 端口 5174 被占用"
    exit 1
fi
echo "   ✅ 端口可用"

# 3. 检查代码更新
echo "3. 检查代码更新..."
cd "$PROJECT_DIR"
git fetch origin
echo "   ✅ 代码更新检查完成"

# 4. 构建后端
echo "4. 构建后端..."
cd "$PROJECT_DIR/backend"
mvn clean package -DskipTests -q
if [ ! -f "target/kidfollow-demo-backend-1.0.0.jar" ]; then
    echo "   ❌ 后端构建失败"
    exit 1
fi
echo "   ✅ 后端构建成功"

# 5. 构建前端
echo "5. 构建前端..."
cd "$PROJECT_DIR/frontend"
npm ci --silent 2>/dev/null || npm install --silent
npm run build
if [ ! -d "dist" ]; then
    echo "   ❌ 前端构建失败"
    exit 1
fi
echo "   ✅ 前端构建成功"

# 6. 启动后端
echo "6. 启动后端服务..."
cd "$PROJECT_DIR/backend"
nohup java -jar target/kidfollow-demo-backend-1.0.0.jar \
    --server.port=8080 \
    --logging.file.name="$LOG_DIR/backend.log" \
    > "$LOG_DIR/backend.out" 2>&1 &

BACKEND_PID=$!
echo $BACKEND_PID > "$PID_DIR/backend.pid"
echo "   后端 PID: $BACKEND_PID"

# 等待后端启动
sleep 5
if ! check_service 8080 "后端"; then
    echo "   ❌ 后端启动失败"
    exit 1
fi

# 7. 启动前端
echo "7. 启动前端服务..."
cd "$PROJECT_DIR/frontend"
nohup npm run preview -- --host 0.0.0.0 --port 5174 \
    > "$LOG_DIR/frontend.log" 2>&1 &

FRONTEND_PID=$!
echo $FRONTEND_PID > "$PID_DIR/frontend.pid"
echo "   前端 PID: $FRONTEND_PID"

# 等待前端启动
sleep 3
if ! check_service 5174 "前端"; then
    echo "   ❌ 前端启动失败"
    exit 1
fi

# 8. 健康检查
echo "8. 健康检查..."
sleep 2

# 检查后端 HTTP
if curl -s http://localhost:8080/ > /dev/null; then
    echo "   ✅ 后端 HTTP 正常"
else
    echo "   ⚠️ 后端 HTTP 可能未完全启动"
fi

# 检查前端 HTTP
if curl -s http://localhost:5174/ > /dev/null; then
    echo "   ✅ 前端 HTTP 正常"
else
    echo "   ⚠️ 前端 HTTP 可能未完全启动"
fi

# 9. 生成状态报告
echo "9. 生成状态报告..."
cat > "$LOG_DIR/status-report.txt" << EOF
=== KIDFOLLOW 服务状态报告 ===
生成时间: $(date '+%Y-%m-%d %H:%M:%S')

服务状态:
- 后端服务: 运行中 (PID: $(cat $PID_DIR/backend.pid))
- 前端服务: 运行中 (PID: $(cat $PID_DIR/frontend.pid))

访问地址:
- 前端: http://192.168.71.9:5174/
- 后端: http://192.168.71.9:8080/

日志文件:
- 后端: $LOG_DIR/backend.log
- 前端: $LOG_DIR/frontend.log

WebSocket 端点:
- 传感器: ws://192.168.71.9:8080/sensor-ws
- 路径规划: ws://192.168.71.9:8080/ws/path-planning
EOF
echo "   ✅ 状态报告已生成"

echo ""
echo "=== 启动完成 ==="
echo "访问地址: http://192.168.71.9:5174/"
echo "日志目录: $LOG_DIR"
echo "状态报告: $LOG_DIR/status-report.txt"
echo ""
echo "常用命令:"
echo "  查看后端日志: tail -f $LOG_DIR/backend.log"
echo "  查看前端日志: tail -f $LOG_DIR/frontend.log"
echo "  停止服务: $PROJECT_DIR/scripts/stop-production.sh"
