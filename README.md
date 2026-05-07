# KidFollow Demo Web

童车跟随系统 Web 演示工程

## 技术栈

- React 18 + TypeScript 5 + Vite 5
- Three.js + @react-three/fiber (3D 可视化)
- Zustand (状态管理)
- WebSocket (实时通信)

## 快速启动

### 1. 进入项目目录

```bash
cd /Volumes/Serene\ 2T/Workspaces/github.com/kk580kk/kidfollow-demo-web
```

### 2. 安装依赖（首次启动）

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

- 服务地址：http://localhost:5173
- 自动热重载，支持实时预览

### 4. 构建生产版本

```bash
npm run build
```

- 输出目录：`dist/`
- 可直接部署到静态服务器

## 项目结构

```
kidfollow-demo-web/
├── src/
│   ├── components/          # React 组件
│   │   ├── Scene3D.tsx      # Three.js 3D 场景
│   │   ├── SensorPanel.tsx  # 传感器数据面板
│   │   ├── ControlPanel.tsx # 控制面板
│   │   ├── StatusBar.tsx    # 状态栏
│   │   └── WebSocketProvider.tsx  # WebSocket 通信
│   ├── stores/
│   │   └── sensorStore.ts   # Zustand 状态管理
│   ├── types/
│   │   └── index.ts         # TypeScript 类型定义
│   ├── App.tsx              # 主应用入口
│   ├── main.tsx             # React 渲染入口
│   ├── App.css              # 应用样式
│   └── index.css            # 全局样式
├── public/                  # 静态资源
├── index.html               # HTML 模板
├── package.json             # 项目依赖
├── tsconfig.json            # TypeScript 配置
└── vite.config.ts           # Vite 配置
```

## 功能特性

- **3D 可视化场景**：车辆、目标儿童、障碍物实时渲染
- **传感器数据面板**：激光雷达、超声波、视觉数据实时显示
- **控制面板**：跟随 / 避障 / 返航 / 紧急制动 四种模式
- **状态监控**：实时系统状态和决策信息
- **WebSocket 通信**：实时数据流（当前为模拟数据）

## 浏览器支持

- Chrome（推荐）
- Edge
- Firefox
- Safari

## 依赖核心库

- [kidfollow-core-lib](https://github.com/kk580kk/kidfollow-core-lib) - Java 核心算法库

## GitHub 仓库

https://github.com/kk580kk/kidfollow-demo-web

## 开发团队

Mac Mini 开发团队
