export const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%2318232e'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='22' font-weight='600' fill='%2367e8cf'%3EShopKart%3C/text%3E%3C/svg%3E";

export const handleImageError = (event) => {
  if (event.currentTarget.src !== FALLBACK_IMAGE) {
    event.currentTarget.src = FALLBACK_IMAGE;
  }
};