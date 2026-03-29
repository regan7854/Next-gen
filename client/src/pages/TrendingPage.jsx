import { useState } from 'react';
import TrendingCard from '../components/TrendingCard.jsx';
import { dummyTrendings } from '../data/dummyTrending.js';
import { TrendingUp, Search } from 'lucide-react';

export default function TrendingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Get unique categories
  const categories = ['All', ...new Set(dummyTrendings.map(t => t.category))];

  // Filter trendings based on search and category
  const filteredTrendings = dummyTrendings.filter(trending => {
    const matchesSearch = trending.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trending.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || trending.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="trending-page">
      {/* Header */}
      <div className="trending-header">
        <div className="trending-header-content">
          <h1 className="trending-page-title">
            <TrendingUp size={32} />
            What's Trending
          </h1>
          <p className="trending-page-subtitle">
            Discover the hottest topics and emerging trends in your industry
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="trending-controls">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search trends..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category}
              className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Trending Cards Grid */}
      <div className="trending-grid">
        {filteredTrendings.length > 0 ? (
          filteredTrendings.map(trending => (
            <TrendingCard key={trending.id} trending={trending} />
          ))
        ) : (
          <div className="no-results">
            <TrendingUp size={48} />
            <p>No trends found matching your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
