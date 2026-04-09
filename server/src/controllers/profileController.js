import { randomUUID } from 'crypto';
import { getDb, dbRun, dbGet, dbAll } from '../lib/database.js';

/* ── Save / update influencer profile ── */
export async function saveInfluencerProfile(req, res, next) {
  try {
    const db = getDb();
    const userId = req.userId;
    const {
      category, niche, location,
      instagramHandle, instagramFollowers, instagramEngagement,
      tiktokHandle, tiktokFollowers, tiktokAvgViews,
      youtubeHandle, youtubeSubscribers, youtubeAvgViews,
      audienceAgeRange, audienceLocation,
      minRate, maxRate, biography,
    } = req.body;

    // update user role + bio + location
    await dbRun(db,
      `UPDATE users SET role = 'influencer', biography = COALESCE(?, biography), location = COALESCE(?, location), updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [biography, location, userId]
    );

    const existing = await dbGet(db, 'SELECT user_id FROM influencer_profiles WHERE user_id = ?', [userId]);

    if (existing) {
      await dbRun(db,
        `UPDATE influencer_profiles SET
          category=?, niche=?,
          instagram_handle=?, instagram_followers=?, instagram_engagement=?,
          tiktok_handle=?, tiktok_followers=?, tiktok_avg_views=?,
          youtube_handle=?, youtube_subscribers=?, youtube_avg_views=?,
          audience_age_range=?, audience_location=?,
          min_rate=?, max_rate=?, updated_at=CURRENT_TIMESTAMP
        WHERE user_id=?`,
        [category, niche,
          instagramHandle, instagramFollowers || 0, instagramEngagement || 0,
          tiktokHandle, tiktokFollowers || 0, tiktokAvgViews || 0,
          youtubeHandle, youtubeSubscribers || 0, youtubeAvgViews || 0,
          audienceAgeRange, audienceLocation,
          minRate || 0, maxRate || 0, userId]
      );
    } else {
      await dbRun(db,
        `INSERT INTO influencer_profiles (user_id, category, niche,
          instagram_handle, instagram_followers, instagram_engagement,
          tiktok_handle, tiktok_followers, tiktok_avg_views,
          youtube_handle, youtube_subscribers, youtube_avg_views,
          audience_age_range, audience_location, min_rate, max_rate)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [userId, category, niche,
          instagramHandle, instagramFollowers || 0, instagramEngagement || 0,
          tiktokHandle, tiktokFollowers || 0, tiktokAvgViews || 0,
          youtubeHandle, youtubeSubscribers || 0, youtubeAvgViews || 0,
          audienceAgeRange, audienceLocation,
          minRate || 0, maxRate || 0]
      );
    }

    res.json({ message: 'Profile saved' });
  } catch (error) { next(error); }
}

/* ── Save / update brand profile ── */
export async function saveBrandProfile(req, res, next) {
  try {
    const db = getDb();
    const userId = req.userId;
    const {
      companyName, industry, website, productType,
      targetAudience, campaignGoals,
      minBudget, maxBudget,
      preferredPlatforms, preferredCategories,
      biography, location,
    } = req.body;

    await dbRun(db,
      `UPDATE users SET role = 'brand', display_name = COALESCE(?, display_name), biography = COALESCE(?, biography), location = COALESCE(?, location), updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [companyName, biography, location, userId]
    );

    const existing = await dbGet(db, 'SELECT user_id FROM brand_profiles WHERE user_id = ?', [userId]);

    if (existing) {
      await dbRun(db,
        `UPDATE brand_profiles SET
          company_name=?, industry=?, website=?, product_type=?,
          target_audience=?, campaign_goals=?,
          min_budget=?, max_budget=?,
          preferred_platforms=?, preferred_categories=?,
          updated_at=CURRENT_TIMESTAMP
        WHERE user_id=?`,
        [companyName, industry, website, productType,
          targetAudience, campaignGoals,
          minBudget || 0, maxBudget || 0,
          preferredPlatforms, preferredCategories, userId]
      );
    } else {
      await dbRun(db,
        `INSERT INTO brand_profiles (user_id, company_name, industry, website, product_type,
          target_audience, campaign_goals, min_budget, max_budget,
          preferred_platforms, preferred_categories)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [userId, companyName, industry, website, productType,
          targetAudience, campaignGoals,
          minBudget || 0, maxBudget || 0,
          preferredPlatforms, preferredCategories]
      );
    }

    res.json({ message: 'Profile saved' });
  } catch (error) { next(error); }
}

/* ── Get any user's full profile (public view) ── */
export async function getPublicProfile(req, res, next) {
  try {
    const db = getDb();
    const { userId } = req.params;

    const user = await dbGet(db,
      `SELECT id, display_name, email, role, biography, avatar_color, location, created_at FROM users WHERE id = ?`,
      [userId]
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    let profile = null;
    if (user.role === 'influencer') {
      profile = await dbGet(db, 'SELECT * FROM influencer_profiles WHERE user_id = ?', [userId]);
    } else if (user.role === 'brand') {
      profile = await dbGet(db, 'SELECT * FROM brand_profiles WHERE user_id = ?', [userId]);
    }

    const campaigns = await dbAll(db, 'SELECT * FROM campaigns WHERE user_id = ? ORDER BY created_at DESC', [userId]);

    const ratingRow = await dbGet(db,
      'SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE reviewee_id = ?', [userId]);

    const reviews = await dbAll(db,
      `SELECT r.*, u.display_name as reviewer_name, u.avatar_color as reviewer_color
       FROM reviews r JOIN users u ON r.reviewer_id = u.id
       WHERE r.reviewee_id = ? ORDER BY r.created_at DESC LIMIT 10`, [userId]);

    res.json({
      user: {
        id: user.id,
        displayName: user.display_name,
        email: user.email,
        role: user.role,
        biography: user.biography,
        avatarColor: user.avatar_color,
        location: user.location,
        createdAt: user.created_at,
      },
      profile: profile ? formatProfile(profile, user.role) : null,
      campaigns,
      rating: ratingRow?.avg_rating ? Math.round(ratingRow.avg_rating * 10) / 10 : null,
      reviewCount: ratingRow?.review_count || 0,
      reviews,
    });
  } catch (error) { next(error); }
}

/* ── Update user's own profile (generic fields) ── */
export async function updateMyProfile(req, res, next) {
  try {
    const db = getDb();
    const userId = req.userId;
    const { displayName, biography, location } = req.body;

    await dbRun(db,
      `UPDATE users SET display_name = COALESCE(?, display_name), biography = COALESCE(?, biography), location = COALESCE(?, location), updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [displayName, biography, location, userId]
    );

    res.json({ message: 'Profile updated' });
  } catch (error) { next(error); }
}

function formatProfile(p, role) {
  if (role === 'influencer') {
    return {
      category: p.category,
      niche: p.niche,
      instagramHandle: p.instagram_handle,
      instagramFollowers: p.instagram_followers,
      instagramEngagement: p.instagram_engagement,
      tiktokHandle: p.tiktok_handle,
      tiktokFollowers: p.tiktok_followers,
      tiktokAvgViews: p.tiktok_avg_views,
      youtubeHandle: p.youtube_handle,
      youtubeSubscribers: p.youtube_subscribers,
      youtubeAvgViews: p.youtube_avg_views,
      audienceAgeRange: p.audience_age_range,
      audienceLocation: p.audience_location,
      minRate: p.min_rate,
      maxRate: p.max_rate,
    };
  }
  return {
    companyName: p.company_name,
    industry: p.industry,
    website: p.website,
    productType: p.product_type,
    targetAudience: p.target_audience,
    campaignGoals: p.campaign_goals,
    minBudget: p.min_budget,
    maxBudget: p.max_budget,
    preferredPlatforms: p.preferred_platforms,
    preferredCategories: p.preferred_categories,
  };
}
