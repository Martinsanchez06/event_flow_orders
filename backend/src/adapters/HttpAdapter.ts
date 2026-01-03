import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { OrderService } from '../application/OrderService';
import { OrderInput } from '../domain/Order';

export class HttpAdapter {
  private app: Application;
  private orderService: OrderService;
  private port: number;

  constructor(orderService: OrderService, port: number) {
    this.app = express();
    this.orderService = orderService;
    this.port = port;

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Create new order
    this.app.post('/api/orders', async (req: Request, res: Response) => {
      try {
        const input: OrderInput = req.body;
        const result = await this.orderService.submitOrder(input);

        if ('error' in result) {
          res.status(400).json(result);
          return;
        }

        res.status(201).json(result);
      } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Get all orders
    this.app.get('/api/orders', (_req: Request, res: Response) => {
      const orders = this.orderService.getAllOrders();
      res.json(orders);
    });

    // Get order by ID
    this.app.get('/api/orders/:id', (req: Request, res: Response) => {
      const order = this.orderService.getOrder(req.params.id);
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      res.json(order);
    });
  }

  start(): void {
    this.app.listen(this.port, () => {
      console.log(`🚀 HTTP Server listening on port ${this.port}`);
    });
  }
}
