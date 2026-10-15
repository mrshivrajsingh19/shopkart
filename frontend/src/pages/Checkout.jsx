import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useCart } from '../context/useCart';
import { createPaymentOrder, verifyPayment } from '../services/api';
import '../styles/products.css';

const initialAddress = {
  fullName: '',
  phone: '',
  addressLine1: '',
  city: '',
  state: '',
  pincode: '',
};

const formatPrice = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(value);

const loadRazorpayScript = () => new Promise((resolve) => {
  if (window.Razorpay) {
    resolve(true);
    return;
  }

  const existing = document.querySelector('script[data-razorpay-checkout]');
  if (existing) {
    existing.addEventListener('load', () => resolve(Boolean(window.Razorpay)), { once: true });
    existing.addEventListener('error', () => resolve(false), { once: true });
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.dataset.razorpayCheckout = 'true';
  script.onload = () => resolve(Boolean(window.Razorpay));
  script.onerror = () => {
    script.remove();
    resolve(false);
  };
  document.body.appendChild(script);
});

function Checkout() {
  const navigate = useNavigate();
  const { cartItems, cartCount, subtotal, loading, errorStatus, refreshCart, clearCart } = useCart();
  const [address, setAddress] = useState(initialAddress);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const validate = () => {
    const nextErrors = {};
    for (const [field, value] of Object.entries(address)) {
      if (!value.trim()) nextErrors[field] = 'This field is required.';
    }
    const phoneDigits = address.phone.replace(/\D/g, '');
    if (address.phone.trim() && (phoneDigits.length < 10 || phoneDigits.length > 15)) {
      nextErrors.phone = 'Enter a valid phone number.';
    }
    if (address.pincode.trim() && !/^\d{6}$/.test(address.pincode.trim())) {
      nextErrors.pincode = 'Pincode must contain 6 digits.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setAddress((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setFormError('');
  };

  const handlePaymentSuccess = async (paymentResponse, shopKartOrderId) => {
    setVerifying(true);
    setFormError('');
    try {
      const result = await verifyPayment({
        shopKartOrderId,
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
      });
      const refreshed = await refreshCart();
      if (!refreshed) clearCart();
      navigate(`/order-success/${result.order._id}`, { replace: true });
    } catch (error) {
      setFormError(error.response?.data?.message || 'Payment verification failed. Your cart has not been cleared. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    if (!validate()) return;

    setPlacing(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Unable to load Razorpay Checkout. Check your connection and try again.');
      }

      const result = await createPaymentOrder(address);
      const payment = new window.Razorpay({
        key: result.key,
        amount: result.amount,
        currency: result.currency,
        name: 'ShopKart',
        description: 'ShopKart purchase',
        order_id: result.razorpayOrderId,
        prefill: { name: address.fullName, contact: address.phone },
        handler: (response) => {
          setPlacing(false);
          handlePaymentSuccess(response, result.shopKartOrderId);
        },
        modal: {
          ondismiss: () => setPlacing(false),
        },
      });

      payment.on('payment.failed', (response) => {
        setFormError(response.error?.description || 'Payment failed. Your cart is unchanged. Please try again.');
        setPlacing(false);
      });

      payment.open();
    } catch (error) {
      setFormError(error.response?.data?.message || error.message || 'Unable to start checkout. Please try again.');
      setPlacing(false);
    }
  };

  useEffect(() => {
    if (errorStatus === 401) navigate('/login', { replace: true });
  }, [errorStatus, navigate]);

  return (
    <div className="catalog-page">
      <Navbar />
      <main className="checkout-main">
        <Link className="back-to-products" to="/cart">← Back to cart</Link>
        <header className="catalog-heading">
          <div>
            <p className="catalog-eyebrow">SECURE TEST CHECKOUT</p>
            <h1>Checkout</h1>
            <p className="catalog-subtitle">Confirm delivery details and review your order.</p>
          </div>
        </header>

        {loading && <div className="catalog-message" role="status"><span className="loading-spinner" aria-hidden="true" /><p>Loading your cart...</p></div>}

        {!loading && cartItems.length === 0 && (
          <div className="wishlist-empty">
            <h2>Your cart is empty</h2>
            <p>Add products before starting checkout.</p>
            <button type="button" className="add-to-cart-button" onClick={() => navigate('/products')}>Browse products</button>
          </div>
        )}

        {!loading && cartItems.length > 0 && (
          <form className="checkout-layout" onSubmit={handleSubmit} noValidate>
            <section className="checkout-panel">
              <p className="catalog-eyebrow">DELIVERY</p>
              <h2>Shipping details</h2>
              <div className="checkout-fields">
                {[
                  ['fullName', 'Full name', 'text'],
                  ['phone', 'Phone number', 'tel'],
                  ['addressLine1', 'Address line', 'text'],
                  ['city', 'City', 'text'],
                  ['state', 'State', 'text'],
                  ['pincode', 'Pincode', 'text'],
                ].map(([name, label, type]) => (
                  <label className={`checkout-field ${errors[name] ? 'has-error' : ''}`} key={name}>
                    <span>{label}</span>
                    <input
                      name={name}
                      type={type}
                      value={address[name]}
                      onChange={handleChange}
                      autoComplete={name === 'fullName' ? 'name' : name === 'phone' ? 'tel' : 'off'}
                      inputMode={name === 'phone' || name === 'pincode' ? 'numeric' : undefined}
                      maxLength={name === 'pincode' ? 6 : undefined}
                    />
                    {errors[name] && <small>{errors[name]}</small>}
                  </label>
                ))}
              </div>
            </section>

            <aside className="order-summary checkout-summary">
              <p className="catalog-eyebrow">REVIEW</p>
              <h2>Order summary</h2>
              <div className="checkout-summary-items">
                {cartItems.map(({ product, quantity }) => (
                  <div className="checkout-summary-item" key={product._id}>
                    <span>{product.name} × {quantity}</span>
                    <strong>{formatPrice(product.price * quantity)}</strong>
                  </div>
                ))}
              </div>
              <div className="summary-row"><span>Items</span><span>{cartCount}</span></div>
              <div className="summary-row summary-total"><span>Total</span><strong>{formatPrice(subtotal)}</strong></div>
              {formError && <p className="checkout-error" role="alert">{formError}</p>}
              <button type="submit" className="add-to-cart-button checkout-button" disabled={placing || verifying}>
                {verifying ? 'Verifying payment...' : placing ? 'Preparing payment...' : 'Place Order'}
              </button>
              <p className="checkout-test-note">Razorpay Test Mode only. No real payment will be taken.</p>
            </aside>
          </form>
        )}
      </main>
    </div>
  );
}

export default Checkout;
