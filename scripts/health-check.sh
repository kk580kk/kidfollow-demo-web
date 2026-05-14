#!/bin/bash
# 5/23 健康检查脚本

echo "=== KIDFOLLOW 健康检查 ==="

EXIT_CODE=0

# 1. 检查进程
echo "1. 检查进程状态..."
if pgrep -f "kidfollow-demo-backend" > /dev/null; then
    echo "   ✅ 后端进程运行中"
else
    echo "   ❌ 后端进程未运行"
    EXIT_CODE=1
fi

if pgrep -f "vite" > /dev/null; then
    echo "   ✅ 前端进程运行中"
else
    echo "   ❌ 前端进程未运行"
    EXIT_CODE=1
fi

# 2. 检查端口
echo "2. 检查端口监听..."
if nc -z localhost 8080 2>/dev/null; then
    echo "   ✅ 端口 8080 (后端) 正常"
else
    echo "   ❌ 端口 8080 (后端) 无响应"
    EXIT_CODE=1
fi

if nc -z localhost 5174 2>/dev/null; then
    echo "   ✅ 端口 5174 (前端) 正常"
else
    echo "   ❌ 端口 5174 (前端) 无响应"
    EXIT_CODE=1
fi

# 3. HTTP 检查
echo "3. 检查 HTTP 响应..."
if curl -s http://localhost:8080/ > /dev/null; then
    echo "   ✅ 后端 HTTP 响应正常"
else
    echo "   ⚠️ 后端 HTTP 响应异常"
fi

if curl -s http://localhost:5174/ > /dev/null; then
    echo "   ✅ 前端 HTTP 响应正常"
else
    echo "   ⚠️ 前端 HTTP 响应异常"
fi

# 4. 检查日志
echo "4. 检查日志..."
LOG_DIR="/var/log/kidfollow"
if [ -f "$LOG_DIR/backend.log" ]; then
    # 检查是否有错误
    if grep -i "error\|exception" "$LOG_DIR/backend.log" | tail -5 > /dev/null; then
        echo "   ⚠️ 后端日志中发现错误:"
        grep -i "error\|exception" "$LOG_DIR/backend.log" | tail -3 | sed 's/^/     /'
    else
        echo "   ✅ 后端日志无错误"
    fi
else
    echo "   ℹ️ 后端日志文件不存在"
fi

if [ -f "$LOG_DIR/frontend.log" ]; then
    if grep -i "error" "$LOG_DIR/frontend.log" | tail -5 > /dev/null; then
        echo "   ⚠️ 前端日志中发现错误:"
        grep -i "error" "$LOG_DIR/frontend.log" | tail -3 | sed 's/^/     /'
    else
        echo "   ✅ 前端日志无错误"
    fi
else
    echo "   ℹ️ 前端日志文件不存在"
fi

# 5. 系统资源
echo "5. 检查系统资源..."
MEMORY_USAGE=$(free -m 2>/dev/null | awk 'NR==2{printf "%.1f%%", $3*100/$2}' || echo "N/A")
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 2>/dev/null || echo "N/A")
DISK_USAGE=$(df -h . | awk 'NR==2{print $5}' 2>/dev/null || echo "N/A")

echo "   内存使用: $MEMORY_USAGE"
echo "   CPU 使用: $CPU_USAGE%"
echo "   磁盘使用: $DISK_USAGE"

# 6. 功能测试
echo "6. 功能测试..."
echo "   ℹ️ 请手动验证以下功能:"
echo "     - 3D 场景加载"
echo "     - 家长控制 (WASD)"
echo "     - 小车自动跟随"
echo "     - 避障功能"
echo "     - 路径规划"
echo "     - WebSocket 通信"

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "=== 健康检查通过 ✅ ==="
else
    echo "=== 健康检查发现问题 ❌ ==="
fi

exit $EXIT_CODE
