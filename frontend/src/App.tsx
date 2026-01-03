import { useState, useEffect, useCallback } from 'react';

interface Order {
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
  createdAt: string;
}

interface OrderForm {
  product: string;
  quantity: number;
  email: string;
}

interface ApiError {
  message: string;
  type: 'validation' | 'network' | 'server';
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const PRODUCTS = [
  { name: 'Laptop', price: 999, icon: '💻' },
  { name: 'Phone', price: 599, icon: '📱' },
  { name: 'Tablet', price: 449, icon: '📟' },
  { name: 'Monitor', price: 299, icon: '🖥️' },
  { name: 'Keyboard', price: 89, icon: '⌨️' },
  { name: 'Mouse', price: 49, icon: '🖱️' },
];

function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState<OrderForm>({
    product: 'Laptop',
    quantity: 1,
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/orders`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 2000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.custom-select')) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side validation
    if (!form.email || !form.email.includes('@')) {
      setError({ message: 'Please enter a valid email address', type: 'validation' });
      setLoading(false);
      return;
    }

    if (form.quantity < 1 || form.quantity > 1000) {
      setError({ message: 'Quantity must be between 1 and 1000', type: 'validation' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError({ 
          message: data.error || 'Failed to create order', 
          type: 'server' 
        });
        return;
      }

      setForm({ product: 'Laptop', quantity: 1, email: '' });
      await fetchOrders();
    } catch (err) {
      setError({ 
        message: 'Unable to connect to server. Please check your connection.', 
        type: 'network' 
      });
    } finally {
      setLoading(false);
    }
  };

  const dismissError = () => setError(null);

  const selectedProduct = PRODUCTS.find(p => p.name === form.product);
  const subtotal = (selectedProduct?.price || 0) * form.quantity;
  const hasDiscount = form.quantity > 5;
  const discount = hasDiscount ? subtotal * 0.1 : 0;
  const estimatedTotal = subtotal - discount;

  return (
    <div className="app">
      <header className="header">
        <h1>Order System</h1>
        <p>Event-Driven Architecture with RabbitMQ</p>
      </header>

      <main className="main">
        <section className="form-section">
          <h2>New Order</h2>
          
          <form onSubmit={handleSubmit} className="order-form">
            <div className="form-group">
              <label>Product</label>
              <div className="custom-select">
                <button
                  type="button"
                  className="select-trigger"
                  onClick={() => setShowProductDropdown(!showProductDropdown)}
                >
                  <span className="select-value">
                    <span className="product-icon">{selectedProduct?.icon}</span>
                    <span className="product-name">{selectedProduct?.name}</span>
                    <span className="product-price">${selectedProduct?.price}</span>
                  </span>
                  <span className={`select-arrow ${showProductDropdown ? 'open' : ''}`}>
                    ▼
                  </span>
                </button>
                
                {showProductDropdown && (
                  <div className="select-dropdown">
                    {PRODUCTS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        className={`select-option ${form.product === p.name ? 'selected' : ''}`}
                        onClick={() => {
                          setForm({ ...form, product: p.name });
                          setShowProductDropdown(false);
                        }}
                      >
                        <span className="product-icon">{p.icon}</span>
                        <span className="product-name">{p.name}</span>
                        <span className="product-price">${p.price}</span>
                        {form.product === p.name && <span className="check-mark">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="quantity">Quantity</label>
              <input
                type="number"
                id="quantity"
                min="1"
                max="1000"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
              />
              {hasDiscount && (
                <span className="discount-badge">🎉 10% discount applied!</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">Notification Email</label>
              <input
                type="email"
                id="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="price-preview">
              <div className="price-row">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {hasDiscount && (
                <div className="price-row discount">
                  <span>Discount (10%):</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="price-row total">
                <span>Total:</span>
                <span>${estimatedTotal.toFixed(2)}</span>
              </div>
            </div>

            {error && (
              <div className={`error-toast ${error.type}`}>
                <div className="error-icon">
                  {error.type === 'validation' && '⚠️'}
                  {error.type === 'network' && '🔌'}
                  {error.type === 'server' && '❌'}
                </div>
                <div className="error-content">
                  <span className="error-title">
                    {error.type === 'validation' && 'Validation Error'}
                    {error.type === 'network' && 'Connection Error'}
                    {error.type === 'server' && 'Server Error'}
                  </span>
                  <span className="error-message">{error.message}</span>
                </div>
                <button type="button" className="error-dismiss" onClick={dismissError}>
                  ✕
                </button>
              </div>
            )}

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                'Place Order'
              )}
            </button>
          </form>
        </section>

        <section className="orders-section">
          <h2>Orders ({orders.length})</h2>
          
          {orders.length === 0 ? (
            <div className="empty-state">
              <p>No orders yet</p>
              <span>Create your first order!</span>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order.id} className={`order-card ${order.status}`}>
                  <div className="order-header">
                    <span className="order-number">{order.orderNumber}</span>
                    <span className={`status-badge ${order.status}`}>
                      {order.status === 'processed' ? '✓ Processed' : 
                       order.status === 'error' ? '✗ Error' : '⏳ Pending'}
                    </span>
                  </div>
                  
                  <div className="order-body">
                    <div className="order-product">
                      <strong>{order.product}</strong>
                      <span>× {order.quantity}</span>
                    </div>
                    
                    <div className="order-details">
                      <div className="detail-row">
                        <span>Unit Price:</span>
                        <span>${order.unitPrice}</span>
                      </div>
                      {order.discount > 0 && (
                        <div className="detail-row discount">
                          <span>Discount:</span>
                          <span>-${order.discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="detail-row total">
                        <span>Total:</span>
                        <span>${order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {order.notification && (
                    <div className="order-notification">
                      📧 {order.notification}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>Hexagonal Architecture • RabbitMQ • React • TypeScript</p>
      </footer>
    </div>
  );
}

export default App;
