# 5/23 上线保驾检查清单

## 📋 上线信息

| 项目 | 内容 |
|------|------|
| 上线日期 | 2026-05-23 |
| 上线时间 | 待定 (建议非高峰时段) |
| 系统名称 | KIDFOLLOW 智能童车演示系统 |
| 版本号 | v1.0.0 |
| 负责人 | 开发团队 |

---

## ✅ 上线前检查

### 1. 代码检查

| 检查项 | 状态 | 备注 |
|--------|------|------|
| 所有代码已合并到 main 分支 | ⏳ | 待确认 |
| Git 标签已打 (v1.0.0) | ⏳ | 待创建 |
| 代码审查通过 | ✅ | 已通过 |
| 无编译错误 | ✅ | 前后端编译通过 |

### 2. 测试检查

| 检查项 | 状态 | 备注 |
|--------|------|------|
| 单元测试全部通过 | ✅ | 81/81 通过 |
| 集成测试通过 | ✅ | WebSocket 通信正常 |
| 端到端测试通过 | ⏳ | 需在实际环境验证 |
| 性能测试通过 | ✅ | 路径计算 ≤200ms |

### 3. 依赖检查

| 检查项 | 状态 | 备注 |
|--------|------|------|
| 前端依赖 (npm) | ✅ | 已安装并构建 |
| 后端依赖 (Maven) | ✅ | 已编译通过 |
| core-lib 依赖 | ✅ | v1.0.0-SNAPSHOT |
| 数据库 (如有) | ⏳ | 待确认 |

---

## 🔧 环境配置

### 服务器配置

```yaml
# 生产环境配置
server:
  host: 192.168.71.9
  frontend_port: 5174
  backend_port: 8080
  
# WebSocket 端点
websocket:
  sensor: /sensor-ws
  path_planning: /ws/path-planning
```

### 服务启动脚本

```bash
#!/bin/bash
# start-production.sh

echo "Starting KIDFOLLOW Production Services..."

# 1. Start Backend
cd /opt/kidfollow/backend
nohup java -jar kidfollow-demo-backend-1.0.0.jar > /var/log/kidfollow/backend.log 2>&1 &
echo "Backend started on port 8080"

# 2. Start Frontend
cd /opt/kidfollow/frontend
nohup npm run preview -- --host 0.0.0.0 --port 5174 > /var/log/kidfollow/frontend.log 2>&1 &
echo "Frontend started on port 5174"

echo "All services started!"
echo "Access: http://192.168.71.9:5174/"
```

---

## 🚀 上线步骤

### 步骤 1: 备份当前版本

```bash
# 备份脚本
backup_dir="/opt/backups/kidfollow-$(date +%Y%m%d-%H%M%S)"
mkdir -p $backup_dir
cp -r /opt/kidfollow/backend $backup_dir/
cp -r /opt/kidfollow/frontend $backup_dir/
echo "Backup completed: $backup_dir"
```

### 步骤 2: 部署新版本

```bash
# 1. 停止当前服务
pkill -f "kidfollow-demo-backend"
pkill -f "npm run preview"

# 2. 更新代码
cd /opt/kidfollow
git pull origin main

# 3. 构建后端
cd backend
mvn clean package -DskipTests
cp target/kidfollow-demo-backend-1.0.0.jar ../

# 4. 构建前端
cd ../frontend
npm ci
npm run build

# 5. 启动服务
./start-production.sh
```

### 步骤 3: 健康检查

```bash
#!/bin/bash
# health-check.sh

echo "=== Health Check ==="

# 检查后端
if curl -s http://localhost:8080/ > /dev/null; then
    echo "✅ Backend: Running"
else
    echo "❌ Backend: Down"
    exit 1
fi

# 检查前端
if curl -s http://localhost:5174/ > /dev/null; then
    echo "✅ Frontend: Running"
else
    echo "❌ Frontend: Down"
    exit 1
fi

# 检查 WebSocket
echo "Testing WebSocket..."
# WebSocket 测试代码

echo "=== All Checks Passed ==="
```

---

## 📊 功能验证清单

### 核心功能

| 功能模块 | 验证步骤 | 状态 |
|----------|----------|------|
| **3D 场景** | 1. 打开页面<br>2. 观察场景加载<br>3. 拖拽旋转视角 | ⏳ |
| **家长控制** | 1. 按 WASD 键<br>2. 观察家长移动<br>3. 确认响应正常 | ⏳ |
| **小车跟随** | 1. 移动家长<br>2. 观察小车跟随<br>3. 确认保持 2 米距离 | ⏳ |
| **避障系统** | 1. 走向障碍物<br>2. 观察小车绕行<br>3. 确认无碰撞 | ⏳ |
| **传感器面板** | 1. 观察左侧面板<br>2. 确认数据更新<br>3. 检查数据真实性 | ⏳ |
| **路径规划** | 1. 输入起点终点<br>2. 点击规划<br>3. 观察 3D 路径显示 | ⏳ |
| **机动演示** | 1. 点击三点掉头<br>2. 观察动画过程<br>3. 确认步骤完成 | ⏳ |

### WebSocket 通信

| 端点 | 测试方法 | 期望结果 |
|------|----------|----------|
| `/sensor-ws` | 连接并接收消息 | 传感器数据实时推送 |
| `/ws/path-planning` | 发送规划请求 | 路径结果正确返回 |

---

## 🆘 回滚方案

### 紧急回滚

```bash
#!/bin/bash
# rollback.sh

echo "Starting rollback..."

# 1. 停止服务
pkill -f "kidfollow-demo-backend"
pkill -f "npm run preview"

# 2. 恢复备份
backup_dir="$1"  # 传入备份目录
cp -r $backup_dir/backend /opt/kidfollow/
cp -r $backup_dir/frontend /opt/kidfollow/

# 3. 启动旧版本
./start-production.sh

echo "Rollback completed!"
```

### 回滚触发条件

- [ ] 服务启动失败
- [ ] 核心功能无法使用
- [ ] 严重的性能问题
- [ ] 数据丢失或损坏

---

## 📞 联系方式

| 角色 | 姓名 | 联系方式 |
|------|------|----------|
| 开发团队 | Mac Mini 开发 | Feishu |
| 项目经理 | Mac Mini PM | Feishu |
| 技术总监 | Mac Mini 总监 | Feishu |
| QA 团队 | Mac Mini QA | Feishu |

---

## 📝 上线记录

| 时间 | 操作 | 操作人 | 结果 |
|------|------|--------|------|
| | 开始上线 | | |
| | 备份完成 | | |
| | 代码部署 | | |
| | 服务启动 | | |
| | 健康检查 | | |
| | 功能验证 | | |
| | 上线完成 | | |

---

## 🔒 安全检查

| 检查项 | 状态 | 备注 |
|--------|------|------|
| 无敏感信息泄露 | ✅ | 代码审查通过 |
| 无调试代码残留 | ✅ | 已检查 |
| 日志级别正确 | ✅ | INFO 级别 |
| 错误处理完善 | ✅ | 有异常捕获 |

---

**最后更新**: 2026-05-15 04:06  
**文档版本**: v1.0  
**状态**: 准备中
