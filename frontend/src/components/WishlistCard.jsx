import { useState } from 'react';
import { Link } from 'react-router-dom';
import { removeFromWishlist } from '../services/api';

function WishlistCard({ product, onRemoved }) {
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');
  const price = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(product.price);

  const handleRemove = async () => {
    setRemoving(true);
    setError('');
    try {
      await removeFromWishlist(product._id);
      onRemoved(product._id);
    } catch {
      setError('Unable to remove product. Please try again.');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <article className="product-card wishlist-card">
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
        <Link className="product-details-link" to={`/products/${product._id}`}>
          View details
          <span aria-hidden="true">→</span>
        </Link>
        <button
          type="button"
          className="wishlist-remove-button"
          onClick={handleRemove}
          disabled={removing}
        >
          {removing ? 'Removing...' : 'Remove from Wishlist'}
        </button>
        {error && <p className="wishlist-action-error" role="alert">{error}</p>}
      </div>
    </article>
  );
}

export default WishlistCard;
