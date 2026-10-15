import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import WishlistCard from '../components/WishlistCard';
import { getWishlist } from '../services/api';
import '../styles/products.css';

function Wishlist() {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const loadWishlist = async () => {
      setLoading(true);
      setError(false);
      try {
        const result = await getWishlist(controller.signal);
        setWishlist(result.wishlist || []);
      } catch (requestError) {
        if (controller.signal.aborted) return;
        if (requestError.response?.status === 401) {
          navigate('/login', { replace: true });
          return;
        }
        setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadWishlist();
    return () => controller.abort();
  }, [navigate, reload]);

  const handleRemoved = (productId) => {
    setWishlist((currentWishlist) => currentWishlist.filter((product) => product._id !== productId));
  };

  return (
    <div className="catalog-page">
      <Navbar />
      <main className="catalog-main wishlist-main">
        <header className="catalog-heading">
          <div>
            <p className="catalog-eyebrow">SAVED FOR LATER</p>
            <h1>My Wishlist</h1>
            {!loading && !error && (
              <p className="catalog-subtitle">
                {wishlist.length} {wishlist.length === 1 ? 'product' : 'products'} saved
              </p>
            )}
          </div>
        </header>

        {loading && (
          <div className="catalog-message" role="status">
            <span className="loading-spinner" aria-hidden="true" />
            <p>Loading your wishlist...</p>
          </div>
        )}

        {!loading && error && (
          <div className="catalog-message catalog-message-error" role="alert">
            <p className="empty-title">Something went wrong.</p>
            <p>We couldn't load your wishlist.</p>
            <button type="button" className="catalog-retry" onClick={() => setReload((value) => value + 1)}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && wishlist.length === 0 && (
          <div className="wishlist-empty">
            <span className="wishlist-empty-heart" aria-hidden="true">♡</span>
            <h2>Your wishlist is empty</h2>
            <p>Save products you love and find them here later.</p>
            <button type="button" className="add-to-cart-button" onClick={() => navigate('/products')}>
              Browse products
            </button>
          </div>
        )}

        {!loading && !error && wishlist.length > 0 && (
          <section className="product-grid" aria-label="Saved products">
            {wishlist.map((product) => (
              <WishlistCard key={product._id} product={product} onRemoved={handleRemoved} />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export default Wishlist;
