interface DecisionLog {
  timestamp: number
  sensor: string
  data: string
  decision: string
  action: string
}

interface DecisionLogPanelProps {
  logs: DecisionLog[]
}

const DecisionLogPanel = ({ logs }: DecisionLogPanelProps) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}`
  }

  return (
    <div className="panel decision-panel">
      <div className="panel-title">决策过程</div>
      <div className="decision-log-container">
        {logs.length === 0 ? (
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
      `}</style>
    </div>
  )
}

export default DecisionLogPanel
