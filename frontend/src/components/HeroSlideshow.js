import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Replace with your actual TMDB API Key or process.env.REACT_APP_TMDB_KEY
const TMDB_API_KEY = process.env.REACT_APP_TMDB_KEY;
const HeroSlideshow = () => {
  const [movies, setMovies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchTrendingBackdrops = async () => {
      try {
        const res = await axios.get(
          `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}`
        );
        const filtered = (res.data.results || []).filter((item) => item.backdrop_path).slice(0, 5);
        setMovies(filtered);
      } catch (err) {
        console.error('Error fetching slideshow backdrops:', err);
      }
    };

    fetchTrendingBackdrops();
  }, []);

  useEffect(() => {
    if (movies.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % movies.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [movies]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? movies.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % movies.length);
  };

  if (movies.length === 0) return null;

  return (
    <div className="hero-slideshow-container">
      {movies.map((movie, index) => (
        <div
          key={movie.id}
          className={`slideshow-slide ${index === currentIndex ? 'active' : ''}`}
        >
          <img
            src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
            alt={movie.title}
            className="slideshow-backdrop"
          />
          <div className="slideshow-overlay">
            <h2 className="slideshow-title">{movie.title}</h2>
            <p className="slideshow-overview">{movie.overview}</p>
          </div>
        </div>
      ))}

      <button className="slideshow-btn prev" onClick={handlePrev} aria-label="Previous Slide">
        ❮
      </button>
      <button className="slideshow-btn next" onClick={handleNext} aria-label="Next Slide">
        ❯
      </button>

      <div className="slideshow-dots">
        {movies.map((_, index) => (
          <span
            key={index}
            className={`slideshow-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlideshow;