# KidFollow Demo Web

童车跟随系统 Web 演示工程

**架构**: React 前端 + Spring Boot 后端 + Java 核心库

## 技术栈

- **前端**: React 18 + TypeScript 5 + Vite 5 + Three.js
- **后端**: Spring Boot 3.x + WebSocket
- **核心库**: kidfollow-core-lib (Java)

## 项目结构

```
kidfollow-demo-web/
├── backend/              # Spring Boot 后端
│   ├── src/main/java/    # Java 源代码
│   └── pom.xml          # Maven 配置
├── frontend/             # React 前端
│   ├── src/             # TypeScript 源代码
│   └── package.json     # npm 配置
└── docs/architecture/    # 架构文档
```

## 快速启动

### 1. 启动后端服务

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

- 服务地址：http://localhost:8080
- WebSocket：ws://localhost:8080/sensor-ws

### 2. 启动前端应用

```bash
cd frontend
npm install
npm run dev
```

- 访问地址：http://localhost:5173
- 自动热重载，支持实时预览

### 3. 构建生产版本

**后端**:
```bash
cd backend
mvn clean package
# 生成 target/kidfollow-demo-backend-1.0.0.jar
```

**前端**:
```bash
cd frontend
npm run build
# 生成 dist/ 目录
```

## 功能特性

- **3D 可视化场景**：车辆、目标儿童、障碍物实时渲染
- **传感器数据面板**：激光雷达、超声波、视觉数据实时显示
- **控制面板**：跟随 / 避障 / 返航 / 紧急制动 四种模式
- **状态监控**：实时系统状态和决策信息
- **WebSocket 通信**：实时数据流，延迟 <100ms

## 浏览器支持

- Chrome（推荐）
- Edge
- Firefox
- Safari

## 依赖核心库

- [kidfollow-core-lib](https://github.com/kk580kk/kidfollow-core-lib) - Java 核心算法库

## 架构设计

详见 [docs/architecture/java-react-integration-design.md](docs/architecture/java-react-integration-design.md)

## GitHub 仓库

https://github.com/kk580kk/kidfollow-demo-web

## 开发团队

Mac Mini 开发团队
