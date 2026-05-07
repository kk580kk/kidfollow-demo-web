import { useEffect, useRef, useCallback } from 'react'
import { useSensorStore } from '../stores/sensorStore'
import type { SensorData, FusedEnvironmentData, Decision, WebSocketMessage } from '../types'

interface WebSocketProviderProps {
  children: React.ReactNode
  onConnectionChange?: (connected: boolean) => void
}

// 模拟数据生成器（用于演示）
const generateMockSensorData = (): SensorData => {
  const now = Date.now()
  const baseDistance = 2.0 + Math.sin(now / 1000) * 0.5
  
  return {
    timestamp: now,
    battery: 85,
    gps: { lat: 39.9042, lng: 116.4074 },
    laserScan: {
      ranges: [baseDistance, 3.5, 5.0, 8.0],
      angles: [0, -30, 30, -60],
      obstacleDetected: baseDistance < 3.0,
      groundHoleDetected: false,
    },
    ultrasonicRadar: {
      frontLeft: 25 + Math.random() * 5,
      frontRight: 30 + Math.random() * 5,
      frontTop: 20 + Math.random() * 5,
      frontBottom: 18 + Math.random() * 5,
      rearLeft: 45 + Math.random() * 5,
      rearRight: 40 + Math.random() * 5,
      rearTop: 35 + Math.random() * 5,
      rearBottom: 38 + Math.random() * 5,
    },
    visualTarget: {
      type: 'child',
      confidence: 0.92 + Math.random() * 0.08,
      position: { x: Math.sin(now / 2000) * 0.5, y: baseDistance },
    },
    childPresent: true,
    fenceStatus: 'SAFE',
  }
}

const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ 
  children, 
  onConnectionChange 
}) => {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const { 
    setRawData, 
    setFusedData, 
    setCurrentDecision,
    updateVehicleState,
    updateTargetState,
    setConnected,
    setSystemStatus,
  } = useSensorStore()

  // 连接WebSocket
  const connect = useCallback(() => {
    // 尝试连接真实的WebSocket服务器
    // const ws = new WebSocket('ws://localhost:8080/ws')
    
    // 模拟WebSocket连接（用于演示）
    setConnected(true)
    setSystemStatus('系统运行中')
    onConnectionChange?.(true)
    
    // 模拟数据接收
    const interval = setInterval(() => {
      const sensorData = generateMockSensorData()
      setRawData(sensorData)
      
      // 模拟融合数据
      const fusedData: FusedEnvironmentData = {
        nearestObstacleDistance: sensorData.laserScan.ranges[0],
        nearestObstacleAngle: sensorData.laserScan.angles[0],
        obstacleInFront: sensorData.laserScan.obstacleDetected,
        groundHoleDetected: false,
        frontUltrasonicMin: Math.min(
          sensorData.ultrasonicRadar.frontLeft,
          sensorData.ultrasonicRadar.frontRight,
          sensorData.ultrasonicRadar.frontTop,
          sensorData.ultrasonicRadar.frontBottom
        ),
        rearUltrasonicMin: 40,
        frontCollisionRisk: sensorData.laserScan.ranges[0] < 1.0,
        rearCollisionRisk: false,
        childDetected: sensorData.visualTarget !== null,
        childDistance: sensorData.visualTarget?.position.y || 0,
        childAngle: Math.atan2(
          sensorData.visualTarget?.position.x || 0,
          sensorData.visualTarget?.position.y || 1
        ) * 180 / Math.PI,
        childConfidence: sensorData.visualTarget?.confidence || 0,
        batteryLevel: sensorData.battery,
        fenceStatus: sensorData.fenceStatus,
      }
      setFusedData(fusedData)
      
      // 更新车辆和目标状态
      updateVehicleState({
        position: [0, 0, 0],
        speed: sensorData.visualTarget ? 3 : 0,
        mode: sensorData.laserScan.obstacleDetected ? 'AVOID' : 'FOLLOW',
      })
      
      if (sensorData.visualTarget) {
        updateTargetState({
          position: [
            sensorData.visualTarget.position.x,
            0,
            sensorData.visualTarget.position.y,
          ],
          detected: true,
          confidence: sensorData.visualTarget.confidence,
        })
      }
    }, 100)

    return () => {
      clearInterval(interval)
      setConnected(false)
      setSystemStatus('连接断开')
      onConnectionChange?.(false)
    }
  }, [setRawData, setFusedData, setCurrentDecision, updateVehicleState, updateTargetState, setConnected, setSystemStatus, onConnectionChange])

  useEffect(() => {
    const cleanup = connect()
    return () => cleanup?.()
  }, [connect])

  return <>{children}</>
}

export default WebSocketProvider
