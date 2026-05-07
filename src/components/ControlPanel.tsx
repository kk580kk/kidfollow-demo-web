import { useSensorStore } from '../stores/sensorStore'
import type { DecisionType } from '../types'

const ControlPanel = () => {
  const { currentDecision, vehicleState, fusedData, isConnected } = useSensorStore()

  const sendCommand = (type: DecisionType) => {
    // 这里应该通过WebSocket发送控制命令
    console.log(`发送命令: ${type}`)
  }

  const getModeColor = (mode: DecisionType) => {
    switch (mode) {
      case 'FOLLOW': return 'success'
      case 'AVOID': return 'warning'
      case 'RETURN': return 'info'
      case 'STOP': return 'danger'
      case 'ANCHOR': return 'warning'
      default: return 'info'
    }
  }

  const getModeText = (mode: DecisionType) => {
    switch (mode) {
      case 'FOLLOW': return '跟随模式'
      case 'AVOID': return '避障模式'
      case 'RETURN': return '返航模式'
      case 'STOP': return '紧急制动'
      case 'ANCHOR': return '锚定模式'
      default: return '未知模式'
    }
  }

  return (
    <div className="panel">
      <div className="panel-title">控制面板</div>
      
      {/* 当前决策状态 */}
      <div className="control-section">
        <div className="current-status">
          <div className="status-label">当前模式</div>
          <div className={`status-badge ${getModeColor(vehicleState.mode)}`}>
            {getModeText(vehicleState.mode)}
          </div>
        </div>
        
        {currentDecision && (
          <div className="decision-info">
            <div className="decision-reason">{currentDecision.reason}</div>
            <div className="decision-params">
              <span>速度: {currentDecision.speed}km/h</span>
              <span>转向: {currentDecision.angle}°</span>
            </div>
          </div>
        )}
      </div>

      {/* 手动控制按钮 */}
      <div className="control-section">
        <div className="control-section-title">手动控制</div>
        <div className="control-buttons">
          <button 
            className="btn btn-success control-btn"
            onClick={() => sendCommand('FOLLOW')}
            disabled={!isConnected}
          >
            <span className="btn-icon">🚗</span>
            跟随模式
          </button>
          <button 
            className="btn btn-warning control-btn"
            onClick={() => sendCommand('AVOID')}
            disabled={!isConnected}
          >
            <span className="btn-icon">⚠️</span>
            避障模式
          </button>
          <button 
            className="btn btn-primary control-btn"
            onClick={() => sendCommand('RETURN')}
            disabled={!isConnected}
          >
            <span className="btn-icon">🏠</span>
            返航模式
          </button>
          <button 
            className="btn btn-danger control-btn"
            onClick={() => sendCommand('STOP')}
            disabled={!isConnected}
          >
            <span className="btn-icon">🛑</span>
            紧急制动
          </button>
        </div>
      </div>

      {/* 系统参数 */}
      <div className="control-section">
        <div className="control-section-title">系统参数</div>
        <div className="param-list">
          <div className="param-item">
            <span className="param-label">避障距离</span>
            <span className="param-value">3.0m</span>
          </div>
          <div className="param-item">
            <span className="param-label">跟随距离</span>
            <span className="param-value">2.0m</span>
          </div>
          <div className="param-item">
            <span className="param-label">最大转向角</span>
            <span className="param-value">±45°</span>
          </div>
          <div className="param-item">
            <span className="param-label">最大速度</span>
            <span className="param-value">6km/h</span>
          </div>
          <div className="param-item">
            <span className="param-label">超声波阈值</span>
            <span className="param-value">30cm</span>
          </div>
        </div>
      </div>

      {/* 快速状态 */}
      <div className="control-section">
        <div className="control-section-title">状态指示</div>
        <div className="quick-status">
          <div className={`status-item ${fusedData?.frontCollisionRisk ? 'danger' : 'success'}`}>
            <span className="status-dot" />
            前向安全
          </div>
          <div className={`status-item ${fusedData?.rearCollisionRisk ? 'danger' : 'success'}`}>
            <span className="status-dot" />
            后向安全
          </div>
          <div className={`status-item ${fusedData?.groundHoleDetected ? 'danger' : 'success'}`}>
            <span className="status-dot" />
            地面安全
          </div>
          <div className={`status-item ${fusedData?.childDetected ? 'success' : 'warning'}`}>
            <span className="status-dot" />
            目标检测
          </div>
        </div>
      </div>

      <style jsx>{`
        .control-section {
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }
        
        .control-section-title {
          font-size: 0.85rem;
          color: #00d4ff;
          margin-bottom: 0.75rem;
          font-weight: 600;
        }
        
        .current-status {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }
        
        .status-label {
          font-size: 0.8rem;
          color: #888;
        }
        
        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        
        .status-badge.success { background: rgba(0, 255, 136, 0.2); color: #00ff88; }
        .status-badge.warning { background: rgba(255, 170, 0, 0.2); color: #ffaa00; }
        .status-badge.danger { background: rgba(255, 71, 87, 0.2); color: #ff4757; }
        .status-badge.info { background: rgba(0, 212, 255, 0.2); color: #00d4ff; }
        
        .decision-info {
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 6px;
        }
        
        .decision-reason {
          font-size: 0.85rem;
          color: #ccc;
          margin-bottom: 0.5rem;
        }
        
        .decision-params {
          display: flex;
          gap: 1rem;
          font-size: 0.8rem;
          color: #00d4ff;
        }
        
        .control-buttons {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }
        
        .control-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
        }
        
        .btn-icon {
          font-size: 1.5rem;
        }
        
        .param-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .param-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
        }
        
        .param-label {
          font-size: 0.8rem;
          color: #888;
        }
        
        .param-value {
          font-family: 'Courier New', monospace;
          font-weight: 600;
          color: #00d4ff;
        }
        
        .quick-status {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }
        
        .status-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border-radius: 6px;
