import { useMemo, useEffect, useState } from 'react'
import * as THREE from 'three'

interface PathPoint {
  x: number
  y: number
}

interface PathVisualizationProps {
  path: PathPoint[]
  currentManeuver: string | null
  maneuverStep: number
}

// 路径线条组件 - 使用 TubeGeometry 创建可见的路径
const PathLine = ({ points }: { points: PathPoint[] }) => {
  const geometry = useMemo(() => {
    if (points.length < 2) return null
    
    // 创建曲线路径
    const curve = new THREE.CatmullRomCurve3(
      points.map(p => new THREE.Vector3(p.x, 0.05, p.y))
    )
    
    // 使用 TubeGeometry 创建可见的管状路径
    return new THREE.TubeGeometry(curve, 64, 0.02, 8, false)
  }, [points])

  if (!geometry || points.length < 2) return null

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color="#00ff00" transparent opacity={0.8} />
    </mesh>
  )
}

// 路径点标记
const PathMarkers = ({ points }: { points: PathPoint[] }) => {
  return (
    <group>
      {points.map((point, index) => (
        <mesh key={index} position={[point.x, 0.05, point.y]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color={index === 0 ? '#00ff00' : index === points.length - 1 ? '#ff0000' : '#ffff00'} />
        </mesh>
      ))}
    </group>
  )
}

// 机动可视化
const ManeuverVisualization = ({ type, step }: { type: string, step: number }) => {
  const [arrowPos, setArrowPos] = useState<[number, number, number]>([0, 0.5, 0])
  const [arrowRot, setArrowRot] = useState(0)

  useEffect(() => {
    if (type === 'THREE_POINT_TURN') {
      switch (step) {
        case 1:
          setArrowPos([0, 0.5, 2])
          setArrowRot(Math.PI / 4)
          break
        case 2:
          setArrowPos([2, 0.5, 0])
          setArrowRot(-Math.PI / 4)
          break
        case 3:
          setArrowPos([0, 0.5, -2])
          setArrowRot(0)
          break
      }
    } else if (type === 'PARALLEL_PARK') {
      switch (step) {
        case 1:
          setArrowPos([2, 0.5, 0])
          setArrowRot(-Math.PI / 3)
          break
        case 2:
          setArrowPos([1, 0.5, -1])
          setArrowRot(Math.PI / 3)
          break
        case 3:
          setArrowPos([0.5, 0.5, -0.5])
          setArrowRot(-Math.PI / 6)
          break
        case 4:
          setArrowPos([0, 0.5, 0])
          setArrowRot(Math.PI / 6)
          break
      }
    } else if (type === 'U_TURN') {
      switch (step) {
        case 1:
          setArrowPos([0, 0.5, 0])
          setArrowRot(Math.PI / 2)
          break
        case 2:
          setArrowPos([0, 0.5, 0])
          setArrowRot(0)
          break
      }
    }
  }, [type, step])

  return (
    <group position={arrowPos} rotation={[0, arrowRot, 0]}>
      <mesh position={[0, 0, 0.3]}>
        <coneGeometry args={[0.1, 0.3, 8]} />
        <meshBasicMaterial color="#00ff00" transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 0, -0.1]}>
        <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
        <meshBasicMaterial color="#00ff00" transparent opacity={0.8} />
      </mesh>
      <mesh position={[0.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.2, 0.02, 8, 16, Math.PI / 2]} />
        <meshBasicMaterial color="#ffff00" transparent opacity={0.6} />
      </mesh>
    </group>
  )
}

// 栅格地图可视化
const GridMapVisualization = ({ gridMap }: { gridMap: number[][] | null }) => {
  if (!gridMap) return null

  const { freeCells, obstacleCells } = useMemo(() => {
    const free: [number, number][] = []
    const obstacle: [number, number][] = []
    
    const displaySize = Math.min(20, gridMap.length)
    const offset = (gridMap.length - displaySize) / 2
    
    for (let y = 0; y < displaySize; y++) {
      for (let x = 0; x < displaySize; x++) {
        const gridX = Math.floor(offset + x)
        const gridY = Math.floor(offset + y)
        if (gridY < gridMap.length && gridX < gridMap[gridY].length) {
          const cell = gridMap[gridY][gridX]
          if (cell === 0) {
            free.push([x, y])
          } else if (cell === 1) {
            obstacle.push([x, y])
          }
        }
      }
    }
    
    return { freeCells: free, obstacleCells: obstacle }
  }, [gridMap])

  return (
    <group position={[5, 0.01, -8]}>
      {freeCells.map(([x, y]) => (
        <mesh key={`free-${x}-${y}`} position={[x * 0.1, 0, y * 0.1]}>
          <planeGeometry args={[0.08, 0.08]} />
          <meshBasicMaterial color="#2e7d32" transparent opacity={0.3} />
        </mesh>
      ))}
      {obstacleCells.map(([x, y]) => (
        <mesh key={`obs-${x}-${y}`} position={[x * 0.1, 0.02, y * 0.1]}>
          <planeGeometry args={[0.08, 0.08]} />
          <meshBasicMaterial color="#c62828" />
        </mesh>
      ))}
    </group>
  )
}

export function PathVisualization({ path, currentManeuver, maneuverStep }: PathVisualizationProps) {
  return (
    <group>
      {path.length > 0 && (
        <>
          <PathLine points={path} />
          <PathMarkers points={path} />
        </>
      )}
      
      {currentManeuver && maneuverStep > 0 && (
        <ManeuverVisualization type={currentManeuver} step={maneuverStep} />
      )}
    </group>
  )
}

export function GridMapOverlay({ gridMap }: { gridMap: number[][] | null }) {
  return <GridMapVisualization gridMap={gridMap} />
}
