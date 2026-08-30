import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../AuthContext';

const TMDB_API_KEY = process.env.REACT_APP_TMDB_KEY || 'YOUR_TMDB_API_KEY';
const BACKEND_URL = 'https://cinophile-backend.vercel.app/api/watchlist/';

const ExploreTMDB = ({ watchlist = [], onWatchlistUpdated }) => {
  const { token } = useContext(AuthContext);

  // Data States
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularTV, setPopularTV] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Modal & Selection States
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [existingItemId, setExistingItemId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('Plan to Watch');
  const [userRating, setUserRating] = useState(8);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch Popular Content from TMDB
  const fetchPopularContent = useCallback(async () => {
    if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_TMDB_API_KEY') {
      setErrorMessage('TMDB API Key missing! Add REACT_APP_TMDB_KEY to frontend/.env and restart server.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const [moviesRes, tvRes] = await Promise.all([
        axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`),
        axios.get(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`),
      ]);

      const movies = (moviesRes.data.results || []).map((m) => ({ ...m, media_type: 'movie' }));
      const tvShows = (tvRes.data.results || []).map((t) => ({ ...t, media_type: 'tv' }));

      setPopularMovies(movies);
      setPopularTV(tvShows);
    } catch (err) {
      console.error('TMDB Fetch Error:', err.response?.data || err.message);
      setErrorMessage('Failed to connect to TMDB API. Please verify your API key.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPopularContent();
  }, [fetchPopularContent]);

  // Multi-Search Engine
  useEffect(() => {
    const searchTMDB = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        const res = await axios.get(
          `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(
            searchQuery.trim()
          )}&page=1&include_adult=false`
        );
        const filtered = (res.data.results || []).filter(
          (item) => item.media_type === 'movie' || item.media_type === 'tv'
        );
        setSearchResults(filtered);
      } catch (err) {
        console.error('TMDB Search Error:', err.response?.data || err.message);
      }
    };

    const debounceTimer = setTimeout(searchTMDB, 350);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Open modal and check if title already exists in user's watchlist
  const handleOpenModal = (media) => {
    const titleVal = media.title || media.name || '';
    
    // Check duplicate by title
    const existing = watchlist.find(
      (item) => item.title.toLowerCase().trim() === titleVal.toLowerCase().trim()
    );

    setSelectedMedia(media);
    setSaveSuccess(false);

    if (existing) {
      setExistingItemId(existing.id);
      setSelectedStatus(existing.status || 'Plan to Watch');
      setUserRating(existing.rating || 8);
    } else {
      setExistingItemId(null);
      setSelectedStatus('Plan to Watch');
      setUserRating(media.vote_average ? Math.round(media.vote_average) : 8);
    }
  };

  // Save/Update Item in Django Backend
  const handleSaveToWatchlist = async () => {
    if (!selectedMedia) return;

    setIsSaving(true);
    setSaveSuccess(false);

    const titleVal = selectedMedia.title || selectedMedia.name || 'Untitled';
    const mediaTypeVal = selectedMedia.media_type === 'tv' ? 'TV' : 'Movie';
    const ratingVal = userRating ? parseFloat(userRating) : 0;
    
    // Build full image URL string for Django DB persistence
    const posterVal = selectedMedia.poster_path
      ? `https://image.tmdb.org/t/p/w500${selectedMedia.poster_path}`
      : 'https://via.placeholder.com/300x450?text=No+Poster';

    const payload = {
      title: titleVal,
      media_type: mediaTypeVal,
      status: selectedStatus || 'Plan to Watch',
      rating: ratingVal,
      poster_path: posterVal,
      is_custom: false
    };

    try {
      if (existingItemId) {
        // UPDATE existing record to avoid duplicate rows
        await axios.put(`${BACKEND_URL}${existingItemId}/`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } else {
        // CREATE new entry
        await axios.post(BACKEND_URL, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }

      setSaveSuccess(true);
      if (onWatchlistUpdated) onWatchlistUpdated();

      setTimeout(() => {
        setSelectedMedia(null);
        setSaveSuccess(false);
      }, 1000);
    } catch (err) {
      console.error('Detailed DRF Error Response:', err.response?.data);
      const backendErrors = err.response?.data 
        ? JSON.stringify(err.response.data, null, 2) 
        : err.message;
      alert(`Failed to save item:\n${backendErrors}`);
    } finally {
      setIsSaving(false);
    }
  };

  const exploreSuggestions = [...popularMovies.slice(0, 8), ...popularTV.slice(0, 8)];

  return (
    <div className="explore-container" style={{ marginTop: '1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <input
          type="text"
          className="form-control"
          placeholder="🔍 Search movies or TV shows on TMDB..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {errorMessage && (
        <div className="auth-error" style={{ marginBottom: '2rem' }}>
          {errorMessage}
        </div>
      )}

      {searchQuery.trim() !== '' ? (
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ marginBottom: '1.2rem', fontSize: '1.4rem' }}>
            Search Results for "{searchQuery}"
          </h2>
          {searchResults.length === 0 ? (
            <div className="empty-state">No matching titles found on TMDB.</div>
          ) : (
            <div className="tmdb-explore-grid">
              {searchResults.map((item) => (
                <div
                  key={`${item.media_type}-${item.id}`}
                  className="tmdb-card"
                  onClick={() => handleOpenModal(item)}
                >
                  <img
                    src={
                      item.poster_path
                        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                        : 'https://via.placeholder.com/300x450?text=No+Poster'
                    }
                    alt={item.title || item.name}
                    className="tmdb-poster"
                  />
                  <div className="tmdb-card-info">
                    <div className="tmdb-card-title">{item.title || item.name}</div>
                    <div className="tmdb-card-rating">
                      ⭐ {item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ marginBottom: '1.2rem', fontSize: '1.4rem' }}>
            🔥 Popular Suggestions on TMDB
          </h2>

          {loading ? (
            <div className="empty-state">Loading popular movies and TV shows...</div>
          ) : exploreSuggestions.length === 0 && !errorMessage ? (
            <div className="empty-state">No explore suggestions available.</div>
          ) : (
            <div className="tmdb-explore-grid">
              {exploreSuggestions.map((item) => (
                <div
                  key={`${item.media_type}-${item.id}`}
                  className="tmdb-card"
                  onClick={() => handleOpenModal(item)}
                >
                  <img
                    src={
                      item.poster_path
                        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                        : 'https://via.placeholder.com/300x450?text=No+Poster'
                    }
                    alt={item.title || item.name}
                    className="tmdb-poster"
                  />
                  <div className="tmdb-card-info">
                    <div className="tmdb-card-title">{item.title || item.name}</div>
                    <div className="tmdb-card-rating">
                      ⭐ {item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {selectedMedia && (
        <div className="modal-overlay" onClick={() => setSelectedMedia(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedMedia(null)}>
              ✕
            </button>
            <div className="modal-body">
              <img
                src={
                  selectedMedia.poster_path
                    ? `https://image.tmdb.org/t/p/w500${selectedMedia.poster_path}`
                    : 'https://via.placeholder.com/300x450?text=No+Poster'
                }
                alt={selectedMedia.title || selectedMedia.name}
                className="modal-poster"
              />
              <div className="modal-details">
                <h2 style={{ margin: '0 0 0.5rem 0' }}>
                  {selectedMedia.title || selectedMedia.name}
                </h2>

                {existingItemId && (
                  <div style={{ marginBottom: '0.8rem' }}>
                    <span style={{ backgroundColor: '#22c55e', color: '#000', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      ✓ Already in Your Watchlist
                    </span>
                  </div>
                )}
                
                <div style={{ color: '#eab308', marginBottom: '0.8rem', fontWeight: 'bold' }}>
                  TMDB Score: ⭐ {selectedMedia.vote_average ? selectedMedia.vote_average.toFixed(1) : 'N/A'} / 10
                </div>

                <p className="modal-overview">
                  {selectedMedia.overview || 'No overview available for this title.'}
                </p>

                <div style={{ marginTop: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem', color: '#a1a1aa' }}>
                      Watch Status:
                    </label>
                    <select
                      className="form-control"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      style={{ padding: '0.5rem', borderRadius: '6px', width: '100%' }}
                    >
                      <option value="Plan to Watch">Plan to Watch</option>
                      <option value="Watching">Watching</option>
                      <option value="Completed">Completed</option>
                      <option value="Dropped">Dropped</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem', color: '#a1a1aa' }}>
                      Your Rating: <strong style={{ color: '#eab308' }}>⭐ {userRating} / 10</strong>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.5"
                      value={userRating}
                      onChange={(e) => setUserRating(e.target.value)}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                  </div>

                  <button
                    className="btn-primary"
                    onClick={handleSaveToWatchlist}
                    disabled={isSaving}
                    style={{
                      padding: '0.75rem',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      backgroundColor: saveSuccess ? '#22c55e' : undefined,
                      cursor: isSaving ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSaving 
                      ? 'Saving...' 
                      : saveSuccess 
                      ? '✓ Saved!' 
                      : existingItemId 
                      ? 'Update Watchlist Entry' 
                      : '+ Add to Watchlist'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExploreTMDB;