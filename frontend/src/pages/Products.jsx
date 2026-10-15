import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import { getProducts, getWishlist } from '../services/api';
import '../styles/products.css';

const categories = ['Electronics', 'Fashion', 'Books', 'Home'];

function Products() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [wishlistIds, setWishlistIds] = useState(() => new Set());

  useEffect(() => {
    const controller = new AbortController();

    getWishlist(controller.signal)
      .then((result) => {
        setWishlistIds(new Set((result.wishlist || []).map((product) => product._id)));
      })
      .catch((requestError) => {
        if (!controller.signal.aborted && requestError.response?.status !== 401) {
          setWishlistIds(new Set());
        }
      });

    return () => controller.abort();
  }, []);

  const handleWishlistChange = (productId, saved) => {
    setWishlistIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (saved) nextIds.add(productId);
      else nextIds.delete(productId);
      return nextIds;
    });
  };

  useEffect(() => {
    const controller = new AbortController();

    const loadProducts = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await getProducts(
          { search: search.trim() || undefined, category: category || undefined, sort: sort || undefined },
          controller.signal
        );
        setProducts(result.products || []);
      } catch {
        if (!controller.signal.aborted) {
          setError('Something went wrong while loading products.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadProducts();
    return () => controller.abort();
  }, [search, category, sort, reload]);

  return (
    <div className="catalog-page">
      <Navbar />
      <main className="catalog-main">
        <header className="catalog-heading">
          <div>
            <p className="catalog-eyebrow">SHOPKART CATALOG</p>
            <h1>Products</h1>
            <p className="catalog-subtitle">Explore the collection and find what you need.</p>
          </div>
          <span className="catalog-count">
            {loading ? 'Loading…' : `${products.length} ${products.length === 1 ? 'item' : 'items'}`}
          </span>
        </header>

        <section className="catalog-controls" aria-label="Search and filter products">
          <label className="catalog-search">
            <span>Search products</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Try “headphones”"
            />
          </label>
          <label className="catalog-select">
            <span>Category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">All categories</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="catalog-select">
            <span>Sort by</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="">Recommended</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          </label>
        </section>

        {loading && (
          <div className="catalog-message" role="status">
            <span className="loading-spinner" aria-hidden="true" />
            <p>Loading products...</p>
          </div>
        )}

        {!loading && error && (
          <div className="catalog-message catalog-message-error" role="alert">
            <p>{error}</p>
            <button type="button" className="catalog-retry" onClick={() => setReload((value) => value + 1)}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="catalog-message">
            <p className="empty-title">No products found.</p>
            <p>Try another search or choose a different category.</p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <section className="product-grid" aria-label="Products">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                isWishlisted={wishlistIds.has(product._id)}
                onWishlistChange={handleWishlistChange}
              />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export default Products;
