import amqp, { Channel, ChannelModel } from 'amqplib';
import { MessageBroker } from '../ports/MessageBroker';

export class RabbitMQAdapter implements MessageBroker {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  async connect(): Promise<void> {
    const maxRetries = 10;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        console.log(`Connecting to RabbitMQ... (attempt ${retries + 1})`);
        this.connection = await amqp.connect(this.url);
        this.channel = await this.connection.createChannel();
        console.log('Connected to RabbitMQ successfully');
        return;
      } catch (error) {
        retries++;
        console.log(`Error connecting to RabbitMQ, retrying in 3s...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    throw new Error('Could not connect to RabbitMQ after multiple attempts');
  }

  async publish(queue: string, message: unknown): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }
    await this.channel.assertQueue(queue, { durable: true });
    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });
    console.log(`Message published to queue "${queue}":`, message);
  }

  async subscribe(queue: string, handler: (message: unknown) => Promise<void>): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }
    await this.channel.assertQueue(queue, { durable: true });
    await this.channel.consume(queue, async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          await handler(content);
          this.channel?.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error);
          this.channel?.nack(msg, false, false);
        }
      }
    });
    console.log(`Subscribed to queue "${queue}"`);
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}
