import { Client } from '@stomp/stompjs'

class WebSocketService {
  private client: Client | null = null
  private static instance: WebSocketService

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService()
    }
    return WebSocketService.instance
  }

  setClient(client: Client) {
    this.client = client
  }

  sendCommand(command: string, data?: any) {
    if (this.client && this.client.connected) {
      this.client.publish({
        destination: '/app/command',
        body: JSON.stringify({ command, data }),
      })
      console.log(`命令已发送: ${command}`, data)
    } else {
      console.warn('WebSocket未连接，无法发送命令')
    }
  }

  sendSensorData(data: any) {
    if (this.client && this.client.connected) {
      this.client.publish({
        destination: '/app/sensor-data',
        body: JSON.stringify(data),
      })
    }
  }
}

export const websocketService = WebSocketService.getInstance()
