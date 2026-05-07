import { create } from 'zustand'
import type { SensorData, FusedEnvironmentData, Decision, VehicleState, TargetState, Obstacle } from '../types'

interface SensorStore {
  // 原始传感器数据
  rawData: SensorData | null
  
  // 融合后的数据
  fusedData: FusedEnvironmentData | null
  
  // 当前决策
  currentDecision: Decision | null
  
  // 车辆状态
  vehicleState: VehicleState
  
  // 目标状态
  targetState: TargetState
  
  // 障碍物列表
  obstacles: Obstacle[]
  
  // 连接状态
  isConnected: boolean
  
  // 系统状态
  systemStatus: string
  
  // 动作
  setRawData: (data: SensorData) => void
  setFusedData: (data: FusedEnvironmentData) => void
  setCurrentDecision: (decision: Decision) => void
  updateVehicleState: (state: Partial<VehicleState>) => void
  updateTargetState: (state: Partial<TargetState>) => void
  setObstacles: (obstacles: Obstacle[]) => void
  setConnected: (connected: boolean) => void
  setSystemStatus: (status: string) => void
}

export const useSensorStore = create<SensorStore>((set) => ({
  rawData: null,
  fusedData: null,
  currentDecision: null,
  vehicleState: {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    speed: 0,
    mode: 'STOP',
  },
  targetState: {
    position: [2, 0, 0],
    detected: false,
    confidence: 0,
  },
  obstacles: [],
  isConnected: false,
  systemStatus: '初始化中...',

  setRawData: (data) => set({ rawData: data }),
  
  setFusedData: (data) => set({ fusedData: data }),
  
  setCurrentDecision: (decision) => set({ currentDecision: decision }),
  
  updateVehicleState: (state) => set((prev) => ({
    vehicleState: { ...prev.vehicleState, ...state },
  })),
  
  updateTargetState: (state) => set((prev) => ({
    targetState: { ...prev.targetState, ...state },
  })),
  
  setObstacles: (obstacles) => set({ obstacles }),
  
  setConnected: (connected) => set({ isConnected: connected }),
  
  setSystemStatus: (status) => set({ systemStatus: status }),
}))
