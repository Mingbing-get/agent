import { Transport } from '@modelcontextprotocol/sdk/shared/transport'

export default class TransportManager<T extends Transport> {
  private transports: Map<string, T> = new Map()
  private cleanupInterval: number = 60 * 60 * 1000 // 1h

  private timoutMap: Map<string, NodeJS.Timeout> = new Map()

  addTransport(id: string, transport: T) {
    this.transports.set(id, transport)

    this.addTimeout(id)
  }

  getTransport(id: string): T | undefined {
    const transport = this.transports.get(id)

    const timeoutId = this.timoutMap.get(id)
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    this.addTimeout(id)

    return transport
  }

  private addTimeout(id: string) {
    this.timoutMap.set(
      id,
      setTimeout(() => {
        this.transports.get(id)?.close()
        this.transports.delete(id)
        this.timoutMap.delete(id)
      }, this.cleanupInterval),
    )
  }
}
