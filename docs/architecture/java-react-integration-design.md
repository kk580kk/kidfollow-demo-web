# Java-React 集成架构设计方案

## 1. 架构概述
- **目标**: 单一交付产物 (kidfollow-demo-web)
- **核心**: React 前端 + Spring Boot 后端 + kidfollow-core-lib 算法库
- **通信**: WebSocket 实时数据流

## 2. 目录结构
```
kidfollow-demo-web/
├── backend/                    # Spring Boot 后端服务
│   ├── src/main/java/com/kidfollow/demo/
│   │   ├── controller/        # WebSocket 控制器
│   │   ├── service/           # 核心业务服务
│   │   └── KidFollowDemoApplication.java
│   └── pom.xml               # Maven 依赖配置
├── frontend/                   # React 前端应用
│   ├── src/
│   │   ├── components/       # 3D 可视化组件
│   │   ├── services/         # WebSocket 通信服务
│   │   └── App.tsx
│   └── package.json
├── docs/architecture/         # 架构文档
└── README.md
```

## 3. 技术栈
- **后端**: Spring Boot 3.x + WebSocket
- **前端**: React 18 + TypeScript 5 + Three.js
- **核心库**: kidfollow-core-lib (Java Library)
- **构建**: Maven + Vite

## 4. 集成方案

### 4.1 后端依赖配置 (pom.xml)
```xml
<dependencies>
    <!-- 核心算法库 -->
    <dependency>
        <groupId>com.kidfollow</groupId>
        <artifactId>kidfollow-core-lib</artifactId>
        <version>1.0.0</version>
    </dependency>
    
    <!-- Spring Boot Web & WebSocket -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-websocket</artifactId>
    </dependency>
</dependencies>
```

### 4.2 WebSocket 通信接口
- **连接地址**: ws://localhost:8080/sensor-ws
- **数据格式**: JSON
- **延迟要求**: <100ms

### 4.3 构建部署
- **开发模式**: 后端 8080 端口 + 前端 proxy
- **生产模式**: 单 JAR 包 (内嵌前端资源)

## 5. 实施计划
1. **立即**: 创建 backend 目录结构
2. **2小时内**: 完成 Spring Boot 基础配置
3. **4小时内**: 实现 WebSocket 通信
4. **8小时内**: 集成 kidfollow-core-lib
5. **24小时内**: 完整功能测试

## 6. 验收标准
- ✅ 单一 Git 仓库 (kidfollow-demo-web)
- ✅ WebSocket 实时通信正常
- ✅ 3D 可视化完整显示
- ✅ BUILD SUCCESS
- ✅ 所有控制功能正常工作