// 传感器数据类型
export interface SensorData {
  timestamp: number
  battery: number
  gps: {
    lat: number
    lng: number
  }
  laserScan: LaserScanData
  ultrasonicRadar: UltrasonicRadarData
  visualTarget: VisualTarget | null
  childPresent: boolean
  fenceStatus: 'SAFE' | 'WARNING' | 'ALARM'
}

export interface LaserScanData {
  ranges: number[]
  angles: number[]
  obstacleDetected: boolean
  groundHoleDetected: boolean
}

export interface UltrasonicRadarData {
  frontLeft: number
  frontRight: number
  frontTop: number
  frontBottom: number
  rearLeft: number
  rearRight: number
  rearTop: number
  rearBottom: number
}

export interface VisualTarget {
  type: 'child' | 'adult' | 'obstacle'
  confidence: number
  position: {
    x: number
    y: number
  }
}

// 融合后的环境数据
export interface FusedEnvironmentData {
  nearestObstacleDistance: number
  nearestObstacleAngle: number
  obstacleInFront: boolean
  groundHoleDetected: boolean
  frontUltrasonicMin: number
  rearUltrasonicMin: number
  frontCollisionRisk: boolean
  rearCollisionRisk: boolean
  childDetected: boolean
  childDistance: number
  childAngle: number
  childConfidence: number
  batteryLevel: number
  fenceStatus: 'SAFE' | 'WARNING' | 'ALARM'
}

// 决策类型
export type DecisionType = 'FOLLOW' | 'AVOID' | 'ANCHOR' | 'RETURN' | 'STOP'

// 决策结果
export interface Decision {
  type: DecisionType
  speed: number
  angle: number
  reason: string
  timestamp: number
}

// 控制命令
export interface ControlCommand {
  type: DecisionType
  speed: number
  angle: number
}

// WebSocket消息类型
export interface WebSocketMessage {
  type: 'sensor' | 'decision' | 'control' | 'status'
  data: any
}

// 车辆状态
export interface VehicleState {
  position: [number, number, number]
  rotation: [number, number, number]
  speed: number
  mode: DecisionType
}

// 目标（儿童）状态
export interface TargetState {
  position: [number, number, number]
  detected: boolean
  confidence: number
}

// 障碍物
export interface Obstacle {
  id: string
  position: [number, number, number]
  distance: number
  angle: number
}
