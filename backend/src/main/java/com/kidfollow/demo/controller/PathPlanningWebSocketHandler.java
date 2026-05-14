package com.kidfollow.demo.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kidfollow.pathplanning.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.*;

/**
 * 路径规划 WebSocket 控制器
 * 向前端推送路径规划过程和结果
 */
@Controller
public class PathPlanningWebSocketHandler extends TextWebSocketHandler {

    private final PathPlanner pathPlanner;
    private final ObjectMapper objectMapper;
    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

    @Autowired
    public PathPlanningWebSocketHandler() {
        this.pathPlanner = new PathPlanner();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.add(session);
        System.out.println("[PathPlanning] 客户端连接: " + session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessions.remove(session);
        System.out.println("[PathPlanning] 客户端断开: " + session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        System.out.println("[PathPlanning] 收到消息: " + payload);

        try {
            PathPlanningRequest request = objectMapper.readValue(payload, PathPlanningRequest.class);
            
            switch (request.getType()) {
                case "PLAN_PATH":
                    handlePlanPath(request, session);
                    break;
                case "DEMO_MANEUVER":
                    handleDemoManeuver(request, session);
                    break;
                case "GET_GRID_MAP":
                    handleGetGridMap(session);
                    break;
                default:
                    sendError(session, "未知请求类型: " + request.getType());
            }
        } catch (Exception e) {
            System.err.println("[PathPlanning] 处理消息失败: " + e.getMessage());
            sendError(session, "处理失败: " + e.getMessage());
        }
    }

    /**
     * 处理路径规划请求
     */
    private void handlePlanPath(PathPlanningRequest request, WebSocketSession session) throws Exception {
        GridMap map = createDemoMap();
        Point2D start = new Point2D(request.getStartX(), request.getStartY());
        Point2D goal = new Point2D(request.getGoalX(), request.getGoalY());

        // 发送规划开始事件
        sendEvent(session, "PLANNING_STARTED", Map.of(
            "start", Map.of("x", start.getX(), "y", start.getY()),
            "goal", Map.of("x", goal.getX(), "y", goal.getY())
        ));

        // 执行路径规划
        List<Point2D> path = pathPlanner.calculatePath(start, goal, map);

        if (path.isEmpty()) {
            sendEvent(session, "PLANNING_FAILED", Map.of("reason", "无法找到路径"));
            return;
        }

        // 发送路径结果
        List<Map<String, Double>> pathPoints = new ArrayList<>();
        for (Point2D point : path) {
            pathPoints.add(Map.of("x", point.getX(), "y", point.getY()));
        }

        sendEvent(session, "PLANNING_COMPLETED", Map.of(
            "path", pathPoints,
            "pathLength", calculatePathLength(path),
            "waypointCount", path.size()
        ));
    }

    /**
     * 处理复杂机动演示请求
     */
    private void handleDemoManeuver(PathPlanningRequest request, WebSocketSession session) throws Exception {
        String maneuverType = request.getManeuverType();
        
        sendEvent(session, "MANEUVER_STARTED", Map.of(
            "type", maneuverType,
            "description", getManeuverDescription(maneuverType)
        ));

        // 模拟机动过程
        List<Map<String, Object>> steps = generateManeuverSteps(maneuverType);
        
        for (int i = 0; i < steps.size(); i++) {
            Map<String, Object> step = steps.get(i);
            step.put("stepIndex", i + 1);
            step.put("totalSteps", steps.size());
            
            sendEvent(session, "MANEUVER_STEP", step);
            Thread.sleep(1000); // 每秒一步
        }

        sendEvent(session, "MANEUVER_COMPLETED", Map.of(
            "type", maneuverType,
            "success", true
        ));
    }

    /**
     * 获取栅格地图
     */
    private void handleGetGridMap(WebSocketSession session) throws Exception {
        GridMap map = createDemoMap();
        int[][] grid = map.getGridCopy();
        
        List<List<Integer>> gridData = new ArrayList<>();
        for (int[] row : grid) {
            gridData.add(Arrays.asList(Arrays.stream(row).boxed().toArray(Integer[]::new)));
        }

        sendEvent(session, "GRID_MAP", Map.of(
            "size", GridMap.GRID_SIZE,
            "resolution", GridMap.RESOLUTION,
            "grid", gridData
        ));
    }

    /**
     * 创建演示地图
     */
    private GridMap createDemoMap() {
        GridMap map = new GridMap();
        
        // 初始化地图为自由空间
        for (int i = 0; i < GridMap.GRID_SIZE; i++) {
            for (int j = 0; j < GridMap.GRID_SIZE; j++) {
                map.setCellState(i, j, GridMap.CELL_FREE);
            }
        }

        // 添加一些障碍物
        Random random = new Random(42);
        for (int i = 0; i < 50; i++) {
            int x = random.nextInt(60) + 20; // 20-80
            int y = random.nextInt(60) + 20;
            map.setCellState(x, y, GridMap.CELL_OBSTACLE);
        }

        return map;
    }

    /**
     * 生成机动步骤
     */
    private List<Map<String, Object>> generateManeuverSteps(String maneuverType) {
        List<Map<String, Object>> steps = new ArrayList<>();
        
        switch (maneuverType) {
            case "THREE_POINT_TURN":
                steps.add(Map.of("action", "前进", "steering", -45, "speed", 50, "duration", 2));
                steps.add(Map.of("action", "后退", "steering", 45, "speed", -50, "duration", 2));
                steps.add(Map.of("action", "前进", "steering", 0, "speed", 50, "duration", 1));
                break;
            case "PARALLEL_PARK":
                steps.add(Map.of("action", "后退", "steering", -60, "speed", -40, "duration", 1.5));
                steps.add(Map.of("action", "前进", "steering", 60, "speed", 40, "duration", 1.5));
                steps.add(Map.of("action", "后退", "steering", -30, "speed", -30, "duration", 1));
                steps.add(Map.of("action", "前进", "steering", 30, "speed", 30, "duration", 1));
                break;
            case "U_TURN":
                steps.add(Map.of("action", "前进", "steering", -90, "speed", 60, "duration", 3));
                steps.add(Map.of("action", "前进", "steering", 0, "speed", 60, "duration", 0.5));
                break;
            default:
                steps.add(Map.of("action", "前进", "steering", 0, "speed", 50, "duration", 2));
        }
        
        return steps;
    }

    /**
     * 获取机动描述
     */
    private String getManeuverDescription(String maneuverType) {
        switch (maneuverType) {
            case "THREE_POINT_TURN":
                return "三点掉头：前进→后退→前进";
            case "PARALLEL_PARK":
                return "平行泊车：多次前进后退调整";
            case "U_TURN":
                return "U型转弯：前进同时最大转向";
            default:
                return "未知机动";
        }
    }

    /**
     * 计算路径长度
     */
    private double calculatePathLength(List<Point2D> path) {
        double length = 0;
        for (int i = 0; i < path.size() - 1; i++) {
            length += path.get(i).distanceTo(path.get(i + 1));
        }
        return length;
    }

    /**
     * 发送事件
     */
    private void sendEvent(WebSocketSession session, String eventType, Object data) throws IOException {
        Map<String, Object> event = new HashMap<>();
        event.put("type", eventType);
        event.put("timestamp", System.currentTimeMillis());
        event.put("data", data);
        
        String json = objectMapper.writeValueAsString(event);
        session.sendMessage(new TextMessage(json));
    }

    /**
     * 发送错误
     */
    private void sendError(WebSocketSession session, String message) throws IOException {
        sendEvent(session, "ERROR", Map.of("message", message));
    }

    /**
     * 请求类
     */
    public static class PathPlanningRequest {
        private String type;
        private double startX;
        private double startY;
        private double goalX;
        private double goalY;
        private String maneuverType;

        // Getters and setters
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public double getStartX() { return startX; }
        public void setStartX(double startX) { this.startX = startX; }
        public double getStartY() { return startY; }
        public void setStartY(double startY) { this.startY = startY; }
        public double getGoalX() { return goalX; }
        public void setGoalX(double goalX) { this.goalX = goalX; }
        public double getGoalY() { return goalY; }
        public void setGoalY(double goalY) { this.goalY = goalY; }
        public String getManeuverType() { return maneuverType; }
        public void setManeuverType(String maneuverType) { this.maneuverType = maneuverType; }
    }
}
