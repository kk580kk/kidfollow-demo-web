import { useSensorStore } from '../stores/sensorStore'

interface LocalDecisionLog {
  timestamp: number
  sensor: string
  data: string
  decision: string
  action: string
}

interface DecisionLogPanelProps {
  logs: LocalDecisionLog[]
}

const DecisionLogPanel = ({ logs }: DecisionLogPanelProps) => {
  const { backendDecisionLogs, nearestObstacleType, fusedData } = useSensorStore()
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}`
  }

  const obstacleTypeLabel = (type: string | null) => {
    if (!type) return '无'
    const map: Record<string, string> = { rock: '石头', cone: '锥桶', block: '方块' }
    return map[type] || type
  }

  const allLogs = backendDecisionLogs.length > 0 ? backendDecisionLogs : null

  return (
    <div className="panel decision-panel">
      <div className="panel-title">决策过程</div>
      
      {/* 实时决策依据 */}
      <div className="decision-basis">
        <div className="basis-row">
          <span className="basis-label">雷达检测:</span>
          <span className={`basis-value ${fusedData?.nearestObstacleDistance && fusedData.nearestObstacleDistance < 10 ? 'warning' : 'success'}`}>
            {fusedData?.nearestObstacleDistance && fusedData.nearestObstacleDistance < 10 
              ? `发现${obstacleTypeLabel(nearestObstacleType)} @ ${fusedData.nearestObstacleDistance.toFixed(1)}m`
              : '前方畅通'}
          </span>
        </div>
        <div className="basis-row">
          <span className="basis-label">障碍物类型:</span>
          <span className="basis-value type">{obstacleTypeLabel(nearestObstacleType)}</span>
        </div>
      </div>

      <div className="decision-log-container">
        {allLogs ? (
          allLogs.map((log, index) => (
            <div key={index} className="decision-item">
              <div className="decision-header">
                <span className="decision-time">{formatTime(log.timestamp)}</span>
                <span className={`decision-badge badge-${log.type.toLowerCase()}`}>{log.type}</span>
              </div>
              <div className="decision-content">
                <div className="decision-line">
                  <span className="label">速度:</span>
                  <span className="value data">{log.speed.toFixed(1)} km/h</span>
                </div>
                <div className="decision-line">
                  <span className="label">转向:</span>
                  <span className="value data">{log.angle.toFixed(1)}°</span>
                </div>
                <div className="decision-line">
                  <span className="label">结论:</span>
                  <span className="value decision">{log.reason}</span>
                </div>
              </div>
            </div>
          ))
        ) : logs.length === 0 ? (
          <div className="no-logs">等待决策...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="decision-item">
              <div className="decision-header">
                <span className="decision-time">{formatTime(log.timestamp)}</span>
                <span className="decision-sensor">[{log.sensor}]</span>
              </div>
              <div className="decision-content">
                <div className="decision-line">
                  <span className="label">检测:</span>
                  <span className="value data">{log.data}</span>
                </div>
                <div className="decision-line">
                  <span className="label">决策:</span>
                  <span className="value decision">{log.decision}</span>
                </div>
                <div className="decision-line">
                  <span className="label">执行:</span>
                  <span className="value action">{log.action}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .decision-panel {
          margin-top: 1rem;
          max-height: 300px;
          overflow: hidden;
        }

        .decision-log-container {
          max-height: 250px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .no-logs {
          text-align: center;
          color: #888;
          padding: 2rem 0;
          font-size: 0.9rem;
        }

        .decision-item {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          padding: 0.5rem;
          border-left: 3px solid #00d4ff;
          font-size: 0.8rem;
        }

        .decision-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
          padding-bottom: 0.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .decision-time {
          color: #00d4ff;
          font-family: 'Courier New', monospace;
          font-size: 0.75rem;
        }

        .decision-sensor {
          color: #ffa502;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .decision-content {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .decision-line {
          display: flex;
          align-items: flex-start;
          gap: 0.25rem;
        }

        .label {
          color: #888;
          min-width: 2.5rem;
          font-size: 0.75rem;
        }

        .value {
          flex: 1;
          word-break: break-word;
        }

        .value.data {
          color: #ccc;
        }

        .value.decision {
          color: #ffaa00;
          font-weight: 600;
        }

        .value.action {
          color: #00ff00;
          font-weight: 600;
        }

        .decision-log-container::-webkit-scrollbar {
          width: 4px;
        }

        .decision-log-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }

        .decision-log-container::-webkit-scrollbar-thumb {
          background: rgba(0, 212, 255, 0.3);
          border-radius: 2px;
        }

        .decision-basis {
          margin-bottom: 0.75rem;
          padding: 0.5rem;
          background: rgba(0, 212, 255, 0.08);
          border-radius: 6px;
          border: 1px solid rgba(0, 212, 255, 0.2);
        }

        .basis-row {
          display: flex;
          gap: 0.5rem;
          padding: 0.25rem 0;
          font-size: 0.78rem;
        }

        .basis-label {
          color: #888;
          min-width: 4.5rem;
          font-weight: 600;
        }

        .basis-value {
          font-weight: 600;
        }

        .basis-value.warning { color: #ffaa00; }
        .basis-value.success { color: #00ff88; }
        .basis-value.type { color: #00d4ff; }

        .decision-badge {
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 0.65rem;
          font-weight: 700;
        }

        .badge-follow { background: rgba(0, 255, 136, 0.2); color: #00ff88; }
        .badge-avoid { background: rgba(255, 170, 0, 0.2); color: #ffaa00; }
        .badge-stop { background: rgba(255, 71, 87, 0.2); color: #ff4757; }
        .badge-anchor { background: rgba(0, 212, 255, 0.2); color: #00d4ff; }
        .badge-return { background: rgba(168, 130, 255, 0.2); color: #a882ff; }
      `}</style>
    </div>
  )
}

export default DecisionLogPanel
