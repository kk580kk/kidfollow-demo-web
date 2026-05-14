import { useSensorStore } from '../stores/sensorStore'

const SensorPanel = () => {
  const { rawData, fusedData, vehicleState } = useSensorStore()

  // 确保有数据，没有时使用默认值
  const safeRawData = rawData || {
    battery: 85,
    fenceStatus: 'SAFE' as const,
    ultrasonicRadar: { frontLeft: 100, frontRight: 100, frontTop: 100, frontBottom: 100, rearLeft: 100, rearRight: 100, rearTop: 100, rearBottom: 100 },
    laserScan: { ranges: [10, 10, 10, 10], angles: [0, -30, 30, -60], obstacleDetected: false, groundHoleDetected: false }
  }

  const formatDistance = (value: number) => {
    if (value === undefined || value === null || value === Infinity || value > 100) return '无检测'
    return `${value.toFixed(2)}m`
  }

  const formatUltrasonic = (value: number) => {
    if (value === undefined || value === null || value < 5 || value > 400) return '--'
    return `${value.toFixed(0)}cm`
  }

  // 计算置信度（基于距离，越近越可靠）
  const childDistance = fusedData?.childDistance || 0
  const calculatedConfidence = childDistance > 0 && childDistance < 10 
    ? Math.min(0.98, Math.max(0.6, 1 - childDistance / 15)) 
    : 0

  return (
    <div className="panel">
      <div className="panel-title">传感器数据</div>
      
      {/* 激光雷达 - 检测障碍物 */}
      <div className="sensor-section">
        <div className="sensor-section-title">激光雷达 (检测障碍物)</div>
        <div className="sensor-grid">
          <div className="sensor-item">
            <div className="sensor-label">扫描范围</div>
            <div className="sensor-value info">360°</div>
          </div>
          <div className="sensor-item">
            <div className="sensor-label">最近障碍物</div>
            <div className={`sensor-value ${
              (fusedData?.nearestObstacleDistance || 10) < 1.5 ? 'danger' : 
              (fusedData?.nearestObstacleDistance || 10) < 3.0 ? 'warning' : 'success'
            }`}>
              {formatDistance(fusedData?.nearestObstacleDistance || 10)}
            </div>
          </div>
          <div className="sensor-item">
            <div className="sensor-label">障碍物角度</div>
            <div className="sensor-value info">
              {(fusedData?.nearestObstacleAngle || 0).toFixed(0)}°
            </div>
          </div>
          <div className="sensor-item">
            <div className="sensor-label">检测状态</div>
            <div className={`sensor-value ${safeRawData.laserScan.obstacleDetected ? 'warning' : 'success'}`}>
              {safeRawData.laserScan.obstacleDetected ? '有障碍' : '通畅'}
            </div>
          </div>
        </div>
      </div>

      {/* 超声波雷达 */}
      <div className="sensor-section">
        <div className="sensor-section-title">超声波雷达阵列</div>
        <div className="sensor-grid">
          <div className="sensor-item">
            <div className="sensor-label">前左</div>
            <div className={`sensor-value ${safeRawData.ultrasonicRadar.frontLeft < 50 ? 'warning' : 'info'}`}>
              {formatUltrasonic(safeRawData.ultrasonicRadar.frontLeft)}
            </div>
          </div>
          <div className="sensor-item">
            <div className="sensor-label">前右</div>
            <div className={`sensor-value ${safeRawData.ultrasonicRadar.frontRight < 50 ? 'warning' : 'info'}`}>
              {formatUltrasonic(safeRawData.ultrasonicRadar.frontRight)}
            </div>
          </div>
          <div className="sensor-item">
            <div className="sensor-label">前上</div>
            <div className="sensor-value info">
              {formatUltrasonic(safeRawData.ultrasonicRadar.frontTop)}
            </div>
          </div>
          <div className="sensor-item">
            <div className="sensor-label">前下</div>
            <div className={`sensor-value ${safeRawData.ultrasonicRadar.frontBottom < 30 ? 'warning' : 'info'}`}>
              {formatUltrasonic(safeRawData.ultrasonicRadar.frontBottom)}
            </div>
          </div>
        </div>
        <div className="sensor-item" style={{ marginTop: '0.5rem' }}>
          <div className="sensor-label">前向最小距离</div>
          <div className={`sensor-value ${
            (fusedData?.frontUltrasonicMin || 100) < 30 ? 'danger' : 
            (fusedData?.frontUltrasonicMin || 100) < 50 ? 'warning' : 'success'
          }`}>
            {formatUltrasonic(fusedData?.frontUltrasonicMin || 100)}
          </div>
        </div>
      </div>

      {/* 视觉系统 - 修改为70°视角 */}
      <div className="sensor-section">
        <div className="sensor-section-title">视觉系统 (前向70° × 3摄像头)</div>
        <div className="sensor-grid">
          <div className="sensor-item">
            <div className="sensor-label">目标检测</div>
            <div className={`sensor-value ${fusedData?.childDetected ? 'success' : 'warning'}`}>
              {fusedData?.childDetected ? '已检测' : '未检测'}
            </div>
          </div>
          <div className="sensor-item">
            <div className="sensor-label">置信度</div>
            <div className={`sensor-value ${calculatedConfidence > 0.8 ? 'success' : calculatedConfidence > 0.5 ? 'warning' : 'info'}`}>
              {(calculatedConfidence * 100).toFixed(0)}%
            </div>
          </div>
          <div className="sensor-item">
            <div className="sensor-label">目标距离</div>
            <div className="sensor-value success">
              {formatDistance(fusedData?.childDistance || 0)}
            </div>
          </div>
          <div className="sensor-item">
            <div className="sensor-label">目标角度</div>
            <div className="sensor-value info">
              {(fusedData?.childAngle || 0).toFixed(1)}°
            </div>
          </div>
        </div>
      </div>

      {/* 系统状态 */}
      <div className="sensor-section">
        <div className="sensor-section-title">系统状态</div>
        <div className="sensor-grid">
          <div className="sensor-item">
            <div className="sensor-label">电池电量</div>
            <div className={`sensor-value ${
              safeRawData.battery < 20 ? 'danger' : 
              safeRawData.battery < 50 ? 'warning' : 'success'
            }`}>
              {safeRawData.battery}%
            </div>
          </div>
          <div className="sensor-item">
            <div className="sensor-label">围栏状态</div>
            <div className={`sensor-value ${
              safeRawData.fenceStatus === 'ALARM' ? 'danger' : 
              safeRawData.fenceStatus === 'WARNING' ? 'warning' : 'success'
            }`}>
              {safeRawData.fenceStatus === 'ALARM' ? '危险' : 
               safeRawData.fenceStatus === 'WARNING' ? '警告' : '安全'}
            </div>
          </div>
          <div className="sensor-item">
            <div className="sensor-label">运行模式</div>
            <div className="sensor-value info">
              {vehicleState?.mode || 'STOP'}
            </div>
          </div>
          <div className="sensor-item">
            <div className="sensor-label">当前速度</div>
            <div className="sensor-value info">
              {(vehicleState?.speed || 0).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .sensor-section {
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }
        
        .sensor-section-title {
          font-size: 0.85rem;
          color: #00d4ff;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }
        
        .sensor-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }
        
        .sensor-item {
          background: rgba(255, 255, 255, 0.08);
          padding: 0.5rem;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .sensor-label {
          font-size: 0.75rem;
          color: #888;
          margin-bottom: 0.25rem;
        }
        
        .sensor-value {
          font-family: 'Courier New', monospace;
          font-weight: 700;
          font-size: 1rem;
        }
        
        .sensor-value.success { color: #00ff00; }
        .sensor-value.warning { color: #ffaa00; }
        .sensor-value.danger { color: #ff4757; }
        .sensor-value.info { color: #00d4ff; }
      `}</style>
    </div>
  )
}

export default SensorPanel