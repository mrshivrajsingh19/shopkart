import axios from 'axios';

const api = axios.create({
  baseURL: '/customers',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const productApi = axios.create({
  baseURL: '/api/products',
  headers: {
    'Content-Type': 'application/json',
  },
});

const wishlistApi = axios.create({
  baseURL: '/api/wishlist',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const cartApi = axios.create({
  baseURL: '/api/cart',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const orderApi = axios.create({
  baseURL: '/api/orders',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const registerCustomer = async ({
  fullName,
  email,
  password,
  phone
}) => {

  const response = await api.post('/register', {
    fullName,
    email,
    password,
    phone
  });

  return response.data;
};

export const loginCustomer = async ({ email, password }) => {
  const response = await api.post('/login', { email, password });
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/me');
  return response.data;
};

export const logoutCustomer = async () => {
  const response = await api.post('/logout');
  return response.data;
};

export const createProduct = async (product) => {
  const response = await productApi.post('/', product);
  return response.data;
};

export const getProducts = async (params = {}, signal) => {
  const response = await productApi.get('/', { params, signal });
  return response.data;
};

export const getProductById = async (id, signal) => {
  const response = await productApi.get(`/${id}`, { signal });
  return response.data;
};

export const getWishlist = async (signal) => {
  const response = await wishlistApi.get('/', { signal });
  return response.data;
};

export const addToWishlist = async (productId) => {
  const response = await wishlistApi.post(`/${productId}`);
  return response.data;
};

export const removeFromWishlist = async (productId) => {
  const response = await wishlistApi.delete(`/${productId}`);
  return response.data;
};

export const getCart = async (signal) => {
  const response = await cartApi.get('/', { signal });
  return response.data;
};

export const addProductToCart = async (productId) => {
  const response = await cartApi.post(`/${productId}`);
  return response.data;
};

export const setCartProductQuantity = async (productId, quantity) => {
  const response = await cartApi.patch(`/${productId}`, { quantity });
  return response.data;
};

export const removeCartProduct = async (productId) => {
  const response = await cartApi.delete(`/${productId}`);
  return response.data;
};

export const createPaymentOrder = async (shippingAddress) => {
  const response = await orderApi.post('/create-payment-order', { shippingAddress });
  return response.data;
};

export const verifyPayment = async (paymentDetails) => {
  const response = await orderApi.post('/verify-payment', paymentDetails);
  return response.data;
};

export const getOrders = async (signal) => {
  const response = await orderApi.get('/', { signal });
  return response.data;
};

export const getOrderById = async (orderId, signal) => {
  const response = await orderApi.get(`/${orderId}`, { signal });
  return response.data;
};

export default api;
