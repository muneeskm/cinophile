import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../AuthContext';
import ExploreTMDB from './ExploreTMDB';
import Profile from './Profile';

const BACKEND_URL = 'https://cinophile-backend.vercel.app/api/watchlist/';

const Watchlist = () => {
  const { token, logout, user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('watchlist'); // 'watchlist', 'explore', or 'profile'
  const [watchlist, setWatchlist] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Robust URL Resolver for TMDB / Custom Posters
  const getPosterUrl = (posterPath) => {
    if (!posterPath || posterPath === 'undefined' || posterPath === 'null') {
      return 'https://via.placeholder.com/300x450?text=No+Poster';
    }
    if (posterPath.startsWith('http://') || posterPath.startsWith('https://')) {
      return posterPath;
    }
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
  };

  // Fetch Watchlist from Backend
  const fetchWatchlist = useCallback(async () => {
    if (!token) {
      setFetchError('No authentication token found. Please log in.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError('');

    try {
      const res = await axios.get(BACKEND_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWatchlist(res.data);
    } catch (err) {
      console.error('Error fetching watchlist:', err.response?.data || err.message);
      setFetchError('Failed to load watchlist.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Refetch data whenever token or user switches
  useEffect(() => {
    setWatchlist([]);
    fetchWatchlist();
  }, [token, user, fetchWatchlist]);

  // Delete Watchlist Item
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${BACKEND_URL}${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchWatchlist();
    } catch (err) {
      console.error('Error removing item:', err.response?.data || err.message);
      alert('Failed to remove item.');
    }
  };

  // Filter Watchlist Items by Movie or TV
  const displayedWatchlist = watchlist.filter((item) => {
    const itemType = item.media_type || item.mediaType || '';
    if (filter === 'All') return true;
    return itemType.toLowerCase() === filter.toLowerCase();
  });

  const movieCount = watchlist.filter((i) => (i.media_type || i.mediaType || '').toLowerCase() === 'movie').length;
  const tvCount = watchlist.filter((i) => (i.media_type || i.mediaType || '').toLowerCase() === 'tv').length;

  return (
    <div className="app-container" style={{ padding: '2rem 1rem' }}>
      {/* Top Navigation */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>CINOPHILE 🎬</div>
        
        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setActiveTab('watchlist')}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'watchlist' ? '#eab308' : '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '1rem',
              borderBottom: activeTab === 'watchlist' ? '2px solid #eab308' : 'none',
              paddingBottom: '0.2rem'
            }}
          >
            My Watchlist
          </button>
          
          <button
            onClick={() => setActiveTab('explore')}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'explore' ? '#eab308' : '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '1rem',
              borderBottom: activeTab === 'explore' ? '2px solid #eab308' : 'none',
              paddingBottom: '0.2rem'
            }}
          >
            🔍 Explore TMDB
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'profile' ? '#eab308' : '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '1rem',
              borderBottom: activeTab === 'profile' ? '2px solid #eab308' : 'none',
              paddingBottom: '0.2rem'
            }}
          >
            👤 Profile
          </button>
        </div>

        <button onClick={logout} className="btn-logout" style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Logout
        </button>
      </nav>

      {/* RENDER PROFILE VIEW */}
      {activeTab === 'profile' ? (
        <Profile 
          watchlistCount={watchlist.length} 
          movieCount={movieCount} 
          tvCount={tvCount} 
        />
      ) : activeTab === 'explore' ? (
        /* RENDER DEDICATED EXPLORE VIEW */
        <ExploreTMDB 
          watchlist={watchlist} 
          onWatchlistUpdated={fetchWatchlist} 
        />
      ) : (
        /* RENDER MY WATCHLIST VIEW */
        <>
          {/* Summary Cards */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <div className="stat-card" style={{ padding: '1rem', border: '1px solid #333', borderRadius: '8px', flex: 1 }}>
              <div style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>Total Saved</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{watchlist.length}</div>
            </div>
            <div className="stat-card" style={{ padding: '1rem', border: '1px solid #333', borderRadius: '8px', flex: 1 }}>
              <div style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>Movies</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{movieCount}</div>
            </div>
            <div className="stat-card" style={{ padding: '1rem', border: '1px solid #333', borderRadius: '8px', flex: 1 }}>
              <div style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>TV Shows</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{tvCount}</div>
            </div>
          </div>

          {/* SAVED WATCHLIST SECTION */}
          <section style={{ marginBottom: '3.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem' }}>
                {user?.username ? `${user.username}'s Saved Watchlist` : 'My Saved Watchlist'}
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['All', 'Movie', 'TV'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      backgroundColor: filter === tab ? '#eab308' : '#27272a',
                      color: filter === tab ? '#000' : '#fff',
                      border: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {fetchError && <div style={{ color: '#ef4444', marginBottom: '1rem' }}>{fetchError}</div>}

            {loading ? (
              <div className="empty-state">Loading your watchlist...</div>
            ) : displayedWatchlist.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem', textAlign: 'center', border: '1px dashed #444', borderRadius: '8px' }}>
                Your saved watchlist is empty. Switch to the <strong>Explore TMDB</strong> tab to search and add titles!
              </div>
            ) : (
              <div className="watchlist-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.5rem' }}>
                {displayedWatchlist.map((item) => {
                  const displayType = item.media_type || item.mediaType || 'N/A';

                  return (
                    <div key={item.id} className="media-card" style={{ border: '1px solid #333', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#18181b' }}>
                      <img
                        src={getPosterUrl(item.poster_path)}
                        alt={item.title}
                        style={{ width: '100%', height: '260px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/300x450?text=No+Poster';
                        }}
                      />
                      <div style={{ padding: '0.8rem' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.3rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.5rem' }}>
                          Type: {displayType} | Rating: ⭐ {item.rating || 'N/A'}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', backgroundColor: '#27272a', borderRadius: '4px', textTransform: 'capitalize' }}>
                            {item.status || 'Plan to Watch'}
                          </span>
                          <button
                            onClick={() => handleDelete(item.id)}
                            style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default Watchlist;