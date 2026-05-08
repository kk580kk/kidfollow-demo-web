interface StatusBarProps {
  status: string
}

const StatusBar = ({ status }: StatusBarProps) => {
  return (
    <div className="panel status-panel">
      <div className="status-content">
        <div className="status-indicator">
          <span className="status-dot" />
          <span className="status-text">{status}</span>
        </div>
        <div className="system-info">
          <span>系统版本: v1.0.0</span>
          <span>核心库: kidfollow-core-lib</span>
          <span>WebSocket: {status.includes('运行') ? '已连接' : '未连接'}</span>
        </div>
      </div>

      <style>{`
        .status-panel {
          padding: 0.75rem 1rem;
        }
        
        .status-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #00ff88;
          box-shadow: 0 0 8px #00ff88;
          animation: pulse 2s infinite;
        }
        
        .status-text {
          font-weight: 600;
          color: #00ff88;
        }
        
        .system-info {
          display: flex;
          gap: 1.5rem;
          font-size: 0.75rem;
          color: #888;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

export default StatusBar
