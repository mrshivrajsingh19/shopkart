import { useState } from 'react';
import { Link } from 'react-router-dom';
import { addToWishlist, removeFromWishlist } from '../services/api';
import { useCart } from '../context/useCart';

function ProductCard({ product, isWishlisted = false, onWishlistChange }) {
  const [saving, setSaving] = useState(false);
  const [wishlistError, setWishlistError] = useState('');
  const [adding, setAdding] = useState(false);
  const [cartError, setCartError] = useState('');
  const { addItem } = useCart();

  const price = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(product.price);

  const handleWishlistClick = async () => {
    const nextSaved = !isWishlisted;
    setSaving(true);
    setWishlistError('');

    try {
      if (nextSaved) {
        await addToWishlist(product._id);
      } else {
        await removeFromWishlist(product._id);
      }
      onWishlistChange?.(product._id, nextSaved);
    } catch (error) {
      if (nextSaved && error.response?.status === 409) {
        onWishlistChange?.(product._id, true);
        setWishlistError('This product is already in your wishlist.');
      } else {
        setWishlistError(nextSaved
          ? 'Unable to save product. Please try again.'
          : 'Unable to remove product. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddToCart = async () => {
    setAdding(true);
    setCartError('');
    try {
      await addItem(product._id);
    } catch (error) {
      setCartError(error.response?.data?.message || 'Unable to add product. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="product-card">
      <Link
        className="product-card-image-link"
        to={`/products/${product._id}`}
        aria-label={`View ${product.name} details`}
      >
        <img
          className="product-card-image"
          src={product.image}
          alt={product.name}
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      </Link>
      <div className="product-card-content">
        <span className="product-category">{product.category}</span>
        <h2>{product.name}</h2>
        <p className="product-price">{price}</p>
        <p className={`product-stock ${product.stock === 0 ? 'is-out-of-stock' : ''}`}>
          {product.stock === 0 ? 'Out of stock' : `${product.stock} units left`}
        </p>
        <button
          type="button"
          className="add-to-cart-card-button"
          onClick={handleAddToCart}
          disabled={adding || product.stock === 0}
        >
          {adding ? 'Adding...' : 'Add to Cart'}
        </button>
        {cartError && <p className="wishlist-action-error" role="alert">{cartError}</p>}
        <button
          type="button"
          className={`wishlist-action ${isWishlisted ? 'is-saved' : ''}`}
          onClick={handleWishlistClick}
          disabled={saving}
          aria-pressed={isWishlisted}
        >
          <span aria-hidden="true">{saving ? '…' : isWishlisted ? '♥' : '♡'}</span>
          {saving ? 'Saving...' : isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        </button>
        {wishlistError && <p className="wishlist-action-error" role="alert">{wishlistError}</p>}
        <Link className="product-details-link" to={`/products/${product._id}`}>
          View details
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

export default ProductCard;
