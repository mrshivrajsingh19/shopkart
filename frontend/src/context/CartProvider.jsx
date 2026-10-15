import { useEffect, useState } from 'react';
import CartContext from './cartContext';
import {
  addProductToCart,
  getCart,
  removeCartProduct,
  setCartProductQuantity,
} from '../services/api';

const getErrorMessage = (error) =>
  error.response?.data?.message || 'Unable to load your cart.';

function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorStatus, setErrorStatus] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    getCart(controller.signal)
      .then((result) => {
        setCartItems(result.cart || []);
        setError('');
        setErrorStatus(null);
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setError(getErrorMessage(requestError));
          setErrorStatus(requestError.response?.status || null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const refreshCart = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getCart();
      setCartItems(result.cart || []);
      setErrorStatus(null);
      return true;
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setErrorStatus(requestError.response?.status || null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (productId) => {
    const result = await addProductToCart(productId);
    setCartItems(result.cart || []);
    setError('');
    setErrorStatus(null);
    return result;
  };

  const updateQuantity = async (productId, quantity) => {
    const result = await setCartProductQuantity(productId, quantity);
    setCartItems(result.cart || []);
    setError('');
    setErrorStatus(null);
    return result;
  };

  const removeItem = async (productId) => {
    const result = await removeCartProduct(productId);
    setCartItems(result.cart || []);
    setError('');
    setErrorStatus(null);
    return result;
  };

  const clearCart = () => {
    setCartItems([]);
    setError('');
    setErrorStatus(null);
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      subtotal,
      loading,
      error,
      errorStatus,
      refreshCart,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export default CartProvider;
