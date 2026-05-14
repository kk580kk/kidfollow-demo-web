#!/bin/bash
# 5/23 生产环境停止脚本

set -e

echo "=== KIDFOLLOW 生产环境停止 ==="

PID_DIR="/var/run/kidfollow"

# 函数：停止服务
stop_service() {
    local name=$1
    local pid_file="$PID_DIR/$name.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo "停止 $name (PID: $pid)..."
            kill "$pid" 2>/dev/null || true
            
            # 等待进程结束
            local count=0
            while kill -0 "$pid" 2>/dev/null && [ $count -lt 10 ]; do
                sleep 1
                count=$((count + 1))
            done
            
            if kill -0 "$pid" 2>/dev/null; then
                echo "  强制停止 $name..."
                kill -9 "$pid" 2>/dev/null || true
            fi
            
            echo "  ✅ $name 已停止"
        else
            echo "  ℹ️ $name 未运行"
        fi
        rm -f "$pid_file"
    else
        echo "  ℹ️ $name 未找到 PID 文件"
    fi
}

# 1. 停止后端
echo "1. 停止后端服务..."
stop_service "backend"

# 2. 停止前端
echo "2. 停止前端服务..."
stop_service "frontend"

# 3. 清理残留进程
echo "3. 清理残留进程..."
pkill -f "kidfollow-demo-backend" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2
echo "   ✅ 残留进程已清理"

# 4. 检查端口释放
echo "4. 检查端口释放..."
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>/dev/null; then
    echo "   ⚠️ 端口 8080 仍被占用"
else
    echo "   ✅ 端口 8080 已释放"
fi

if lsof -Pi :5174 -sTCP:LISTEN -t >/dev/null 2>/dev/null; then
    echo "   ⚠️ 端口 5174 仍被占用"
else
    echo "   ✅ 端口 5174 已释放"
fi

echo ""
echo "=== 停止完成 ==="
echo "服务已停止，可以安全地进行维护或重启"
