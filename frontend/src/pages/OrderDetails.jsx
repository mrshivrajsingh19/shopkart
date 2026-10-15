import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getOrderById } from '../services/api';
import '../styles/products.css';

const formatPrice = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(value);

function OrderDetails({ success = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loadedOrder, setLoadedOrder] = useState({ id: null, order: null, error: '' });
  const loading = loadedOrder.id !== id;
  const order = loading ? null : loadedOrder.order;
  const error = loading ? '' : loadedOrder.error;

  useEffect(() => {
    const controller = new AbortController();
    getOrderById(id, controller.signal)
      .then((result) => setLoadedOrder({ id, order: result.order, error: '' }))
      .catch((requestError) => {
        if (controller.signal.aborted) return;
        if (requestError.response?.status === 401) {
          navigate('/login', { replace: true });
          return;
        }
        setLoadedOrder({ id, order: null, error: requestError.response?.data?.message || 'Unable to load this order.' });
      });

    return () => controller.abort();
  }, [id, navigate]);

  return (
    <div className="catalog-page">
      <Navbar />
      <main className="product-detail-main">
        {loading && <div className="catalog-message" role="status"><span className="loading-spinner" aria-hidden="true" /><p>Loading order...</p></div>}
        {!loading && error && <div className="catalog-message catalog-message-error" role="alert"><p>{error}</p><Link className="product-details-link" to="/orders">Back to my orders</Link></div>}
        {!loading && !error && order && (
          <article className="order-detail-panel">
            {success && <p className="order-success-banner">✓ Order placed successfully</p>}
            <p className="catalog-eyebrow">ORDER DETAILS</p>
            <h1>Order #{order._id}</h1>
            <p className="order-date">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
            <span className="order-status">{order.status.replaceAll('_', ' ')}</span>

            <section className="order-snapshot-list" aria-label="Ordered products">
              {order.items.map((item, index) => (
                <article className="order-snapshot-item" key={`${item.product}-${index}`}>
                  {item.image && <img src={item.image} alt={item.name} onError={(event) => { event.currentTarget.hidden = true; }} />}
                  <div><strong>{item.name}</strong><p>{formatPrice(item.price)} × {item.quantity}</p></div>
                  <strong>{formatPrice(item.price * item.quantity)}</strong>
                </article>
              ))}
            </section>

            <div className="summary-row summary-total"><span>Total paid</span><strong>{formatPrice(order.totalAmount)}</strong></div>
            <section className="order-address">
              <h2>Shipping address</h2>
              <p>{order.shippingAddress.fullName} · {order.shippingAddress.phone}</p>
              <p>{order.shippingAddress.addressLine1}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
            </section>
            <nav className="order-detail-actions">
              <Link className="product-details-link" to="/orders">View my orders →</Link>
              <button type="button" className="catalog-retry" onClick={() => navigate('/products')}>Continue shopping</button>
            </nav>
          </article>
        )}
      </main>
    </div>
  );
}

export default OrderDetails;
