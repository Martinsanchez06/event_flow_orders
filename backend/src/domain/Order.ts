import { v4 as uuidv4 } from 'uuid';

export interface OrderInput {
  product: string;
  quantity: number;
  email: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  product: string;
  quantity: number;
  email: string;
  unitPrice: number;
  subtotal: number;
  discount: number;
  total: number;
  status: 'pending' | 'processed' | 'error';
  notification?: string;
  createdAt: Date;
}

// Simulated product prices
const PRODUCT_PRICES: Record<string, number> = {
  laptop: 999,
  phone: 599,
  tablet: 449,
  monitor: 299,
  keyboard: 89,
  mouse: 49,
};

const DEFAULT_PRICE = 99;
const MIN_QUANTITY_FOR_DISCOUNT = 5;
const DISCOUNT_PERCENTAGE = 0.10;

export function createOrder(input: OrderInput): Order {
  const id = uuidv4();
  const orderNumber = `#ORD-${Date.now().toString().slice(-6)}`;
  
  const unitPrice = PRODUCT_PRICES[input.product.toLowerCase()] || DEFAULT_PRICE;
  const subtotal = unitPrice * input.quantity;
  
  // Apply 10% discount if quantity > 5
  const hasDiscount = input.quantity > MIN_QUANTITY_FOR_DISCOUNT;
  const discount = hasDiscount ? subtotal * DISCOUNT_PERCENTAGE : 0;
  const total = subtotal - discount;

  return {
    id,
    orderNumber,
    product: input.product,
    quantity: input.quantity,
    email: input.email,
    unitPrice,
    subtotal,
    discount,
    total,
    status: 'pending',
    createdAt: new Date(),
  };
}

export function validateOrderInput(input: OrderInput): string | null {
  if (!input.product || input.product.trim().length === 0) {
    return 'Product is required';
  }
  if (!input.quantity || input.quantity < 1) {
    return 'Quantity must be greater than 0';
  }
  if (!input.email || !input.email.includes('@')) {
    return 'Invalid email';
  }
  return null;
}
