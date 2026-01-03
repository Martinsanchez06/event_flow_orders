export interface MessageBroker {
  connect(): Promise<void>;
  publish(queue: string, message: unknown): Promise<void>;
  subscribe(queue: string, handler: (message: unknown) => Promise<void>): Promise<void>;
  close(): Promise<void>;
}

