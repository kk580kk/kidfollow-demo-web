import { useState, useEffect, useCallback } from 'react'
import { usePathPlanning } from '../hooks/usePathPlanning'
import { useSensorStore } from '../stores/sensorStore'
import './PathPlanningPanel.css'

export function PathPlanningPanel() {
  const {
    isPlanning,
    path,
    gridMap,
    currentManeuver,
    maneuverStep,
    maneuverTotalSteps,
    logs,
    planPath,
    demoManeuver,
    getGridMap,
    isConnected
  } = usePathPlanning()

  const [startX, setStartX] = useState(1.0)
  const [startY, setStartY] = useState(1.0)
  const [goalX, setGoalX] = useState(8.0)
  const [goalY, setGoalY] = useState(8.0)
  const [showGridMap, setShowGridMap] = useState(false)
  
  const sensorStore = useSensorStore()

  useEffect(() => {
    getGridMap()
  }, [getGridMap])

  useEffect(() => {
    sensorStore.setPathPlanningPath(path)
    sensorStore.setPathPlanningGridMap(gridMap)
    if (currentManeuver) {
      sensorStore.setCurrentManeuver(currentManeuver)
      sensorStore.setManeuverStep(maneuverStep)
      sensorStore.setManeuverTotalSteps(maneuverTotalSteps)
    } else {
      sensorStore.setCurrentManeuver(null)
      sensorStore.setManeuverStep(0)
      sensorStore.setManeuverTotalSteps(0)
    }
  }, [path, gridMap, currentManeuver, maneuverStep, maneuverTotalSteps, sensorStore])

  const handlePlanPath = useCallback(() => {
    sensorStore.setPathPlanningPath([])
    sensorStore.setCurrentManeuver(null)
    planPath(startX, startY, goalX, goalY)
  }, [planPath, startX, startY, goalX, goalY, sensorStore])

  const handleDemoManeuver = useCallback((type: 'THREE_POINT_TURN' | 'PARALLEL_PARK' | 'U_TURN') => {
    sensorStore.setPathPlanningPath([])
    sensorStore.setCurrentManeuver(type)
    sensorStore.setManeuverStep(0)
    demoManeuver(type)
  }, [demoManeuver, sensorStore])

  return (
    <div className="path-planning-panel">
      <div className="panel-header">
        <h3>🧭 路径规划</h3>
        <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '● 已连接' : '● 未连接'}
        </span>
      </div>

      <div className="panel-content">
        <div className="control-section">
          <h4>路径规划</h4>
          <div className="coordinate-inputs">
            <div className="input-group">
              <label>起点 X:</label>
              <input type="number" value={startX} onChange={(e) => setStartX(parseFloat(e.target.value))} min={0} max={10} step={0.1} disabled={isPlanning} />
            </div>
            <div className="input-group">
              <label>起点 Y:</label>
              <input type="number" value={startY} onChange={(e) => setStartY(parseFloat(e.target.value))} min={0} max={10} step={0.1} disabled={isPlanning} />
            </div>
            <div className="input-group">
              <label>终点 X:</label>
              <input type="number" value={goalX} onChange={(e) => setGoalX(parseFloat(e.target.value))} min={0} max={10} step={0.1} disabled={isPlanning} />
            </div>
            <div className="input-group">
              <label>终点 Y:</label>
              <input type="number" value={goalY} onChange={(e) => setGoalY(parseFloat(e.target.value))} min={0} max={10} step={0.1} disabled={isPlanning} />
            </div>
          </div>
          <button onClick={handlePlanPath} disabled={isPlanning || !isConnected} className="plan-button">
            {isPlanning ? '规划中...' : '🔍 规划路径'}
          </button>
        </div>

        <div className="control-section">
          <h4>复杂机动演示</h4>
          <div className="maneuver-buttons">
            <button onClick={() => handleDemoManeuver('THREE_POINT_TURN')} disabled={!!currentManeuver || !isConnected} className={`maneuver-button ${currentManeuver === 'THREE_POINT_TURN' ? 'active' : ''}`}>
              🔄 三点掉头
            </button>
            <button onClick={() => handleDemoManeuver('PARALLEL_PARK')} disabled={!!currentManeuver || !isConnected} className={`maneuver-button ${currentManeuver === 'PARALLEL_PARK' ? 'active' : ''}`}>
              🅿️ 平行泊车
            </button>
            <button onClick={() => handleDemoManeuver('U_TURN')} disabled={!!currentManeuver || !isConnected} className={`maneuver-button ${currentManeuver === 'U_TURN' ? 'active' : ''}`}>
              ↩️ U型转弯
            </button>
          </div>
          {currentManeuver && (
            <div className="maneuver-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${((maneuverStep || 0) / (maneuverTotalSteps || 1)) * 100}%` }} />
              </div>
              <span className="progress-text">步骤 {maneuverStep || 0} / {maneuverTotalSteps || 0}</span>
            </div>
          )}
        </div>

        {path.length > 0 && (
          <div className="info-section">
            <h4>路径信息</h4>
            <div className="info-grid">
              <div className="info-item"><span className="label">路径点数:</span><span className="value">{path.length}</span></div>
              <div className="info-item"><span className="label">起点:</span><span className="value">({path[0].x.toFixed(1)}, {path[0].y.toFixed(1)})</span></div>
              <div className="info-item"><span className="label">终点:</span><span className="value">({path[path.length-1].x.toFixed(1)}, {path[path.length-1].y.toFixed(1)})</span></div>
            </div>
          </div>
        )}

        <div className="control-section">
          <h4>栅格地图</h4>
          <button onClick={() => setShowGridMap(!showGridMap)} className="toggle-button">
            {showGridMap ? '👁️ 隐藏栅格' : '👁️ 显示栅格'}
          </button>
          {showGridMap && gridMap && (
            <div className="grid-map-container">
              <div className="grid-map" style={{ gridTemplateColumns: `repeat(${Math.min(gridMap.length, 20)}, 4px)` }}>
                {gridMap.slice(0, 20).map((row, y) =>
                  row.slice(0, 20).map((cell, x) => (
                    <div key={`${x}-${y}`} className={`grid-cell ${cell === 0 ? 'free' : cell === 1 ? 'obstacle' : 'unknown'}`} />
                  ))
                )}
              </div>
              <div className="grid-legend">
                <span className="legend-item"><span className="dot free" /> 自由空间</span>
                <span className="legend-item"><span className="dot obstacle" /> 障碍物</span>
                <span className="legend-item"><span className="dot unknown" /> 未知区域</span>
              </div>
            </div>
          )}
        </div>

        <div className="logs-section">
          <h4>规划日志</h4>
          <div className="logs-container">
            {logs.length === 0 ? (
              <div className="no-logs">暂无日志</div>
            ) : (
              logs.map((log, index) => <div key={index} className="log-entry">{log}</div>)
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
