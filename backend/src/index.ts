import { RabbitMQAdapter } from './adapters/RabbitMQAdapter';
import { HttpAdapter } from './adapters/HttpAdapter';
import { OrderService, QUEUES } from './application/OrderService';
import { Order } from './domain/Order';

async function main() {
  const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672';
  const port = parseInt(process.env.PORT || '3001');

  console.log('════════════════════════════════════════════');
  console.log('   🛒 ORDER SYSTEM WITH NOTIFICATIONS');
  console.log('════════════════════════════════════════════\n');

  // Initialize RabbitMQ adapter
  const messageBroker = new RabbitMQAdapter(rabbitUrl);
  await messageBroker.connect();

  // Initialize order service
  const orderService = new OrderService(messageBroker);

  // Setup consumers
  await messageBroker.subscribe(QUEUES.ORDERS, async (message) => {
    await orderService.processOrder(message as Order);
  });

  await messageBroker.subscribe(QUEUES.NOTIFICATIONS, async (message) => {
    await orderService.processNotification(message as {
      orderId: string;
      orderNumber: string;
      email: string;
      product: string;
      quantity: number;
      total: number;
      discount: number;
    });
  });

  // Results consumer (logging only)
  await messageBroker.subscribe(QUEUES.RESULTS, async (message) => {
    console.log('📋 Final result processed:', message);
  });

  // Start HTTP server
  const httpAdapter = new HttpAdapter(orderService, port);
  httpAdapter.start();

  console.log('\n✨ System ready to receive orders\n');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
