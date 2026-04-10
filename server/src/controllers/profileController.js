import { randomUUID } from 'crypto';
import { getPrisma } from '../lib/prisma.js';

/* ── Save / update influencer profile ── */
export async function saveInfluencerProfile(req, res, next) {
  try {
    const prisma = getPrisma();
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
    await prisma.user.update({
      where: { id: userId },
      data: {
        role: 'influencer',
        biography: biography ?? undefined,
        location: location ?? undefined,
      },
    });

    await prisma.influencerProfile.upsert({
      where: { userId },
      update: {
        category, niche,
        instagramHandle, instagramFollowers: instagramFollowers || 0, instagramEngagement: instagramEngagement || 0,
        tiktokHandle, tiktokFollowers: tiktokFollowers || 0, tiktokAvgViews: tiktokAvgViews || 0,
        youtubeHandle, youtubeSubscribers: youtubeSubscribers || 0, youtubeAvgViews: youtubeAvgViews || 0,
        audienceAgeRange, audienceLocation,
        minRate: minRate || 0, maxRate: maxRate || 0,
      },
      create: {
        userId,
        category, niche,
        instagramHandle, instagramFollowers: instagramFollowers || 0, instagramEngagement: instagramEngagement || 0,
        tiktokHandle, tiktokFollowers: tiktokFollowers || 0, tiktokAvgViews: tiktokAvgViews || 0,
        youtubeHandle, youtubeSubscribers: youtubeSubscribers || 0, youtubeAvgViews: youtubeAvgViews || 0,
        audienceAgeRange, audienceLocation,
        minRate: minRate || 0, maxRate: maxRate || 0,
      },
    });

    res.json({ message: 'Profile saved' });
  } catch (error) { next(error); }
}

/* ── Save / update brand profile ── */
export async function saveBrandProfile(req, res, next) {
  try {
    const prisma = getPrisma();
    const userId = req.userId;
    const {
      companyName, industry, website, productType,
      targetAudience, campaignGoals,
      minBudget, maxBudget,
      preferredPlatforms, preferredCategories,
      biography, location,
    } = req.body;

    await prisma.user.update({
      where: { id: userId },
      data: {
        role: 'brand',
        displayName: companyName ?? undefined,
        biography: biography ?? undefined,
        location: location ?? undefined,
      },
    });

    await prisma.brandProfile.upsert({
      where: { userId },
      update: {
        companyName, industry, website, productType,
        targetAudience, campaignGoals,
        minBudget: minBudget || 0, maxBudget: maxBudget || 0,
        preferredPlatforms, preferredCategories,
      },
      create: {
        userId,
        companyName, industry, website, productType,
        targetAudience, campaignGoals,
        minBudget: minBudget || 0, maxBudget: maxBudget || 0,
        preferredPlatforms, preferredCategories,
      },
    });

    res.json({ message: 'Profile saved' });
  } catch (error) { next(error); }
}

/* ── Get any user's full profile (public view) ── */
export async function getPublicProfile(req, res, next) {
  try {
    const prisma = getPrisma();
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, displayName: true, email: true, role: true,
        biography: true, avatarColor: true, location: true, createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    let profile = null;
    if (user.role === 'influencer') {
      profile = await prisma.influencerProfile.findUnique({ where: { userId } });
    } else if (user.role === 'brand') {
      profile = await prisma.brandProfile.findUnique({ where: { userId } });
    }

    const campaigns = await prisma.campaign.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const ratingAgg = await prisma.review.aggregate({
      where: { revieweeId: userId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const reviews = await prisma.review.findMany({
      where: { revieweeId: userId },
      include: {
        reviewer: { select: { displayName: true, avatarColor: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({
      user: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        biography: user.biography,
        avatarColor: user.avatarColor,
        location: user.location,
        createdAt: user.createdAt,
      },
      profile: profile ? formatProfile(profile, user.role) : null,
      campaigns,
      rating: ratingAgg._avg.rating ? Math.round(ratingAgg._avg.rating * 10) / 10 : null,
      reviewCount: ratingAgg._count.rating || 0,
      reviews: reviews.map((r) => ({
        ...r,
        reviewer_name: r.reviewer?.displayName,
        reviewer_color: r.reviewer?.avatarColor,
      })),
    });
  } catch (error) { next(error); }
}

/* ── Update user's own profile (generic fields) ── */
export async function updateMyProfile(req, res, next) {
  try {
    const prisma = getPrisma();
    const userId = req.userId;
    const { displayName, biography, location } = req.body;

    await prisma.user.update({
      where: { id: userId },
      data: {
        displayName: displayName ?? undefined,
        biography: biography ?? undefined,
        location: location ?? undefined,
      },
    });

    res.json({ message: 'Profile updated' });
  } catch (error) { next(error); }
}

function formatProfile(p, role) {
  if (role === 'influencer') {
    return {
      category: p.category,
      niche: p.niche,
      instagramHandle: p.instagramHandle,
      instagramFollowers: p.instagramFollowers,
      instagramEngagement: p.instagramEngagement,
      tiktokHandle: p.tiktokHandle,
      tiktokFollowers: p.tiktokFollowers,
      tiktokAvgViews: p.tiktokAvgViews,
      youtubeHandle: p.youtubeHandle,
      youtubeSubscribers: p.youtubeSubscribers,
      youtubeAvgViews: p.youtubeAvgViews,
      audienceAgeRange: p.audienceAgeRange,
      audienceLocation: p.audienceLocation,
      minRate: p.minRate,
      maxRate: p.maxRate,
    };
  }
  return {
    companyName: p.companyName,
    industry: p.industry,
    website: p.website,
    productType: p.productType,
    targetAudience: p.targetAudience,
    campaignGoals: p.campaignGoals,
    minBudget: p.minBudget,
    maxBudget: p.maxBudget,
    preferredPlatforms: p.preferredPlatforms,
    preferredCategories: p.preferredCategories,
  };
}
