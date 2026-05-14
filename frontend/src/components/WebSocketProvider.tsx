import { useEffect, useCallback, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import { useSensorStore } from '../stores/sensorStore'
import { websocketService } from '../services/websocketService'
import { sceneSyncService } from '../services/sceneSyncService'
import type { FusedEnvironmentData } from '../types'

interface WebSocketProviderProps {
  children: React.ReactNode
  onConnectionChange?: (connected: boolean) => void
}

const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ 
  children, 
  onConnectionChange 
}) => {
  const { 
    setRawData, 
    setFusedData, 
    setCurrentDecision,
    updateVehicleState,
    updateTargetState,
    setConnected,
    setSystemStatus,
    addBackendDecisionLog,
    setNearestObstacleType,
    vehicleState,
    targetState,
    obstacles,
  } = useSensorStore()
  
  const clientRef = useRef<Client | null>(null)
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)
  const sceneSyncIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // 连接WebSocket
  const connect = useCallback(() => {
    console.log('正在连接WebSocket...')
    
    const client = new Client({
      brokerURL: 'ws://192.168.71.9:8080/sensor-ws',
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('WebSocket已连接')
        setConnected(true)
        setSystemStatus('系统运行中')
        onConnectionChange?.(true)
        
        // 订阅传感器数据
        client.subscribe('/topic/sensor', (message) => {
          try {
            const data = JSON.parse(message.body)
            if (data.sensorData) {
              setRawData(data.sensorData)
              
              // 更新融合数据
              const fusedData: FusedEnvironmentData = {
                nearestObstacleDistance: data.sensorData.laserScan?.ranges?.[0] || 10,
                nearestObstacleAngle: data.sensorData.laserScan?.angles?.[0] || 0,
                obstacleInFront: data.sensorData.laserScan?.obstacleDetected || false,
                groundHoleDetected: false,
                frontUltrasonicMin: Math.min(
                  data.sensorData.ultrasonicRadar?.frontLeft || 50,
                  data.sensorData.ultrasonicRadar?.frontRight || 50,
                ),
                rearUltrasonicMin: 40,
                frontCollisionRisk: (data.sensorData.laserScan?.ranges?.[0] || 10) < 1.0,
                rearCollisionRisk: false,
                childDetected: data.sensorData.visualTarget !== null,
                childDistance: data.sensorData.visualTarget?.position?.y || 0,
                childAngle: 0,
                childConfidence: data.sensorData.visualTarget?.confidence || 0,
                batteryLevel: 85,
                fenceStatus: data.sensorData.fenceStatus || 'SAFE',
              }
              setFusedData(fusedData)
              
              // 提取障碍物类型 (rock/cone/block)
              const obsType = data.sensorData.laserScan?.nearestObstacleType || null
              setNearestObstacleType(obsType)
            }
          } catch (e) {
            console.error('解析传感器数据失败:', e)
          }
        })
        
        // 订阅决策数据
        client.subscribe('/topic/decision', (message) => {
          try {
            const data = JSON.parse(message.body)
            if (data.decision) {
              setCurrentDecision(data.decision)
              updateVehicleState({
                position: data.vehiclePosition || [0, 0, 0],
                speed: data.decision.speed || 0,
                mode: data.decision.type || 'STOP',
              })
              // 记录决策日志
              addBackendDecisionLog({
                type: data.decision.type || 'STOP',
                speed: data.decision.speed || 0,
                angle: data.decision.angle || 0,
                reason: data.decision.reason || '',
                timestamp: data.decision.timestamp || Date.now(),
              })
            }
          } catch (e) {
            console.error('解析决策数据失败:', e)
          }
        })
        
        // 订阅车辆状态
        client.subscribe('/topic/vehicle', (message) => {
          try {
            const data = JSON.parse(message.body)
            updateVehicleState({
              position: data.position || [0, 0, 0],
              rotation: data.rotation || [0, 0, 0],
              speed: data.speed || 0,
              mode: data.mode || 'STOP',
            })
          } catch (e) {
            console.error('解析车辆状态失败:', e)
          }
        })
        
        // 注释掉：目标状态由前端人工控制，不接收后端数据
        // client.subscribe('/topic/target', (message) => {
        //   try {
        //     const data = JSON.parse(message.body)
        //     updateTargetState({
        //       position: data.position || [2, 0, 0],
        //       detected: data.detected || false,
        //       confidence: data.confidence || 0,
        //     })
        //   } catch (e) {
        //     console.error('解析目标状态失败:', e)
        //   }
        // })
      },
      onDisconnect: () => {
        console.log('WebSocket已断开')
        setConnected(false)
        setSystemStatus('连接断开')
        onConnectionChange?.(false)
      },
      onStompError: (frame) => {
        console.error('STOMP错误:', frame)
        setConnected(false)
        setSystemStatus('STOMP错误')
        onConnectionChange?.(false)
      },
      onWebSocketError: (event) => {
        console.error('WebSocket错误:', event)
        setConnected(false)
        setSystemStatus('连接错误')
        onConnectionChange?.(false)
      },
    })
    
    clientRef.current = client
    websocketService.setClient(client)
    sceneSyncService.setClient(client)
    client.activate()
    
    // 启动场景数据同步（每100ms发送一次）
    sceneSyncIntervalRef.current = setInterval(() => {
      if (client.connected) {
        sceneSyncService.updateSceneData({
          vehicle: {
            position: vehicleState.position,
            rotation: vehicleState.rotation[1],
          },
          target: {
            position: targetState.position,
            detected: targetState.detected,
          },
          obstacles: obstacles.map((o: any) => ({
            position: o.position,
            type: o.type || 'rock',
          })),
        })
        sceneSyncService.startSync(100)
      }
    }, 100)
    
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }
      if (sceneSyncIntervalRef.current) {
        clearInterval(sceneSyncIntervalRef.current)
      }
      sceneSyncService.stopSync()
      if (clientRef.current) {
        clientRef.current.deactivate()
      }
    }
  }, [setRawData, setFusedData, setCurrentDecision, updateVehicleState, updateTargetState, setConnected, setSystemStatus, onConnectionChange, addBackendDecisionLog, setNearestObstacleType, vehicleState, targetState, obstacles])

  useEffect(() => {
    const cleanup = connect()
    return () => {
      cleanup?.()
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }
      if (sceneSyncIntervalRef.current) {
        clearInterval(sceneSyncIntervalRef.current)
      }
      sceneSyncService.stopSync()
    }
  }, [connect])

  return <>{children}</>
}

export default WebSocketProvider
