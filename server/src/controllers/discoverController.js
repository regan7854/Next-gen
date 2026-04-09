import { getPrisma } from '../lib/prisma.js';

/* Convert ? placeholders → $1, $2, ... for PostgreSQL */
function toPg(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

const CATEGORIES = [
  'beauty', 'fitness', 'gaming', 'travel', 'food', 'fashion',
  'technology', 'education', 'lifestyle', 'health', 'entertainment', 'music', 'sports', 'business',
];

const PLATFORMS = ['instagram', 'tiktok', 'youtube'];

export async function searchInfluencers(req, res, next) {
  try {
    const prisma = getPrisma();
    const { category, platform, minFollowers, maxFollowers, location, q } = req.query;

    let sql = `
      SELECT u.id, u.display_name, u.biography, u.avatar_color, u.location,
             ip.*,
             (SELECT AVG(rating) FROM reviews WHERE reviewee_id = u.id) as avg_rating,
             (SELECT COUNT(*) FROM reviews WHERE reviewee_id = u.id) as review_count
      FROM users u
      JOIN influencer_profiles ip ON u.id = ip.user_id
      WHERE u.role = 'influencer'
    `;
    const params = [];

    if (category) { sql += ` AND ip.category = ?`; params.push(category); }
    if (location) { sql += ` AND (u.location ILIKE ? OR ip.audience_location ILIKE ?)`; params.push(`%${location}%`, `%${location}%`); }
    if (q) { sql += ` AND (u.display_name ILIKE ? OR u.biography ILIKE ? OR ip.niche ILIKE ?)`; params.push(`%${q}%`, `%${q}%`, `%${q}%`); }

    if (platform === 'instagram') {
      if (minFollowers) { sql += ` AND ip.instagram_followers >= ?`; params.push(Number(minFollowers)); }
      if (maxFollowers) { sql += ` AND ip.instagram_followers <= ?`; params.push(Number(maxFollowers)); }
    } else if (platform === 'tiktok') {
      if (minFollowers) { sql += ` AND ip.tiktok_followers >= ?`; params.push(Number(minFollowers)); }
      if (maxFollowers) { sql += ` AND ip.tiktok_followers <= ?`; params.push(Number(maxFollowers)); }
    } else if (platform === 'youtube') {
      if (minFollowers) { sql += ` AND ip.youtube_subscribers >= ?`; params.push(Number(minFollowers)); }
      if (maxFollowers) { sql += ` AND ip.youtube_subscribers <= ?`; params.push(Number(maxFollowers)); }
    } else {
      if (minFollowers) {
        sql += ` AND (ip.instagram_followers >= ? OR ip.tiktok_followers >= ? OR ip.youtube_subscribers >= ?)`;
        params.push(Number(minFollowers), Number(minFollowers), Number(minFollowers));
      }
      if (maxFollowers) {
        sql += ` AND (ip.instagram_followers <= ? OR ip.tiktok_followers <= ? OR ip.youtube_subscribers <= ?)`;
        params.push(Number(maxFollowers), Number(maxFollowers), Number(maxFollowers));
      }
    }

    sql += ` ORDER BY (ip.instagram_followers + ip.tiktok_followers + ip.youtube_subscribers) DESC LIMIT 50`;

    const rows = await prisma.$queryRawUnsafe(toPg(sql), ...params);

    const results = rows.map((r) => ({
      id: r.id, displayName: r.display_name, biography: r.biography,
      avatarColor: r.avatar_color, location: r.location,
      category: r.category, niche: r.niche,
      platforms: {
        instagram: { handle: r.instagram_handle, followers: r.instagram_followers, engagement: r.instagram_engagement },
        tiktok: { handle: r.tiktok_handle, followers: r.tiktok_followers, avgViews: r.tiktok_avg_views },
        youtube: { handle: r.youtube_handle, subscribers: r.youtube_subscribers, avgViews: r.youtube_avg_views },
      },
      audienceAgeRange: r.audience_age_range, audienceLocation: r.audience_location,
      minRate: r.min_rate, maxRate: r.max_rate,
      avgRating: r.avg_rating ? Math.round(Number(r.avg_rating) * 10) / 10 : null,
      reviewCount: Number(r.review_count) || 0,
    }));

    res.json({ results, total: results.length });
  } catch (error) { next(error); }
}

export async function searchBrands(req, res, next) {
  try {
    const prisma = getPrisma();
    const { industry, minBudget, maxBudget, q } = req.query;

    let sql = `
      SELECT u.id, u.display_name, u.biography, u.avatar_color, u.location,
             bp.*,
             (SELECT AVG(rating) FROM reviews WHERE reviewee_id = u.id) as avg_rating,
             (SELECT COUNT(*) FROM reviews WHERE reviewee_id = u.id) as review_count
      FROM users u
      JOIN brand_profiles bp ON u.id = bp.user_id
      WHERE u.role = 'brand'
    `;
    const params = [];

    if (industry) { sql += ` AND bp.industry = ?`; params.push(industry); }
    if (minBudget) { sql += ` AND bp.max_budget >= ?`; params.push(Number(minBudget)); }
    if (maxBudget) { sql += ` AND bp.min_budget <= ?`; params.push(Number(maxBudget)); }
    if (q) { sql += ` AND (u.display_name ILIKE ? OR bp.company_name ILIKE ? OR bp.product_type ILIKE ?)`; params.push(`%${q}%`, `%${q}%`, `%${q}%`); }

    sql += ` ORDER BY bp.max_budget DESC LIMIT 50`;

    const rows = await prisma.$queryRawUnsafe(toPg(sql), ...params);

    const results = rows.map((r) => ({
      id: r.id, displayName: r.display_name, companyName: r.company_name,
      biography: r.biography, avatarColor: r.avatar_color, location: r.location,
      industry: r.industry, productType: r.product_type,
      targetAudience: r.target_audience, campaignGoals: r.campaign_goals,
      minBudget: r.min_budget, maxBudget: r.max_budget,
      preferredPlatforms: r.preferred_platforms, preferredCategories: r.preferred_categories,
      website: r.website,
      avgRating: r.avg_rating ? Math.round(Number(r.avg_rating) * 10) / 10 : null,
      reviewCount: Number(r.review_count) || 0,
    }));

    res.json({ results, total: results.length });
  } catch (error) { next(error); }
}

export async function getRecommendations(req, res, next) {
  try {
    const prisma = getPrisma();
    const userId = req.userId;

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    let results = [];

    if (user.role === 'brand') {
      const brand = await prisma.brandProfile.findUnique({ where: { userId } });
      if (!brand) return res.json({ results: [] });

      const influencers = await prisma.$queryRaw`
        SELECT u.id, u.display_name, u.biography, u.avatar_color, u.location, ip.*
        FROM users u JOIN influencer_profiles ip ON u.id = ip.user_id
        WHERE u.role = 'influencer'
      `;

      results = influencers.map((inf) => {
        const score = calculateMatchScore(brand, inf, 'brand');
        return {
          id: inf.id, displayName: inf.display_name, biography: inf.biography,
          avatarColor: inf.avatar_color, location: inf.location,
          category: inf.category, niche: inf.niche,
          platforms: {
            instagram: { handle: inf.instagram_handle, followers: inf.instagram_followers, engagement: inf.instagram_engagement },
            tiktok: { handle: inf.tiktok_handle, followers: inf.tiktok_followers, avgViews: inf.tiktok_avg_views },
            youtube: { handle: inf.youtube_handle, subscribers: inf.youtube_subscribers, avgViews: inf.youtube_avg_views },
          },
          minRate: inf.min_rate, maxRate: inf.max_rate, matchScore: score,
        };
      }).filter((r) => r.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore).slice(0, 20);

    } else if (user.role === 'influencer') {
      const inf = await prisma.influencerProfile.findUnique({ where: { userId } });
      if (!inf) return res.json({ results: [] });

      const brands = await prisma.$queryRaw`
        SELECT u.id, u.display_name, u.biography, u.avatar_color, u.location, bp.*
        FROM users u JOIN brand_profiles bp ON u.id = bp.user_id
        WHERE u.role = 'brand'
      `;

      results = brands.map((brand) => {
        const score = calculateMatchScore(brand, inf, 'influencer');
        return {
          id: brand.id, displayName: brand.display_name, companyName: brand.company_name,
          biography: brand.biography, avatarColor: brand.avatar_color, location: brand.location,
          industry: brand.industry, campaignGoals: brand.campaign_goals,
          minBudget: brand.min_budget, maxBudget: brand.max_budget, matchScore: score,
        };
      }).filter((r) => r.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore).slice(0, 20);
    }

    res.json({ results });
  } catch (error) { next(error); }
}

export async function getFilterOptions(_req, res) {
  res.json({ categories: CATEGORIES, platforms: PLATFORMS });
}

export async function getTrending(_req, res, next) {
  try {
    const prisma = getPrisma();

    const topInfluencers = await prisma.$queryRaw`
      SELECT
        u.id, u.display_name, u.biography, u.avatar_color, u.location,
        ip.category, ip.niche,
        ip.instagram_handle, ip.instagram_followers, ip.instagram_engagement,
        ip.tiktok_handle, ip.tiktok_followers, ip.tiktok_avg_views,
        ip.youtube_handle, ip.youtube_subscribers, ip.youtube_avg_views,
        ip.min_rate, ip.max_rate,
        COALESCE((SELECT AVG(rating) FROM reviews WHERE reviewee_id = u.id), 0) as avg_rating,
        COALESCE((SELECT COUNT(*) FROM reviews WHERE reviewee_id = u.id), 0) as review_count,
        COALESCE((SELECT COUNT(*) FROM collaboration_requests WHERE (sender_id = u.id OR receiver_id = u.id) AND status = 'accepted'), 0) as collab_count,
        (COALESCE(ip.instagram_followers, 0) + COALESCE(ip.tiktok_followers, 0) + COALESCE(ip.youtube_subscribers, 0)) as total_followers,
        (
          COALESCE(ip.instagram_followers, 0) + COALESCE(ip.tiktok_followers, 0) + COALESCE(ip.youtube_subscribers, 0) +
          COALESCE(ip.instagram_engagement, 0) * 10000 +
          COALESCE((SELECT COUNT(*) FROM collaboration_requests WHERE (sender_id = u.id OR receiver_id = u.id) AND status = 'accepted'), 0) * 50000 +
          COALESCE((SELECT AVG(rating) FROM reviews WHERE reviewee_id = u.id), 0) * 20000
        ) as trending_score
      FROM users u
      JOIN influencer_profiles ip ON u.id = ip.user_id
      WHERE u.role = 'influencer'
      ORDER BY trending_score DESC
      LIMIT 10
    `;

    const topBrands = await prisma.$queryRaw`
      SELECT
        u.id, u.display_name, u.biography, u.avatar_color, u.location,
        bp.company_name, bp.industry, bp.website, bp.product_type,
        bp.target_audience, bp.campaign_goals,
        bp.min_budget, bp.max_budget, bp.preferred_platforms, bp.preferred_categories,
        COALESCE((SELECT AVG(rating) FROM reviews WHERE reviewee_id = u.id), 0) as avg_rating,
        COALESCE((SELECT COUNT(*) FROM reviews WHERE reviewee_id = u.id), 0) as review_count,
        COALESCE((SELECT COUNT(*) FROM collaboration_requests WHERE (sender_id = u.id OR receiver_id = u.id) AND status = 'accepted'), 0) as collab_count,
        (
          COALESCE(bp.max_budget, 0) +
          COALESCE((SELECT COUNT(*) FROM collaboration_requests WHERE (sender_id = u.id OR receiver_id = u.id) AND status = 'accepted'), 0) * 100000 +
          COALESCE((SELECT AVG(rating) FROM reviews WHERE reviewee_id = u.id), 0) * 50000 +
          COALESCE((SELECT COUNT(*) FROM collaboration_requests WHERE (sender_id = u.id OR receiver_id = u.id)), 0) * 20000
        ) as trending_score
      FROM users u
      JOIN brand_profiles bp ON u.id = bp.user_id
      WHERE u.role = 'brand'
      ORDER BY trending_score DESC
      LIMIT 10
    `;

    res.json({
      influencers: topInfluencers.map((r, i) => ({
        rank: i + 1, id: r.id, displayName: r.display_name, biography: r.biography,
        avatarColor: r.avatar_color, location: r.location, category: r.category, niche: r.niche,
        platforms: {
          instagram: { handle: r.instagram_handle, followers: r.instagram_followers, engagement: r.instagram_engagement },
          tiktok: { handle: r.tiktok_handle, followers: r.tiktok_followers, avgViews: r.tiktok_avg_views },
          youtube: { handle: r.youtube_handle, subscribers: r.youtube_subscribers, avgViews: r.youtube_avg_views },
        },
        totalFollowers: Number(r.total_followers),
        minRate: r.min_rate, maxRate: r.max_rate,
        avgRating: r.avg_rating ? Math.round(Number(r.avg_rating) * 10) / 10 : null,
        reviewCount: Number(r.review_count), collabCount: Number(r.collab_count),
        trendingScore: Number(r.trending_score),
      })),
      brands: topBrands.map((r, i) => ({
        rank: i + 1, id: r.id, displayName: r.display_name, companyName: r.company_name,
        biography: r.biography, avatarColor: r.avatar_color, location: r.location,
        industry: r.industry, productType: r.product_type,
        targetAudience: r.target_audience, campaignGoals: r.campaign_goals,
        minBudget: r.min_budget, maxBudget: r.max_budget,
        preferredPlatforms: r.preferred_platforms, preferredCategories: r.preferred_categories,
        website: r.website,
        avgRating: r.avg_rating ? Math.round(Number(r.avg_rating) * 10) / 10 : null,
        reviewCount: Number(r.review_count), collabCount: Number(r.collab_count),
        trendingScore: Number(r.trending_score),
      })),
    });
  } catch (error) { next(error); }
}

/* ──────── Match score calculator ──────── */
function calculateMatchScore(brand, influencer, perspective) {
  let score = 0;
  let factors = 0;

  const prefCats = (brand.preferred_categories || brand.preferredCategories || '').toLowerCase();
  const infCat = (influencer.category || '').toLowerCase();
  if (prefCats && infCat && prefCats.includes(infCat)) score += 30;
  else if (infCat) score += 5;
  factors += 30;

  const prefPlat = (brand.preferred_platforms || brand.preferredPlatforms || '').toLowerCase();
  let platScore = 0;
  if (prefPlat) {
    if (prefPlat.includes('instagram') && (influencer.instagram_followers || influencer.instagramFollowers || 0) > 0) platScore += 7;
    if (prefPlat.includes('tiktok') && (influencer.tiktok_followers || influencer.tiktokFollowers || 0) > 0) platScore += 7;
    if (prefPlat.includes('youtube') && (influencer.youtube_subscribers || influencer.youtubeSubscribers || 0) > 0) platScore += 6;
  } else {
    if ((influencer.instagram_followers || influencer.instagramFollowers || 0) > 0) platScore += 7;
    if ((influencer.tiktok_followers || influencer.tiktokFollowers || 0) > 0) platScore += 7;
    if ((influencer.youtube_subscribers || influencer.youtubeSubscribers || 0) > 0) platScore += 6;
  }
  score += platScore;
  factors += 20;

  const budgetOverlap = checkBudgetOverlap(
    brand.min_budget || brand.minBudget, brand.max_budget || brand.maxBudget,
    influencer.min_rate || influencer.minRate, influencer.max_rate || influencer.maxRate
  );
  score += Math.round(budgetOverlap * 25);
  factors += 25;

  const targetAud = (brand.target_audience || brand.targetAudience || '').toLowerCase();
  const audLoc = (influencer.audience_location || influencer.audienceLocation || '').toLowerCase();
  if (targetAud && audLoc) {
    const targetWords = targetAud.split(/[,\s]+/);
    const locWords = audLoc.split(/[,\s]+/);
    const overlap = targetWords.filter((w) => locWords.some((l) => l.includes(w) || w.includes(l)));
    score += overlap.length > 0 ? 15 : 3;
  } else {
    score += 5;
  }
  factors += 15;

  const engagement = influencer.instagram_engagement || influencer.instagramEngagement || 0;
  if (engagement >= 5) score += 10;
  else if (engagement >= 3) score += 7;
  else if (engagement >= 1) score += 4;
  else score += 1;
  factors += 10;

  return Math.min(99, Math.round((score / factors) * 100));
}

function checkBudgetOverlap(brandMin, brandMax, infMin, infMax) {
  if (!brandMax && !infMax) return 0.5;
  if (!brandMax) return 0.4;
  if (!infMax) return 0.4;
  const overlapStart = Math.max(brandMin || 0, infMin || 0);
  const overlapEnd = Math.min(brandMax, infMax);
  if (overlapEnd >= overlapStart) return 1;
  const gap = overlapStart - overlapEnd;
  const range = Math.max(brandMax, infMax) - Math.min(brandMin || 0, infMin || 0);
  if (range === 0) return 0.5;
  return Math.max(0, 1 - gap / range);
}
