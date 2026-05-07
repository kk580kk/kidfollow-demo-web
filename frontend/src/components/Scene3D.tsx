import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSensorStore } from '../stores/sensorStore'
import * as THREE from 'three'

// 车辆模型
const Vehicle = ({ position, rotation, speed }: { position: [number, number, number], rotation: [number, number, number], speed: number }) => {
  const ref = useRef<THREE.Group>(null)
  
  useFrame(() => {
    if (ref.current) {
      ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, position[0], 0.1)
      ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, position[2], 0.1)
      ref.current.rotation.y = rotation[1]
      if (speed > 0) {
        ref.current.position.y = position[1] + Math.sin(Date.now() * 0.02) * 0.02
      }
    }
  })
  
  return (
    <group ref={ref} position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.4, 1.2]} />
        <meshStandardMaterial color="#4CAF50" />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.7, 0.2, 0.9]} />
        <meshStandardMaterial color="#388E3C" />
      </mesh>
      {[[-0.45, -0.15, 0.4], [0.45, -0.15, 0.4], [-0.45, -0.15, -0.4], [0.45, -0.15, -0.4]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      ))}
      <mesh position={[-0.25, 0.1, 0.6]} castShadow>
        <boxGeometry args={[0.15, 0.1, 0.05]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.25, 0.1, 0.6]} castShadow>
        <boxGeometry args={[0.15, 0.1, 0.05]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0.55, 0.2]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.15, 32]} />
        <meshStandardMaterial color="#666" />
      </mesh>
    </group>
  )
}

// 目标（儿童）模型
const Target = ({ position, detected, confidence }: { position: [number, number, number], detected: boolean, confidence: number }) => {
  const ref = useRef<THREE.Group>(null)
  
  useFrame(() => {
    if (ref.current) {
      ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, position[0], 0.05)
      ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, position[2], 0.05)
    }
  })
  
  const color = useMemo(() => {
    if (!detected) return '#666'
    if (confidence > 0.9) return '#2196F3'
    if (confidence > 0.7) return '#FF9800'
    return '#f44336'
  }, [detected, confidence])
  
  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <capsuleGeometry args={[0.2, 0.5, 4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.45, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {detected && (
        <mesh position={[0, 0.8, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={1} />
        </mesh>
      )}
    </group>
  )
}

// 障碍物模型
const Obstacle = ({ position, distance }: { position: [number, number, number], distance: number }) => {
  const color = useMemo(() => {
    if (distance < 1.0) return '#ff0000'
    if (distance < 2.0) return '#ff8800'
    return '#666666'
  }, [distance])
  
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.3, 0.6, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <coneGeometry args={[0.1, 0.3, 8]} />
        <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

// 主场景
const Scene3D = () => {
  const { vehicleState, targetState, fusedData, rawData } = useSensorStore()
  
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>
      
      <Vehicle 
        position={vehicleState.position}
        rotation={vehicleState.rotation}
        speed={vehicleState.speed}
      />
      
      <Target 
        position={targetState.position}
        detected={targetState.detected}
        confidence={targetState.confidence}
      />
      
      {fusedData?.obstacleInFront && (
        <Obstacle 
          position={[
            Math.sin((fusedData.nearestObstacleAngle * Math.PI) / 180) * fusedData.nearestObstacleDistance,
            0,
            Math.cos((fusedData.nearestObstacleAngle * Math.PI) / 180) * fusedData.nearestObstacleDistance,
          ]}
          distance={fusedData.nearestObstacleDistance}
        />
      )}
      
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow shadow-mapSize={[2048, 2048]} />
      
      {targetState.detected && (
        <pointLight 
          position={[targetState.position[0], 2, targetState.position[2]]}
          intensity={0.5}
          color="#2196F3"
          distance={5}
        />
      )}
    </>
  )
}

export default Scene3D
