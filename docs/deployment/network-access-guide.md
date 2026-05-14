# QA 网络访问指南

## 📋 概述

本文档说明如何让 QA 团队访问内网演示系统 (192.168.71.9:5174)。

---

## 🌐 方案一：Nginx 反向代理（推荐）

### 配置步骤

```bash
# 1. 安装 Nginx
sudo apt-get update
sudo apt-get install nginx

# 2. 创建配置文件
sudo tee /etc/nginx/conf.d/kidfollow-qa.conf << 'EOF'
server {
    listen 80;
    server_name qa-demo.kidfollow.local;
    
    # 前端代理
    location / {
        proxy_pass http://192.168.71.9:5174;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket 支持
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
    
    # 后端 API 代理
    location /api/ {
        proxy_pass http://192.168.71.9:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # WebSocket 端点
    location /sensor-ws {
        proxy_pass http://192.168.71.9:8080/sensor-ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
    
    location /ws/path-planning {
        proxy_pass http://192.168.71.9:8080/ws/path-planning;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
EOF

# 3. 测试配置
sudo nginx -t

# 4. 重启 Nginx
sudo systemctl restart nginx

# 5. 检查状态
sudo systemctl status nginx
```

### QA 访问方式

```
# 方式1：通过域名 (需配置 DNS 或 hosts)
http://qa-demo.kidfollow.local

# 方式2：通过 IP (如果 QA 机器可以访问 Nginx 服务器)
http://[Nginx服务器IP]:80
```

### Hosts 配置（QA 本地）

```bash
# QA 机器添加 hosts 记录
sudo tee -a /etc/hosts << 'EOF'
192.168.71.9 qa-demo.kidfollow.local
EOF
```

---

## 🌐 方案二：端口转发（备选）

### SSH 端口转发

```bash
# QA 机器执行 SSH 端口转发
ssh -L 5174:192.168.71.9:5174 -L 8080:192.168.71.9:8080 user@跳板机

# 然后 QA 访问本地端口
http://localhost:5174
```

### iptables 端口转发

```bash
# 在可访问内网的服务器上配置
sudo iptables -t nat -A PREROUTING -p tcp --dport 5174 -j DNAT --to-destination 192.168.71.9:5174
sudo iptables -t nat -A POSTROUTING -p tcp --dport 5174 -j MASQUERADE
sudo iptables-save
```

---

## 🌐 方案三：VPN 访问（最安全）

### 配置 OpenVPN

```bash
# 1. 安装 OpenVPN
sudo apt-get install openvpn easy-rsa

# 2. 配置 VPN 服务器
# 参考 OpenVPN 官方文档

# 3. 生成客户端证书
./easyrsa build-client-full qa-client nopass

# 4. 分发证书给 QA 团队
```

---

## 🔧 验证步骤

### 1. 检查服务状态

```bash
# 检查 Nginx
curl -I http://qa-demo.kidfollow.local

# 检查端口
curl -I http://192.168.71.9:5174
```

### 2. WebSocket 测试

```javascript
// 浏览器控制台测试
const ws = new WebSocket('ws://qa-demo.kidfollow.local/sensor-ws');
ws.onopen = () => console.log('✅ WebSocket 连接成功');
ws.onerror = (e) => console.log('❌ WebSocket 连接失败', e);
```

### 3. 功能验证清单

| 功能 | 验证方法 | 期望结果 |
|------|----------|----------|
| 3D 场景加载 | 访问页面 | 场景正常显示 |
| 家长控制 | 按 WASD | 家长移动正常 |
| 小车跟随 | 移动家长 | 小车跟随正常 |
| 避障功能 | 走向障碍物 | 小车绕行正常 |
| 路径规划 | 输入坐标点击规划 | 显示绿色路径 |
| 机动演示 | 点击三点掉头 | 动画播放正常 |
| WebSocket | 查看传感器数据 | 数据实时更新 |

---

## 📝 QA 访问凭证

```yaml
# 内网直接访问
direct:
  frontend: http://192.168.71.9:5174
  backend: http://192.168.71.9:8080
  websocket_sensor: ws://192.168.71.9:8080/sensor-ws
  websocket_path: ws://192.168.71.9:8080/ws/path-planning

# 通过 Nginx 代理访问
nginx:
  frontend: http://qa-demo.kidfollow.local
  backend: http://qa-demo.kidfollow.local/api
  websocket_sensor: ws://qa-demo.kidfollow.local/sensor-ws
  websocket_path: ws://qa-demo.kidfollow.local/ws/path-planning
```

---

## 🆘 故障排查

### 问题1：无法访问页面

```bash
# 检查服务是否运行
curl http://192.168.71.9:5174

# 检查 Nginx 配置
sudo nginx -t

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/error.log
```

### 问题2：WebSocket 连接失败

```bash
# 检查 WebSocket 端点
curl -I http://192.168.71.9:8080/sensor-ws

# 检查 Nginx WebSocket 配置
grep -A 5 "upgrade" /etc/nginx/conf.d/kidfollow-qa.conf
```

### 问题3：路径规划无响应

```bash
# 检查后端日志
tail -f /var/log/kidfollow/backend.log

# 检查 core-lib 是否正常
java -jar kidfollow-demo-backend-1.0.0.jar --dry-run
```

---

## 📞 联系方式

| 角色 | 职责 | 联系方式 |
|------|------|----------|
| 开发团队 | 技术支持 | Feishu @Mac Mini 开发团队 |
| 运维 | 网络配置 | Feishu @Mac Mini 运维 |

---

**最后更新**: 2026-05-15 04:13
**版本**: v1.0
**状态**: 已配置
