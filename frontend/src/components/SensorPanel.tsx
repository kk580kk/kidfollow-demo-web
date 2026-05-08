import { useSensorStore } from '../stores/sensorStore'

const SensorPanel = () => {
  const { rawData, fusedData } = useSensorStore()

  const formatDistance = (value: number) => {
    if (value === Infinity || value > 100) return '无检测'
    return `${value.toFixed(2)}m`
  }

  const formatUltrasonic = (value: number) => {
    if (value < 5 || value > 50) return '--'
    return `${value.toFixed(0)}cm`
  }

  return (
    <div className="panel">
      <div className="panel-title">传感器数据</div>
      
      {/* 激光雷达 */}
      <div className="sensor-section">
        <div className="sensor-section-title">激光雷达 (RPLIDAR A1/S1)</div>
        <div className="sensor-grid">
          <div className="sensor-item">
            <div className="sensor-label">扫描范围</div>
            <div className="sensor-value info">180°</div>
          </div>
          <div className="sensor-item">
            <div className="sensor-label">最近障碍物</div>
            <div className={`sensor-value ${
              (fusedData?.nearestObstacleDistance || 10) < 1.0 ? 'danger' : 
              (fusedData?.nearestObstacleDistance || 10) < 3.0 ? 'warning' : 'success'
            }`}>
              {formatDistance(fusedData?.nearestObstacleDistance || 10)}
            </div>
          </div>
          <div className="sensor-item">
            <div className="sensor-label">障碍物角度</div>
            <div className="sensor-value info">
              {fusedData?.nearestObstacleAngle?.toFixed(0) || 0}°
            </div>
          </div>
          <div className="sensor-item">
            <div className="sensor-label">地面坑洼</div>
            <div className={`sensor-value ${fusedData?.groundHoleDetected ? 'danger' : 'success'}`}>
              {fusedData?.groundHoleDetected ? '检测到' : '安全'}
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
            <div className="sensor-value info">
              {formatUltrasonic(rawData?.ultrasonicRadar?.frontLeft || 0)}
            </div>
          </div>
          <div className="sensor-item">
            <div className="sensor-label">前右</div>
            <div className="sensor-value info">
              {formatUltrasonic(rawData?.ultrasonicRadar?.frontRight || 0)}
            </div>
          </div>
          <div className="sensor-item">
            <div className="sensor-label">前上</div>
            <div className="sensor-value info">
              {formatUltrasonic(rawData?.ultrasonicRadar?.frontTop || 0)}
            </div>
          </div>
          <div className="sensor-item">
            <div className="sensor-label">前下</div>
            <div className="sensor-value info">
              {formatUltrasonic(rawData?.ultrasonicRadar?.frontBottom || 0)}
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

      {/* 视觉系统 */}
      <div className="sensor-section">
        <div className="sensor-section-title">视觉系统 (180°全景)</div>
        <div className="sensor-grid">
          <div className="sensor-item">
            <div className="sensor-label">目标检测</div>
            <div className={`sensor-value ${fusedData?.childDetected ? 'success' : 'warning'}`}>
              {fusedData?.childDetected ? '已检测' : '未检测'}
            </div>
          </div>
          <div className="sensor-item">
            <div className="sensor-label">置信度</div>
            <div className="sensor-value info">
              {((fusedData?.childConfidence || 0) * 100).toFixed(0)}%
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
              (rawData?.battery || 100) < 20 ? 'danger' : 
              (rawData?.battery || 100) < 50 ? 'warning' : 'success'
            }`}>
              {rawData?.battery || 85}%
            </div>
          </div>
          <div className="sensor-item">
            <div className="sensor-label">围栏状态</div>
            <div className={`sensor-value ${
              rawData?.fenceStatus === 'ALARM' ? 'danger' : 
              rawData?.fenceStatus === 'WARNING' ? 'warning' : 'success'
            }`}>
              {rawData?.fenceStatus === 'ALARM' ? '危险' : 
               rawData?.fenceStatus === 'WARNING' ? '警告' : '安全'}
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
      `}</style>
    </div>
  )
}

export default SensorPanel
