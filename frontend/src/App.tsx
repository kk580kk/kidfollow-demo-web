import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import Scene3D from '@components/Scene3D'
import SensorPanel from '@components/SensorPanel'
import ControlPanel from '@components/ControlPanel'
import StatusBar from '@components/StatusBar'
import WebSocketProvider from '@components/WebSocketProvider'
import './App.css'

function App() {
  const [connected, setConnected] = useState(false)
  const [systemStatus, setSystemStatus] = useState('初始化中...')

  useEffect(() => {
    // 模拟系统初始化
    const timer = setTimeout(() => {
      setSystemStatus('系统就绪')
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <WebSocketProvider onConnectionChange={setConnected}>
      <div className="app">
        <header className="app-header">
          <h1>KIDFOLLOW 智能童车演示系统</h1>
          <div className="connection-status">
            <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`} />
            {connected ? '已连接核心库' : '未连接'}
          </div>
        </header>

        <main className="app-main">
          <div className="left-panel">
            <SensorPanel />
            <StatusBar status={systemStatus} />
          </div>

          <div className="center-panel">
            <div className="scene-container">
              <Canvas
                camera={{ position: [0, 8, 12], fov: 60 }}
                shadows
                style={{ background: '#1a1a2e' }}
              >
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
                <Grid
                  args={[20, 20]}
                  cellSize={1}
                  cellThickness={0.5}
                  cellColor="#444466"
                  sectionSize={5}
                  sectionThickness={1}
                  sectionColor="#666699"
                />
                <Scene3D />
                <OrbitControls
                  enablePan={true}
                  enableZoom={true}
                  enableRotate={true}
                  maxPolarAngle={Math.PI / 2.2}
                  minDistance={5}
                  maxDistance={20}
                />
              </Canvas>
            </div>
          </div>

          <div className="right-panel">
            <ControlPanel />
          </div>
        </main>
      </div>
    </WebSocketProvider>
  )
}

export default App
