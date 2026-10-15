import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getOrders } from '../services/api';
import '../styles/products.css';

const formatPrice = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(value);

function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    getOrders(controller.signal)
      .then((result) => setOrders(result.orders || []))
      .catch((requestError) => {
        if (controller.signal.aborted) return;
        if (requestError.response?.status === 401) {
          navigate('/login', { replace: true });
          return;
        }
        setError('Unable to load your orders.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [navigate, retry]);

  return (
    <div className="catalog-page">
      <Navbar />
      <main className="catalog-main">
        <header className="catalog-heading">
          <div><p className="catalog-eyebrow">YOUR PURCHASE HISTORY</p><h1>My Orders</h1></div>
        </header>

        {loading && <div className="catalog-message" role="status"><span className="loading-spinner" aria-hidden="true" /><p>Loading your orders...</p></div>}
        {!loading && error && (
          <div className="catalog-message catalog-message-error" role="alert">
            <p>{error}</p>
            <button type="button" className="catalog-retry" onClick={() => { setLoading(true); setError(''); setRetry((value) => value + 1); }}>Try again</button>
          </div>
        )}
        {!loading && !error && orders.length === 0 && (
          <div className="wishlist-empty">
            <h2>You have not placed any orders yet.</h2>
            <button type="button" className="add-to-cart-button" onClick={() => navigate('/products')}>Start shopping</button>
          </div>
        )}
        {!loading && !error && orders.length > 0 && (
          <section className="orders-list" aria-label="Past orders">
            {orders.map((order) => (
              <article className="order-card" key={order._id}>
                <header className="order-card-header">
                  <div><span className="order-card-label">Order</span><strong>#{order._id}</strong></div>
                  <span className={`order-status order-status-${order.status.toLowerCase()}`}>{order.status.replaceAll('_', ' ')}</span>
                </header>
                <p className="order-date">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                <div className="order-card-items">
                  {order.items.map((item, index) => <p key={`${item.product}-${index}`}>{item.name} × {item.quantity}</p>)}
                </div>
                <footer className="order-card-footer">
                  <strong>Total: {formatPrice(order.totalAmount)}</strong>
                  <Link className="product-details-link" to={`/orders/${order._id}`}>View details →</Link>
                </footer>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export default Orders;
