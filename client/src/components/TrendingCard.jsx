import { TrendingUp, ArrowUp } from 'lucide-react';

export default function TrendingCard({ trending }) {
  const getTrendColor = (trend) => {
    return trend === 'rising' ? '#4ade80' : '#64748b';
  };

  return (
    <div className="trending-card">
      <div className="trending-image">
        <img src={trending.image} alt={trending.title} />
        <span className="trending-category">{trending.category}</span>
      </div>
      
      <div className="trending-content">
        <h3 className="trending-title">{trending.title}</h3>
        <p className="trending-description">{trending.description}</p>
        
        <div className="trending-stats">
          <div className="stat">
            <span className="stat-label">Engagement</span>
            <span className="stat-value">{trending.engagementScore}/10</span>
          </div>
          <div className="stat">
            <span className="stat-label">Mentions</span>
            <span className="stat-value">
              {trending.mentions > 1000 
                ? (trending.mentions / 1000).toFixed(1) + 'K'
                : trending.mentions}
            </span>
          </div>
        </div>

        <div className="trending-footer">
          <span 
            className="trending-trend"
            style={{ color: getTrendColor(trending.trend) }}
          >
            {trending.trend === 'rising' ? (
              <>
                <ArrowUp size={14} />
                Rising
              </>
            ) : (
              <>
                <TrendingUp size={14} />
                Stable
              </>
            )}
          </span>
          <button className="trending-btn">View Details</button>
        </div>
      </div>
    </div>
  );
}
