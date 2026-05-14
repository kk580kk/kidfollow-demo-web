#!/bin/bash
# 5/23 上线前备份脚本

set -e

echo "=== KIDFOLLOW 上线前备份 ==="

# 配置
BACKUP_ROOT="/opt/backups"
PROJECT_DIR="/Volumes/Serene 2T/Workspaces/github.com/kk580kk"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/kidfollow-backup-$TIMESTAMP"

echo "备份目录: $BACKUP_DIR"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 1. 备份代码
echo "1. 备份代码..."
mkdir -p "$BACKUP_DIR/source"
cp -r "$PROJECT_DIR/kidfollow-core-lib" "$BACKUP_DIR/source/"
cp -r "$PROJECT_DIR/kidfollow-demo-web" "$BACKUP_DIR/source/"
echo "   ✅ 代码备份完成"

# 2. 备份配置
echo "2. 备份配置..."
mkdir -p "$BACKUP_DIR/config"
if [ -f "$PROJECT_DIR/kidfollow-demo-web/backend/src/main/resources/application.yml" ]; then
    cp "$PROJECT_DIR/kidfollow-demo-web/backend/src/main/resources/application.yml" "$BACKUP_DIR/config/"
fi
if [ -f "$PROJECT_DIR/kidfollow-demo-web/backend/src/main/resources/application.properties" ]; then
    cp "$PROJECT_DIR/kidfollow-demo-web/backend/src/main/resources/application.properties" "$BACKUP_DIR/config/"
fi
echo "   ✅ 配置备份完成"

# 3. 备份数据库 (如果有)
echo "3. 检查数据库..."
# 如果有数据库，添加备份命令
# mysqldump -u user -p database > "$BACKUP_DIR/database.sql"
echo "   ℹ️ 无数据库需要备份"

# 4. 生成备份清单
echo "4. 生成备份清单..."
cat > "$BACKUP_DIR/backup-manifest.txt" << EOF
备份时间: $(date '+%Y-%m-%d %H:%M:%S')
备份内容:
- kidfollow-core-lib: 路径规划核心库
- kidfollow-demo-web: 演示系统前后端代码
- 配置文件 (如有)

Git 版本:
EOF

cd "$PROJECT_DIR/kidfollow-demo-web" && git log --oneline -5 >> "$BACKUP_DIR/backup-manifest.txt"
cd "$PROJECT_DIR/kidfollow-core-lib" && git log --oneline -5 >> "$BACKUP_DIR/backup-manifest.txt"

echo "   ✅ 备份清单生成完成"

# 5. 打包备份
echo "5. 打包备份..."
cd "$BACKUP_ROOT"
tar -czf "kidfollow-backup-$TIMESTAMP.tar.gz" "kidfollow-backup-$TIMESTAMP"
rm -rf "$BACKUP_DIR"
echo "   ✅ 备份打包完成: kidfollow-backup-$TIMESTAMP.tar.gz"

# 6. 清理旧备份 (保留最近10个)
echo "6. 清理旧备份..."
cd "$BACKUP_ROOT"
ls -t kidfollow-backup-*.tar.gz | tail -n +11 | xargs -r rm
echo "   ✅ 旧备份清理完成"

echo ""
echo "=== 备份完成 ==="
echo "备份文件: $BACKUP_ROOT/kidfollow-backup-$TIMESTAMP.tar.gz"
echo "备份大小: $(du -h "$BACKUP_ROOT/kidfollow-backup-$TIMESTAMP.tar.gz" | cut -f1)"
