import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CartItem from '../components/CartItem';
import { useCart } from '../context/useCart';
import '../styles/products.css';

const formatPrice = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(value);

function Cart() {
  const navigate = useNavigate();
  const [openingCheckout, setOpeningCheckout] = useState(false);
  const { cartItems, cartCount, subtotal, loading, error, errorStatus, refreshCart } = useCart();

  const handleCheckout = async () => {
    setOpeningCheckout(true);
    const refreshed = await refreshCart();
    setOpeningCheckout(false);
    if (refreshed) navigate('/checkout');
  };

  useEffect(() => {
    if (!loading && errorStatus === 401) {
      navigate('/login', { replace: true });
    }
  }, [loading, errorStatus, navigate]);

  return (
    <div className="catalog-page">
      <Navbar />
      <main className="cart-page-main">
        <header className="catalog-heading">
          <div>
            <p className="catalog-eyebrow">READY WHEN YOU ARE</p>
            <h1>My Cart</h1>
            {!loading && !error && (
              <p className="catalog-subtitle">
                {cartCount} {cartCount === 1 ? 'item' : 'items'} in your cart
              </p>
            )}
          </div>
        </header>

        {loading && (
          <div className="catalog-message" role="status">
            <span className="loading-spinner" aria-hidden="true" />
            <p>Loading your cart...</p>
          </div>
        )}

        {!loading && error && errorStatus !== 401 && (
          <div className="catalog-message catalog-message-error" role="alert">
            <p className="empty-title">Unable to load your cart.</p>
            <p>{error}</p>
            <button type="button" className="catalog-retry" onClick={refreshCart}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && cartItems.length === 0 && (
          <div className="wishlist-empty">
            <span className="wishlist-empty-heart cart-empty-icon" aria-hidden="true">🛒</span>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything yet.</p>
            <button type="button" className="add-to-cart-button" onClick={() => navigate('/products')}>
              Browse products
            </button>
          </div>
        )}

        {!loading && !error && cartItems.length > 0 && (
          <div className="cart-layout">
            <section className="cart-items-list" aria-label="Cart items">
              {cartItems.map((item) => (
                <CartItem key={item.product._id} item={item} />
              ))}
            </section>
            <aside className="order-summary">
              <p className="catalog-eyebrow">SUMMARY</p>
              <h2>Order summary</h2>
              <div className="summary-row">
                <span>Items</span>
                <span>{cartCount}</span>
              </div>
              <div className="summary-row summary-total">
                <span>Subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <button
                type="button"
                className="add-to-cart-button checkout-button"
                onClick={handleCheckout}
                disabled={openingCheckout}
              >
                {openingCheckout ? 'Refreshing cart...' : 'Proceed to Checkout'}
              </button>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default Cart;
