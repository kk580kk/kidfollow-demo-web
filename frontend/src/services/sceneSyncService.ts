import { Client } from '@stomp/stompjs'

/**
 * 场景同步服务
 * 将前端3D场景状态同步到后端
 */
class SceneSyncService {
  private client: Client | null = null
  private sceneData: any = null
  private sendInterval: NodeJS.Timeout | null = null
  private messageCount = { sent: 0, received: 0, errors: 0 }

  setClient(client: Client) {
    this.client = client
  }

  /**
   * 更新场景数据
   */
  updateSceneData(data: {
    vehicle?: {
      position: [number, number, number]
      rotation: number
    }
    target?: {
      position: [number, number, number]
      detected: boolean
    }
    obstacles?: Array<{
      position: [number, number, number]
      type: string
    }>
  }) {
    this.sceneData = data
  }

  /**
   * 开始发送场景数据
   */
  startSync(interval = 100) {
    if (this.sendInterval) {
      clearInterval(this.sendInterval)
    }

    this.sendInterval = setInterval(() => {
      this.sendSceneUpdate()
    }, interval)
  }

  /**
   * 停止发送
   */
  stopSync() {
    if (this.sendInterval) {
      clearInterval(this.sendInterval)
      this.sendInterval = null
    }
  }

  /**
   * 发送场景更新
   */
  private sendSceneUpdate() {
    if (!this.client || !this.client.connected || !this.sceneData) {
      return
    }

    try {
      this.client.publish({
        destination: '/app/scene-update',
        body: JSON.stringify(this.sceneData)
      })
      this.messageCount.sent++
    } catch (e) {
      console.error('发送场景数据失败:', e)
      this.messageCount.errors++
    }
  }

  /**
   * 获取通信统计
   */
  getStats() {
    const successRate = this.messageCount.sent > 0
      ? ((this.messageCount.sent - this.messageCount.errors) / this.messageCount.sent * 100).toFixed(2)
      : '100.00'

    return {
      sent: this.messageCount.sent,
      received: this.messageCount.received,
      errors: this.messageCount.errors,
      successRate: `${successRate}%`,
      isHealthy: parseFloat(successRate) >= 99.0
    }
  }

  /**
   * 重置统计
   */
  resetStats() {
    this.messageCount = { sent: 0, received: 0, errors: 0 }
  }

  /**
   * 记录接收消息
   */
  recordReceived() {
    this.messageCount.received++
  }
}

export const sceneSyncService = new SceneSyncService()
