import { useRef, useMemo, useEffect, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSensorStore } from '../stores/sensorStore'
import * as THREE from 'three'

let globalObstacles: Array<{ position: [number, number, number], type: string, radius: number }> = []

interface DecisionLog {
  timestamp: number
  sensor: string
  data: string
  decision: string
  action: string
}

const Vehicle = ({ 
  targetPosition, 
  onPositionUpdate,
  onDecision
}: { 
  targetPosition: [number, number, number]
  onPositionUpdate: (pos: [number, number, number]) => void
  onDecision: (log: DecisionLog) => void
}) => {
  const vehicleRef = useRef<THREE.Group>(null)
  const frontLeftWheelRef = useRef<THREE.Group>(null)
  const frontRightWheelRef = useRef<THREE.Group>(null)
  const [vehiclePos, setVehiclePos] = useState<[number, number, number]>([0, 0.25, 2])
  const [vehicleRot, setVehicleRot] = useState(0)
  const [isMoving, setIsMoving] = useState(false)
  const [pathMode, setPathMode] = useState('FOLLOW')
  const lastLogTime = useRef(0)
  const { updateVehicleState } = useSensorStore()

  useEffect(() => { onPositionUpdate(vehiclePos) }, [vehiclePos, onPositionUpdate])

  const checkObstacles = useCallback((pos: [number, number, number], direction: number) => {
    const detectionDistance = 3.0
    const dangerDistance = 1.5
    let frontObstacle: any = null
    let leftClearDistance = detectionDistance
    let rightClearDistance = detectionDistance
    let minFrontDistance = detectionDistance

    for (const obs of globalObstacles) {
      const dx = obs.position[0] - pos[0], dz = obs.position[2] - pos[2]
      const distance = Math.sqrt(dx * dx + dz * dz)
      const angleToObstacle = Math.atan2(dx, dz)
      const relativeAngle = ((angleToObstacle - direction + Math.PI) % (2 * Math.PI)) - Math.PI

      if (Math.abs(relativeAngle) < Math.PI / 6 && distance < detectionDistance) {
        if (distance < minFrontDistance) {
          minFrontDistance = distance
          frontObstacle = { distance, angle: relativeAngle, type: obs.type }
        }
      }
      if (relativeAngle > Math.PI / 6 && relativeAngle < Math.PI / 2 && distance < leftClearDistance) leftClearDistance = distance
      if (relativeAngle < -Math.PI / 6 && relativeAngle > -Math.PI / 2 && distance < rightClearDistance) rightClearDistance = distance
    }
    return { frontObstacle, leftClear: leftClearDistance > dangerDistance, rightClear: rightClearDistance > dangerDistance, leftClearDistance, rightClearDistance, isBlocked: minFrontDistance < dangerDistance }
  }, [])

  useFrame(() => {
    if (!vehicleRef.current) return
    const dx = targetPosition[0] - vehiclePos[0], dz = targetPosition[2] - vehiclePos[2]
    const distanceToTarget = Math.sqrt(dx * dx + dz * dz)
    const targetAngle = Math.atan2(dx, dz)
    const { frontObstacle, leftClear, rightClear, leftClearDistance, rightClearDistance, isBlocked } = checkObstacles(vehiclePos, vehicleRot)

    let newPos = vehiclePos, newRot = vehicleRot, newSteering = 0, moving = false
    let angleDiff = targetAngle - vehicleRot
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI

    let decisionLog: DecisionLog | null = null
    const now = Date.now()
    const canLog = now - lastLogTime.current > 500

    if (distanceToTarget > 2.5) {
      if (frontObstacle && frontObstacle.distance < 2.5) {
        const obsType = frontObstacle.type === 'cone' ? '锥桶' : frontObstacle.type === 'rock' ? '石头' : '方块'
        if (isBlocked) {
          if (leftClear && rightClear) {
            if (leftClearDistance >= rightClearDistance) {
              newRot = vehicleRot + 0.05; newSteering = 0.8
              newPos = [vehiclePos[0] + Math.sin(newRot) * 0.025, 0.25, vehiclePos[2] + Math.cos(newRot) * 0.025]
              moving = true; setPathMode('AVOID_LEFT')
              if (canLog) { decisionLog = { timestamp: now, sensor: '激光雷达+超声波', data: `发现${obsType}在前方${(frontObstacle.distance * 100).toFixed(0)}cm，左侧${(leftClearDistance * 100).toFixed(0)}cm更宽`, decision: '选择左侧绕行', action: '左转绕行' }; lastLogTime.current = now }
            } else {
              newRot = vehicleRot - 0.05; newSteering = -0.8
              newPos = [vehiclePos[0] + Math.sin(newRot) * 0.025, 0.25, vehiclePos[2] + Math.cos(newRot) * 0.025]
              moving = true; setPathMode('AVOID_RIGHT')
              if (canLog) { decisionLog = { timestamp: now, sensor: '激光雷达+超声波', data: `发现${obsType}在前方${(frontObstacle.distance * 100).toFixed(0)}cm，右侧${(rightClearDistance * 100).toFixed(0)}cm更宽`, decision: '选择右侧绕行', action: '右转绕行' }; lastLogTime.current = now }
            }
          } else if (leftClear) {
            newRot = vehicleRot + 0.05; newSteering = 0.8
            newPos = [vehiclePos[0] + Math.sin(newRot) * 0.025, 0.25, vehiclePos[2] + Math.cos(newRot) * 0.025]
            moving = true; setPathMode('AVOID_LEFT')
            if (canLog) { decisionLog = { timestamp: now, sensor: '激光雷达', data: `发现${obsType}在前方${(frontObstacle.distance * 100).toFixed(0)}cm，仅左侧通畅${(leftClearDistance * 100).toFixed(0)}cm`, decision: '必须左转绕行', action: '左转绕行' }; lastLogTime.current = now }
          } else if (rightClear) {
            newRot = vehicleRot - 0.05; newSteering = -0.8
            newPos = [vehiclePos[0] + Math.sin(newRot) * 0.025, 0.25, vehiclePos[2] + Math.cos(newRot) * 0.025]
            moving = true; setPathMode('AVOID_RIGHT')
            if (canLog) { decisionLog = { timestamp: now, sensor: '激光雷达', data: `发现${obsType}在前方${(frontObstacle.distance * 100).toFixed(0)}cm，仅右侧通畅${(rightClearDistance * 100).toFixed(0)}cm`, decision: '必须右转绕行', action: '右转绕行' }; lastLogTime.current = now }
          } else {
            setPathMode('STOP')
            if (canLog) { decisionLog = { timestamp: now, sensor: '激光雷达+超声波', data: `发现${obsType}在前方${(frontObstacle.distance * 100).toFixed(0)}cm，左右皆堵`, decision: '无路可走，停止', action: '停车等待' }; lastLogTime.current = now }
          }
        } else {
          const turnDir = leftClear ? 1 : rightClear ? -1 : 0
          if (turnDir !== 0) {
            newRot = vehicleRot + 0.03 * turnDir; newSteering = 0.5 * turnDir
            newPos = [vehiclePos[0] + Math.sin(newRot) * 0.035, 0.25, vehiclePos[2] + Math.cos(newRot) * 0.035]
            moving = true; setPathMode(turnDir > 0 ? 'AVOID_LEFT' : 'AVOID_RIGHT')
          } else {
            newPos = [vehiclePos[0] + Math.sin(vehicleRot) * 0.015, 0.25, vehiclePos[2] + Math.cos(vehicleRot) * 0.015]
            moving = true; setPathMode('FOLLOW')
          }
        }
      } else {
        if (Math.abs(angleDiff) > 0.1) { newRot = vehicleRot + Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 0.03); newSteering = Math.sign(angleDiff) * 0.5 }
        newPos = [vehiclePos[0] + Math.sin(newRot) * 0.05, 0.25, vehiclePos[2] + Math.cos(newRot) * 0.05]
        moving = true; setPathMode('FOLLOW')
        if (canLog && Math.abs(angleDiff) > 0.3) { decisionLog = { timestamp: now, sensor: '视觉系统', data: `目标距离${distanceToTarget.toFixed(1)}m，角度差${(angleDiff * 180 / Math.PI).toFixed(0)}°`, decision: '前方畅通，跟随目标', action: '直行' }; lastLogTime.current = now }
      }
    } else if (distanceToTarget < 1.5) {
      newPos = [vehiclePos[0] - Math.sin(vehicleRot) * 0.03, 0.25, vehiclePos[2] - Math.cos(vehicleRot) * 0.03]
      moving = true; setPathMode('FOLLOW')
      if (canLog) { decisionLog = { timestamp: now, sensor: '超声波', data: `距离目标过近${distanceToTarget.toFixed(1)}m`, decision: '保持安全距离', action: '后退' }; lastLogTime.current = now }
    } else {
      setPathMode('STOP')
      if (canLog && frontObstacle) { decisionLog = { timestamp: now, sensor: '综合判断', data: `距离合适${distanceToTarget.toFixed(1)}m，${frontObstacle ? '前方有障碍' : '前方畅通'}`, decision: '保持距离，观察', action: '停止' }; lastLogTime.current = now }
    }

    if (decisionLog) onDecision(decisionLog)

    newPos[0] = Math.max(-14, Math.min(14, newPos[0]))
    newPos[2] = Math.max(-14, Math.min(14, newPos[2]))

    setVehiclePos(newPos); setVehicleRot(newRot); setIsMoving(moving)
    updateVehicleState({ position: newPos, rotation: [0, newRot, 0], speed: moving ? 5 : 0, mode: pathMode as any })

    vehicleRef.current.position.x = THREE.MathUtils.lerp(vehicleRef.current.position.x, newPos[0], 0.15)
    vehicleRef.current.position.z = THREE.MathUtils.lerp(vehicleRef.current.position.z, newPos[2], 0.15)
    vehicleRef.current.rotation.y = THREE.MathUtils.lerp(vehicleRef.current.rotation.y, newRot, 0.1)
    if (frontLeftWheelRef.current) frontLeftWheelRef.current.rotation.y = newSteering * 0.6
    if (frontRightWheelRef.current) frontRightWheelRef.current.rotation.y = newSteering * 0.6
    vehicleRef.current.position.y = moving ? 0.25 + Math.sin(Date.now() * 0.015) * 0.015 : 0.25
  })

  return (
    <group ref={vehicleRef}>
      <mesh position={[0, 0, 0]} castShadow receiveShadow><boxGeometry args={[0.7, 0.15, 1]} /><meshStandardMaterial color="#333" /></mesh>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow><boxGeometry args={[0.6, 0.25, 0.8]} /><meshStandardMaterial color="#4CAF50" /></mesh>
      <mesh position={[0, 0.4, -0.1]} castShadow><boxGeometry args={[0.5, 0.15, 0.5]} /><meshStandardMaterial color="#388E3C" /></mesh>
      <group position={[-0.35, 0, -0.35]}><mesh rotation={[0, 0, Math.PI/2]} castShadow><cylinderGeometry args={[0.12, 0.12, 0.08, 16]} /><meshStandardMaterial color="#1a1a1a" /></mesh></group>
      <group position={[0.35, 0, -0.35]}><mesh rotation={[0, 0, Math.PI/2]} castShadow><cylinderGeometry args={[0.12, 0.12, 0.08, 16]} /><meshStandardMaterial color="#1a1a1a" /></mesh></group>
      <group ref={frontLeftWheelRef} position={[-0.35, 0, 0.35]}><mesh rotation={[0, 0, Math.PI/2]} castShadow><cylinderGeometry args={[0.12, 0.12, 0.08, 16]} /><meshStandardMaterial color="#1a1a1a" /></mesh></group>
      <group ref={frontRightWheelRef} position={[0.35, 0, 0.35]}><mesh rotation={[0, 0, Math.PI/2]} castShadow><cylinderGeometry args={[0.12, 0.12, 0.08, 16]} /><meshStandardMaterial color="#1a1a1a" /></mesh></group>
      {isMoving && <mesh position={[0, 0.6, 0]}><ringGeometry args={[0.15, 0.2, 16]} /><meshBasicMaterial color={pathMode === 'STOP' ? "#ff0000" : pathMode.includes('AVOID') ? "#ffaa00" : "#00ff00"} transparent opacity={0.6} /></mesh>}
    </group>
  )
}

const Target = ({ onPositionChange }: { onPositionChange?: (pos: [number, number, number]) => void }) => {
  const ref = useRef<THREE.Group>(null)
  const [isMoving, setIsMoving] = useState(false)
  const [localPosition, setLocalPosition] = useState<[number, number, number]>([2, 0, 0])

  useEffect(() => {
    const keys: Record<string, boolean> = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false }
    const speed = 0.1
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key in keys) { keys[e.key] = true; setIsMoving(true) } }
    const handleKeyUp = (e: KeyboardEvent) => { if (e.key in keys) keys[e.key] = false; if (!Object.values(keys).some(v => v)) setIsMoving(false) }
    const updatePosition = () => {
      let dx = 0, dz = 0
      if (keys.w || keys.ArrowUp) dz -= speed
      if (keys.s || keys.ArrowDown) dz += speed
      if (keys.a || keys.ArrowLeft) dx -= speed
      if (keys.d || keys.ArrowRight) dx += speed
      if (dx !== 0 || dz !== 0) {
        setLocalPosition(prev => {
          const newPos: [number, number, number] = [Math.max(-14, Math.min(14, prev[0] + dx)), prev[1], Math.max(-14, Math.min(14, prev[2] + dz))]
          onPositionChange?.(newPos)
          return newPos
        })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    const interval = setInterval(updatePosition, 16)
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); clearInterval(interval) }
  }, [onPositionChange])

  useFrame(() => {
    if (ref.current) {
      ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, localPosition[0], 0.1)
      ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, localPosition[2], 0.1)
    }
  })

  return (
    <group ref={ref}>
      <mesh castShadow><capsuleGeometry args={[0.25, 0.8, 4, 8]} /><meshStandardMaterial color="#2196F3" /></mesh>
      <mesh position={[0, 0.7, 0]} castShadow><sphereGeometry args={[0.22, 16, 16]} /><meshStandardMaterial color="#FFC107" /></mesh>
      {isMoving && <mesh position={[0, 1.5, 0]} rotation={[0, Date.now() * 0.005, 0]}><ringGeometry args={[0.3, 0.4, 16]} /><meshBasicMaterial color="#00ff00" transparent opacity={0.6} /></mesh>}
    </group>
  )
}

const StaticObstacle = ({ position, type, onRegister }: { position: [number, number, number], type: 'cone' | 'box' | 'rock', onRegister: (pos: [number, number, number], type: string, radius: number) => void }) => {
  const color = useMemo(() => { const colors = ['#ff4757', '#ffa502', '#2ed573', '#1e90ff', '#a4b0be']; return colors[Math.floor(Math.random() * colors.length)] }, [])
  useEffect(() => { const radius = type === 'cone' ? 0.3 : type === 'rock' ? 0.35 : 0.3; onRegister(position, type, radius); return () => { globalObstacles = globalObstacles.filter(o => o.position !== position) } }, [position, type, onRegister])
  if (type === 'cone') return <group position={position}><mesh castShadow><coneGeometry args={[0.25, 0.6, 16]} /><meshStandardMaterial color="#ff4757" /></mesh></group>
  if (type === 'rock') return <mesh position={position} castShadow><dodecahedronGeometry args={[0.3]} /><meshStandardMaterial color="#747d8c" roughness={0.8} /></mesh>
  return <mesh position={position} castShadow><boxGeometry args={[0.4, 0.4, 0.4]} /><meshStandardMaterial color={color} /></mesh>
}

const Scene3D = ({ onDecisionLog }: { onDecisionLog?: (log: DecisionLog) => void }) => {
  const { targetState, updateTargetPosition, updateFusedData, setRawData, useBackendData } = useSensorStore()
  const [vehiclePos, setVehiclePos] = useState<[number, number, number]>([0, 0.25, 2])
  const lastSensorUpdate = useRef(0)

  const staticObstacles = useMemo(() => {
    const obstacles: Array<{ position: [number, number, number], type: 'cone' | 'box' | 'rock' }> = []
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const distance = 4 + Math.random() * 6
      const x = Math.cos(angle) * distance
      const z = Math.sin(angle) * distance
      if (Math.abs(x) < 2 && Math.abs(z) < 2) continue
      const types: Array<'cone' | 'box' | 'rock'> = ['cone', 'box', 'rock']
      obstacles.push({ position: [x, 0.2, z], type: types[Math.floor(Math.random() * types.length)] })
    }
    return obstacles
  }, [])

  const registerObstacle = useCallback((pos: [number, number, number], type: string, radius: number) => { globalObstacles.push({ position: pos, type, radius }) }, [])

  const handleDecision = useCallback((log: DecisionLog) => {
    onDecisionLog?.(log)
  }, [onDecisionLog])

  useFrame(() => {
    // 当 WebSocket 已连接时，使用后端真实数据，跳过本地仿真
    if (useBackendData) return;

    const now = Date.now()
    if (now - lastSensorUpdate.current < 100) return
    lastSensorUpdate.current = now

    const targetPos = targetState.position
    const dx = targetPos[0] - vehiclePos[0], dz = targetPos[2] - vehiclePos[2]
    const distanceToTarget = Math.sqrt(dx * dx + dz * dz)
    const angleToTarget = Math.atan2(dx, dz)

    let nearestObstacleDistance = Infinity, nearestObstacleAngle = 0
    let frontMin = 500, frontLeft = 500, frontRight = 500, frontBottom = 500

    for (const obs of globalObstacles) {
      const odx = obs.position[0] - vehiclePos[0], odz = obs.position[2] - vehiclePos[2]
      const dist = Math.sqrt(odx * odx + odz * odz)
      const angle = Math.atan2(odx, odz)
      const relativeAngle = ((angle - vehiclePos[2] + Math.PI) % (2 * Math.PI)) - Math.PI
      const distCm = dist * 100

      if (dist < nearestObstacleDistance) {
        nearestObstacleDistance = dist
        nearestObstacleAngle = relativeAngle * (180 / Math.PI)
      }

      if (Math.abs(relativeAngle) < Math.PI / 8) frontMin = Math.min(frontMin, distCm)
      if (relativeAngle > 0 && relativeAngle < Math.PI / 4) frontLeft = Math.min(frontLeft, distCm)
      if (relativeAngle < 0 && relativeAngle > -Math.PI / 4) frontRight = Math.min(frontRight, distCm)
      if (relativeAngle > -Math.PI / 6 && relativeAngle < Math.PI / 6) frontBottom = Math.min(frontBottom, distCm * 0.8)
    }

    if (nearestObstacleDistance === Infinity) nearestObstacleDistance = 10

    const visualAngle = ((angleToTarget - vehiclePos[2] + Math.PI) % (2 * Math.PI)) - Math.PI
    const inVisualRange = Math.abs(visualAngle) < (70 * Math.PI / 180)
    const visualConfidence = inVisualRange && distanceToTarget < 8 ? Math.min(0.98, Math.max(0.4, 1 - distanceToTarget / 10)) : 0

    updateFusedData({
      nearestObstacleDistance,
      nearestObstacleAngle,
      frontUltrasonicMin: Math.min(frontMin, frontLeft, frontRight),
      childDetected: inVisualRange && distanceToTarget < 8,
      childDistance: distanceToTarget,
      childAngle: angleToTarget * (180 / Math.PI),
      childConfidence: visualConfidence,
      groundHoleDetected: false,
      obstacleInFront: frontMin < 150,
      frontCollisionRisk: frontMin < 80,
    })

    setRawData({
      timestamp: now,
      battery: 85,
      gps: { lat: 39.9042 + vehiclePos[0] * 0.0001, lng: 116.4074 + vehiclePos[2] * 0.0001 },
      laserScan: {
        ranges: nearestObstacleDistance < 10 ? [nearestObstacleDistance, nearestObstacleDistance + 0.5, nearestObstacleDistance + 1, 10] : [10, 10, 10, 10],
        angles: [0, -30, 30, -60],
        obstacleDetected: nearestObstacleDistance < 3,
        groundHoleDetected: false,
      },
      ultrasonicRadar: {
        frontLeft: Math.floor(frontLeft),
        frontRight: Math.floor(frontRight),
        frontTop: 200,
        frontBottom: Math.floor(frontBottom),
        rearLeft: 500,
        rearRight: 500,
        rearTop: 500,
        rearBottom: 500,
      },
      visualTarget: inVisualRange ? {
        type: 'child',
        confidence: visualConfidence,
        position: { x: targetPos[0], y: targetPos[2] }
      } : null,
      childPresent: inVisualRange && distanceToTarget < 8,
      fenceStatus: distanceToTarget > 8 ? 'WARNING' : 'SAFE',
    })
  })

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>
      <Vehicle 
        targetPosition={targetState.position} 
        onPositionUpdate={setVehiclePos}
        onDecision={handleDecision}
      />
      <Target onPositionChange={updateTargetPosition} />
      {staticObstacles.map((obs, index) => (
        <StaticObstacle key={index} position={obs.position} type={obs.type} onRegister={registerObstacle} />
      ))}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow shadow-mapSize={[2048, 2048]} />
      <pointLight position={[0, 5, 0]} intensity={0.3} color="#00d4ff" distance={10} />
    </>
  )
}

export default Scene3D
