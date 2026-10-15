import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/useCart';

const formatPrice = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(value);

function CartItem({ item }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { updateQuantity, removeItem } = useCart();
  const { product, quantity } = item;

  const changeQuantity = async (nextQuantity) => {
    setBusy(true);
    setError('');
    try {
      await updateQuantity(product._id, nextQuantity);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update quantity. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    setError('');
    try {
      await removeItem(product._id);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to remove product. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="cart-item">
      <Link className="cart-item-image-link" to={`/products/${product._id}`}>
        <img
          className="cart-item-image"
          src={product.image}
          alt={product.name}
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      </Link>
      <div className="cart-item-details">
        <span className="product-category">{product.category}</span>
        <Link className="cart-item-name" to={`/products/${product._id}`}>{product.name}</Link>
        <p className="product-price">{formatPrice(product.price)}</p>
        <p className={`product-stock ${product.stock === 0 ? 'is-out-of-stock' : ''}`}>
          {product.stock === 0 ? 'Out of stock' : `${product.stock} units left`}
        </p>
        {quantity > product.stock && (
          <p className="cart-item-error" role="alert">Stock changed. Reduce the quantity to continue.</p>
        )}
        <div className="cart-item-actions">
          <div className="quantity-control" aria-label={`Quantity for ${product.name}`}>
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => changeQuantity(quantity - 1)}
              disabled={busy || quantity <= 1}
            >−</button>
            <span aria-live="polite">{quantity}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => changeQuantity(quantity + 1)}
              disabled={busy || quantity >= product.stock}
            >+</button>
          </div>
          <strong className="cart-line-total">{formatPrice(product.price * quantity)}</strong>
        </div>
        <button type="button" className="cart-remove-button" onClick={handleRemove} disabled={busy}>
          {busy ? 'Updating...' : 'Remove'}
        </button>
        {error && <p className="cart-item-error" role="alert">{error}</p>}
      </div>
    </article>
  );
}

export default CartItem;
