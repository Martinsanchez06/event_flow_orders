import { Order, OrderInput, createOrder, validateOrderInput } from '../domain/Order';
import { MessageBroker } from '../ports/MessageBroker';

export const QUEUES = {
  ORDERS: 'orders',
  NOTIFICATIONS: 'notifications',
  RESULTS: 'results',
} as const;

export class OrderService {
  private broker: MessageBroker;
  private ordersStore: Map<string, Order> = new Map();

  constructor(broker: MessageBroker) {
    this.broker = broker;
  }

  async submitOrder(input: OrderInput): Promise<Order | { error: string }> {
    const validationError = validateOrderInput(input);
    if (validationError) {
      return { error: validationError };
    }

    const order = createOrder(input);
    this.ordersStore.set(order.id, order);

    await this.broker.publish(QUEUES.ORDERS, order);
    return order;
  }

  async processOrder(order: Order): Promise<void> {
    console.log(`\n📦 Processing order ${order.orderNumber}...`);
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 500));

    const processedOrder: Order = {
      ...order,
      status: 'processed',
    };

    this.ordersStore.set(order.id, processedOrder);

    // Publish to notifications queue
    await this.broker.publish(QUEUES.NOTIFICATIONS, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      email: order.email,
      product: order.product,
      quantity: order.quantity,
      total: order.total,
      discount: order.discount,
    });

    console.log(`✅ Order ${order.orderNumber} processed - Total: $${order.total}`);
  }

  async processNotification(notification: {
    orderId: string;
    orderNumber: string;
    email: string;
    product: string;
    quantity: number;
    total: number;
    discount: number;
  }): Promise<void> {
    console.log(`\n📧 Sending notification to ${notification.email}...`);

    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 300));

    console.log(`═══════════════════════════════════════════`);
    console.log(`📬 EMAIL SENT`);
    console.log(`   To: ${notification.email}`);
    console.log(`   Subject: Order ${notification.orderNumber} confirmed`);
    console.log(`   Product: ${notification.product} x${notification.quantity}`);
    console.log(`   Total: $${notification.total}${notification.discount > 0 ? ` (discount: $${notification.discount.toFixed(2)})` : ''}`);
    console.log(`═══════════════════════════════════════════\n`);

    const order = this.ordersStore.get(notification.orderId);
    if (order) {
      order.notification = `Email sent to ${notification.email}`;
      this.ordersStore.set(notification.orderId, order);
    }

    // Publish final result
    await this.broker.publish(QUEUES.RESULTS, {
      orderId: notification.orderId,
      orderNumber: notification.orderNumber,
      product: notification.product,
      quantity: notification.quantity,
      unitPrice: order?.unitPrice,
      total: notification.total,
      discount: notification.discount,
      status: 'processed',
      notification: `Email sent to ${notification.email}`,
    });
  }

  getOrder(id: string): Order | undefined {
    return this.ordersStore.get(id);
  }

  getAllOrders(): Order[] {
    return Array.from(this.ordersStore.values());
  }
}
