import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getProductById } from '../services/api';
import { useCart } from '../context/useCart';
import '../styles/products.css';

function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [cartError, setCartError] = useState('');
  const [cartMessage, setCartMessage] = useState('');
  const { addItem } = useCart();

  useEffect(() => {
    const controller = new AbortController();

    const loadProduct = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await getProductById(id, controller.signal);
        setProduct(result.product);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(requestError.response?.data?.message || 'Something went wrong while loading this product.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadProduct();
    return () => controller.abort();
  }, [id]);

  const price = product && new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(product.price);

  const handleAddToCart = async () => {
    setAdding(true);
    setCartError('');
    setCartMessage('');
    try {
      const result = await addItem(product._id);
      setCartMessage(result.message);
    } catch (requestError) {
      setCartError(requestError.response?.data?.message || 'Unable to add product. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="catalog-page">
      <Navbar />
      <main className="product-detail-main">
        <Link className="back-to-products" to="/products">← Back to products</Link>

        {loading && (
          <div className="catalog-message" role="status">
            <span className="loading-spinner" aria-hidden="true" />
            <p>Loading product...</p>
          </div>
        )}

        {!loading && error && (
          <div className="catalog-message catalog-message-error" role="alert">
            <p>{error}</p>
            <Link className="product-details-link" to="/products">Return to products</Link>
          </div>
        )}

        {!loading && !error && product && (
          <article className="product-detail">
            <div className="product-detail-image-wrap">
              <img
                className="product-detail-image"
                src={product.image}
                alt={product.name}
                onError={(event) => {
                  event.currentTarget.hidden = true;
                }}
              />
            </div>
            <div className="product-detail-copy">
              <span className="product-category">{product.category}</span>
              <h1>{product.name}</h1>
              <p className="product-detail-price">{price}</p>
              <p className="product-description">{product.description}</p>
              <p className={`product-stock ${product.stock === 0 ? 'is-out-of-stock' : ''}`}>
                {product.stock === 0 ? 'Out of stock' : `${product.stock} units available`}
              </p>
              <button
                type="button"
                className="add-to-cart-button"
                disabled={product.stock === 0 || adding}
                onClick={handleAddToCart}
              >
                {adding ? 'Adding...' : 'Add to cart'}
              </button>
              {cartMessage && <p className="cart-notice" role="status">{cartMessage}</p>}
              {cartError && <p className="wishlist-action-error" role="alert">{cartError}</p>}
            </div>
          </article>
        )}
      </main>
    </div>
  );
}

export default ProductDetails;
