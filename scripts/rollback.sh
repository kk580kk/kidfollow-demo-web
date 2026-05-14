#!/bin/bash
# 5/23 紧急回滚脚本

set -e

echo "=== KIDFOLLOW 紧急回滚 ==="

# 检查参数
if [ $# -eq 0 ]; then
    echo "用法: $0 <备份文件>"
    echo "示例: $0 /opt/backups/kidfollow-backup-20260515-040000.tar.gz"
    echo ""
    echo "可用备份:"
    ls -t /opt/backups/kidfollow-backup-*.tar.gz 2>/dev/null | head -10
    exit 1
fi

BACKUP_FILE="$1"
PROJECT_DIR="/Volumes/Serene 2T/Workspaces/github.com/kk580kk/kidfollow-demo-web"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ 备份文件不存在: $BACKUP_FILE"
    exit 1
fi

echo "回滚源: $BACKUP_FILE"
echo ""

# 1. 确认回滚
echo "⚠️ 警告: 即将执行回滚操作！"
echo "这将恢复到备份时的状态。"
read -p "确认回滚? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ 回滚已取消"
    exit 0
fi

# 2. 停止服务
echo "2. 停止当前服务..."
"$PROJECT_DIR/scripts/stop-production.sh" 2>/dev/null || true
sleep 3
echo "   ✅ 服务已停止"

# 3. 创建当前状态备份
echo "3. 创建当前状态备份..."
"$PROJECT_DIR/scripts/backup.sh" 2>/dev/null || echo "   ⚠️ 备份失败，继续回滚"

# 4. 解压备份
echo "4. 解压备份文件..."
RESTORE_DIR="/tmp/kidfollow-restore-$$"
mkdir -p "$RESTORE_DIR"
tar -xzf "$BACKUP_FILE" -C "$RESTORE_DIR"
BACKUP_NAME=$(ls "$RESTORE_DIR" | head -1)
echo "   ✅ 备份已解压到: $RESTORE_DIR/$BACKUP_NAME"

# 5. 恢复代码
echo "5. 恢复代码..."
if [ -d "$RESTORE_DIR/$BACKUP_NAME/source/kidfollow-demo-web" ]; then
    rm -rf "$PROJECT_DIR"
    cp -r "$RESTORE_DIR/$BACKUP_NAME/source/kidfollow-demo-web" "$PROJECT_DIR"
    echo "   ✅ 代码已恢复"
else
    echo "   ❌ 备份中未找到代码目录"
    rm -rf "$RESTORE_DIR"
    exit 1
fi

# 6. 启动服务
echo "6. 启动服务..."
"$PROJECT_DIR/scripts/start-production.sh"
echo "   ✅ 服务已启动"

# 7. 健康检查
echo "7. 健康检查..."
sleep 5
"$PROJECT_DIR/scripts/health-check.sh" || echo "   ⚠️ 健康检查发现问题，请手动检查"

# 8. 清理
echo "8. 清理临时文件..."
rm -rf "$RESTORE_DIR"
echo "   ✅ 清理完成"

echo ""
echo "=== 回滚完成 ==="
echo "系统已恢复到: $BACKUP_FILE"
echo "访问地址: http://192.168.71.9:5174/"
