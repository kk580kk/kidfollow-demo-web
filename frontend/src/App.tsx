import { useState, useEffect, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import Scene3D from './components/Scene3D'
import SensorPanel from './components/SensorPanel'
import ControlPanel from './components/ControlPanel'
import StatusBar from './components/StatusBar'
import WebSocketProvider from './components/WebSocketProvider'
import DecisionLogPanel from './components/DecisionLogPanel'
import { PathPlanningPanel } from './components/PathPlanningPanel'
import './App.css'

interface DecisionLog {
  timestamp: number
  sensor: string
  data: string
  decision: string
  action: string
}

function App() {
  const [connected, setConnected] = useState(false)
  const [systemStatus, setSystemStatus] = useState('初始化中...')
  const [decisionLogs, setDecisionLogs] = useState<DecisionLog[]>([])

  const handleDecisionLog = useCallback((log: DecisionLog) => {
    setDecisionLogs(prev => {
      const newLogs = [log, ...prev].slice(0, 50)
      return newLogs
    })
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSystemStatus('系统就绪')
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <WebSocketProvider onConnectionChange={setConnected}>
      <div className="app">
        {/* 顶部标题栏 - 悬浮 */}
        <header className="app-header floating">
          <h1>KIDFOLLOW 智能童车演示系统</h1>
          <div className="connection-status">
            <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`} />
            {connected ? '已连接核心库' : '未连接'}
          </div>
        </header>

        {/* 主容器 - 全屏3D */}
        <div className="scene-fullscreen">
          {/* 左侧悬浮面板 */}
          <div className="floating-panel left">
            <SensorPanel />
          </div>

          {/* 右侧悬浮面板 */}
          <div className="floating-panel right">
            <PathPlanningPanel />
            <ControlPanel />
            <DecisionLogPanel logs={decisionLogs} />
            <StatusBar status={systemStatus} />
          </div>

          {/* 底部控制提示 */}
          <div className="control-hint floating">
            <strong>控制说明：</strong>
            <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 或 <kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> 控制家长移动 | 
            小车自动跟随家长(保持2米距离) | 鼠标拖拽旋转视角 | 滚轮缩放
          </div>

          <Canvas
            camera={{ position: [0, 10, 15], fov: 60 }}
            shadows
            style={{ background: '#1a1a2e' }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
            <Grid
              args={[30, 30]}
              cellSize={1}
              cellThickness={0.5}
              cellColor="#444466"
              sectionSize={5}
              sectionThickness={1}
              sectionColor="#666699"
            />
            <Scene3D onDecisionLog={handleDecisionLog} />
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              maxPolarAngle={Math.PI / 2.2}
              minDistance={5}
              maxDistance={30}
            />
          </Canvas>
        </div>
      </div>
    </WebSocketProvider>
  )
}

export default App
