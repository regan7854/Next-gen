import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';

export default function ManageCategories() {
  const { apiFetch } = useAdminAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch('/categories');
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const maxCount = Math.max(...categories.map(c => c.user_count), 1);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>Manage Categories <small className="admin-count-badge">{categories.length}</small></h2>
      </div>
      <div className="admin-card">
        {loading ? <div className="admin-loading"><div className="admin-spinner" /></div> : categories.length > 0 ? (
          <div className="admin-categories-list">
            {categories.map((cat, i) => (
              <div key={i} className="admin-category-item">
                <div className="admin-category-info">
                  <span className="admin-category-rank">#{i + 1}</span>
                  <span className="admin-category-name">{cat.name}</span>
                  <span className="admin-category-count">{cat.user_count} users</span>
                </div>
                <div className="admin-category-bar-wrapper">
                  <div className="admin-category-bar" style={{ width: `${(cat.user_count / maxCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : <p className="admin-td-empty" style={{ padding: '2rem', textAlign: 'center' }}>No categories found</p>}
      </div>
    </div>
  );
}
