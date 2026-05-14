import { useState, useCallback, useRef, useEffect } from 'react'

interface PathPoint {
  x: number
  y: number
}

interface PathPlanningState {
  isPlanning: boolean
  path: PathPoint[]
  gridMap: number[][] | null
  currentManeuver: string | null
  maneuverStep: number
  maneuverTotalSteps: number
}

interface PathPlanningMessage {
  type: string
  timestamp: number
  data: any
}

export function usePathPlanning(wsUrl: string = 'ws://192.168.71.9:8080/ws/path-planning') {
  const [state, setState] = useState<PathPlanningState>({
    isPlanning: false,
    path: [],
    gridMap: null,
    currentManeuver: null,
    maneuverStep: 0,
    maneuverTotalSteps: 0
  })
  
  const [logs, setLogs] = useState<string[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev.slice(-19), `[${new Date().toLocaleTimeString()}] ${message}`])
  }, [])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        addLog('路径规划服务已连接')
      }

      ws.onmessage = (event) => {
        try {
          const message: PathPlanningMessage = JSON.parse(event.data)
          handleMessage(message)
        } catch (e) {
          console.error('解析消息失败:', e)
        }
      }

      ws.onclose = () => {
        addLog('路径规划服务已断开')
        // 自动重连
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, 3000)
      }

      ws.onerror = (error) => {
        console.error('WebSocket错误:', error)
        addLog('路径规划服务连接错误')
      }
    } catch (e) {
      console.error('连接失败:', e)
    }
  }, [wsUrl, addLog])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const handleMessage = useCallback((message: PathPlanningMessage) => {
    switch (message.type) {
      case 'PLANNING_STARTED':
        setState(prev => ({
          ...prev,
          isPlanning: true,
          path: []
        }))
        addLog(`开始路径规划: (${message.data.start.x.toFixed(1)}, ${message.data.start.y.toFixed(1)}) -> (${message.data.goal.x.toFixed(1)}, ${message.data.goal.y.toFixed(1)})`)
        break

      case 'PLANNING_COMPLETED':
        setState(prev => ({
          ...prev,
          isPlanning: false,
          path: message.data.path
        }))
        addLog(`路径规划完成: ${message.data.waypointCount} 个路径点, 长度 ${message.data.pathLength.toFixed(2)}m`)
        break

      case 'PLANNING_FAILED':
        setState(prev => ({
          ...prev,
          isPlanning: false,
          path: []
        }))
        addLog(`路径规划失败: ${message.data.reason}`)
        break

      case 'MANEUVER_STARTED':
        setState(prev => ({
          ...prev,
          currentManeuver: message.data.type,
          maneuverStep: 0,
          maneuverTotalSteps: 0
        }))
        addLog(`开始机动: ${message.data.description}`)
        break

      case 'MANEUVER_STEP':
        setState(prev => ({
          ...prev,
          maneuverStep: message.data.stepIndex,
          maneuverTotalSteps: message.data.totalSteps
        }))
        addLog(`机动步骤 ${message.data.stepIndex}/${message.data.totalSteps}: ${message.data.action} ${message.data.steering > 0 ? '右转' : message.data.steering < 0 ? '左转' : '直行'}`)
        break

      case 'MANEUVER_COMPLETED':
        setState(prev => ({
          ...prev,
          currentManeuver: null,
          maneuverStep: 0,
          maneuverTotalSteps: 0
        }))
        addLog(`机动完成: ${message.data.success ? '成功' : '失败'}`)
        break

      case 'GRID_MAP':
        setState(prev => ({
          ...prev,
          gridMap: message.data.grid
        }))
        addLog(`栅格地图已更新: ${message.data.size}x${message.data.size}`)
        break

      case 'ERROR':
        addLog(`错误: ${message.data.message}`)
        break
    }
  }, [addLog])

  const planPath = useCallback((startX: number, startY: number, goalX: number, goalY: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'PLAN_PATH',
        startX,
        startY,
        goalX,
        goalY
      }))
    }
  }, [])

  const demoManeuver = useCallback((maneuverType: 'THREE_POINT_TURN' | 'PARALLEL_PARK' | 'U_TURN') => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'DEMO_MANEUVER',
        maneuverType
      }))
    }
  }, [])

  const getGridMap = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'GET_GRID_MAP'
      }))
    }
  }, [])

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return {
    ...state,
    logs,
    planPath,
    demoManeuver,
    getGridMap,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN
  }
}
