# Order System with Notifications

Event-driven system built with Node.js, TypeScript, React, and RabbitMQ following Hexagonal Architecture (Ports & Adapters).

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│                    http://localhost:3000                         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼ HTTP POST /api/orders
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js + TypeScript)                │
│                                                                  │
│  ┌──────────────┐  ┌───────────────┐  ┌───────────────────────┐ │
│  │   Adapters   │  │  Application  │  │        Domain         │ │
│  │  (HTTP, MQ)  │  │ (OrderService)│  │  (Order, Validation)  │ │
│  └──────────────┘  └───────────────┘  └───────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         RabbitMQ                                 │
│                                                                  │
│     [orders] ──────▶ [notifications] ──────▶ [results]          │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Start the entire system
docker-compose up --build

# Or run in background
docker-compose up --build -d
```

## Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | - |
| Backend API | http://localhost:3001 | - |
| RabbitMQ Management | http://localhost:15672 | admin / admin |

## Message Flow

1. **User creates an order** in the frontend
2. **Frontend sends** `POST /api/orders` to backend
3. **Backend publishes** message to `orders` queue
4. **Orders Consumer** processes the order and publishes to `notifications`
5. **Notifications Consumer** simulates email sending and publishes to `results`
6. **Frontend displays** the updated order status

## Project Structure

```
part_2/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.ts                 # Entry point
│       ├── domain/
│       │   └── Order.ts             # Business logic (pure)
│       ├── ports/
│       │   └── MessageBroker.ts     # Interface (contract)
│       ├── adapters/
│       │   ├── RabbitMQAdapter.ts   # Broker implementation
│       │   └── HttpAdapter.ts       # REST API
│       └── application/
│           └── OrderService.ts      # Use case orchestration
└── frontend/
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── App.tsx                  # Main component
        ├── index.css                # Styles
        └── main.tsx                 # Entry point
```

## Hexagonal Architecture

```
                    HEXAGONAL ARCHITECTURE
    ┌──────────────────────────────────────────────────┐
    │                    ADAPTERS                       │
    │  ┌──────────────┐         ┌───────────────────┐  │
    │  │ HttpAdapter  │         │ RabbitMQAdapter   │  │
    │  │  (Express)   │         │    (amqplib)      │  │
    │  └──────┬───────┘         └─────────┬─────────┘  │
    │         │                           │            │
    │         │         PORTS             │            │
    │         │    ┌──────────────┐       │            │
    │         └───▶│MessageBroker │◀──────┘            │
    │              │  interface   │                    │
    │              └──────┬───────┘                    │
    │                     │                            │
    │              APPLICATION                         │
    │         ┌───────────┴──────────┐                 │
    │         │    OrderService      │                 │
    │         └───────────┬──────────┘                 │
    │                     │                            │
    │               DOMAIN (PURE)                      │
    │         ┌───────────┴──────────┐                 │
    │         │  Order, createOrder  │                 │
    │         │  validateOrderInput  │                 │
    │         └──────────────────────┘                 │
    └──────────────────────────────────────────────────┘
```

## Business Rules

- **Simulated pricing**: Each product has a predefined price
- **10% discount**: Applied when quantity > 5
- **Unique order number**: Generated with timestamp
- **Email notification**: Simulated (logged to console)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/orders` | Create new order |
| GET | `/api/orders` | List all orders |
| GET | `/api/orders/:id` | Get order by ID |

### Create Order Example

```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "product": "Laptop",
    "quantity": 3,
    "email": "test@email.com"
  }'
```

## Technologies

- **Backend**: Node.js, TypeScript, Express
- **Frontend**: React, Vite, TypeScript
- **Message Broker**: RabbitMQ
- **Container**: Docker, Docker Compose
- **Architecture**: Hexagonal (Ports & Adapters)
