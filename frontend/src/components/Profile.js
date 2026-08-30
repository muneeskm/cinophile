import React, { useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../AuthContext';

const Profile = ({ watchlistCount = 0, movieCount = 0, tvCount = 0 }) => {
  const { user, token, updateUser } = useContext(AuthContext);

  useEffect(() => {
    // If we have a token but no email in state, try fetching user details from backend
    const fetchUserProfile = async () => {
      if (token && (!user?.email || user?.email === 'N/A')) {
        try {
          const res = await axios.get('http://127.0.0.1:8000/api/profile/', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.data) {
            updateUser(res.data);
          }
        } catch (err) {
          console.warn('Could not fetch extra profile details from backend:', err.message);
        }
      }
    };

    fetchUserProfile();
  }, [token, user, updateUser]);

  return (
    <div className="profile-container" style={{ maxWidth: '600px', margin: '2rem auto', color: '#fff' }}>
      <div style={{ backgroundColor: '#18181b', padding: '2rem', borderRadius: '8px', border: '1px solid #333' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
          <div
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              backgroundColor: '#eab308',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: 'bold',
            }}
          >
            {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{user?.username || 'User Profile'}</h2>
            <p style={{ margin: '0.2rem 0 0 0', color: '#a1a1aa', fontSize: '0.95rem' }}>
              📧 {user?.email || 'N/A'}
            </p>
          </div>
        </div>

        <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
          Watchlist Statistics
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ backgroundColor: '#27272a', padding: '1rem', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>Total Items</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#eab308', marginTop: '0.3rem' }}>
              {watchlistCount}
            </div>
          </div>
          <div style={{ backgroundColor: '#27272a', padding: '1rem', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>Movies</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fff', marginTop: '0.3rem' }}>
              {movieCount}
            </div>
          </div>
          <div style={{ backgroundColor: '#27272a', padding: '1rem', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>TV Shows</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fff', marginTop: '0.3rem' }}>
              {tvCount}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;