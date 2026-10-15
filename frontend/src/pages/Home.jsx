import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile } from '../services/api';
import Navbar from '../components/Navbar';

function Home() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setCustomer(data);
      } catch {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const createdDate = customer?.createdAt
    ? new Date(customer.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  return (
    <div className="home-page">
      <Navbar customerName={customer?.fullName} />
      <main className="home-main">
        <div className="home-container">
          {/* Welcome Section */}
          <section className="welcome-section">
            <div className="welcome-content">
              <div className="welcome-avatar">
                <span>{customer?.fullName?.charAt(0)?.toUpperCase()}</span>
              </div>
              <div className="welcome-text">
                <h1>
                  Welcome back, <span className="gradient-text">{customer?.fullName}</span>
                </h1>
                <p>Here's your account overview</p>
              </div>
            </div>
          </section>

          <button
            type="button"
            className="browse-products-button"
            onClick={() => navigate('/products')}
          >
            Browse products
          </button>

          {/* Profile Cards Grid */}
          <section className="profile-grid">
            <div className="profile-card">
              <div className="card-icon card-icon-user">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="card-content">
                <span className="card-label">Full Name</span>
                <span className="card-value">{customer?.fullName}</span>
              </div>
            </div>

            <div className="profile-card">
              <div className="card-icon card-icon-email">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <div className="card-content">
                <span className="card-label">Email Address</span>
                <span className="card-value">{customer?.email}</span>
              </div>
            </div>

            <div className="profile-card">
              <div className="card-icon card-icon-phone">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div className="card-content">
                <span className="card-label">Phone Number</span>
                <span className="card-value">{customer?.phone}</span>
              </div>
            </div>

            <div className="profile-card">
              <div className="card-icon card-icon-calendar">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="card-content">
                <span className="card-label">Member Since</span>
                <span className="card-value">{createdDate}</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Home;
