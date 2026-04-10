import { randomUUID } from 'crypto';
import { getPrisma } from '../lib/prisma.js';

/* ── Add campaign / portfolio item ── */
export async function addCampaign(req, res, next) {
  try {
    const prisma = getPrisma();
    const userId = req.userId;
    const { title, description, platform, resultsSummary, reach, engagement, imageUrl } = req.body;

    const id = randomUUID();
    await prisma.campaign.create({
      data: {
        id,
        userId,
        title,
        description: description || '',
        platform: platform || '',
        resultsSummary: resultsSummary || '',
        reach: reach || 0,
        engagement: engagement || 0,
        imageUrl: imageUrl || '',
      },
    });

    res.status(201).json({ id, message: 'Campaign added' });
  } catch (error) { next(error); }
}

/* ── Get my campaigns ── */
export async function getMyCampaigns(req, res, next) {
  try {
    const prisma = getPrisma();
    const campaigns = await prisma.campaign.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ campaigns });
  } catch (error) { next(error); }
}

/* ── Delete campaign ── */
export async function deleteCampaign(req, res, next) {
  try {
    const prisma = getPrisma();
    await prisma.campaign.deleteMany({
      where: { id: req.params.campaignId, userId: req.userId },
    });
    res.json({ message: 'Campaign deleted' });
  } catch (error) { next(error); }
}

/* ── Leave a review ── */
export async function leaveReview(req, res, next) {
  try {
    const prisma = getPrisma();
    const reviewerId = req.userId;
    const { revieweeId, collabRequestId, rating, comment } = req.body;

    if (reviewerId === revieweeId) {
      return res.status(400).json({ message: 'Cannot review yourself' });
    }

    if (collabRequestId) {
      const existing = await prisma.review.findFirst({
        where: { reviewerId, collabRequestId },
      });
      if (existing) return res.status(409).json({ message: 'Already reviewed this collaboration' });
    }

    const id = randomUUID();
    await prisma.review.create({
      data: {
        id,
        reviewerId,
        revieweeId,
        collabRequestId: collabRequestId || null,
        rating,
        comment: comment || '',
      },
    });

    const reviewer = await prisma.user.findUnique({
      where: { id: reviewerId },
      select: { displayName: true },
    });
    await prisma.notification.create({
      data: {
        id: randomUUID(),
        userId: revieweeId,
        type: 'review',
        title: 'New review',
        body: `${reviewer?.displayName || 'Someone'} left you a ${rating}-star review`,
        relatedId: id,
      },
    });

    res.status(201).json({ id, message: 'Review submitted' });
  } catch (error) { next(error); }
}

/* ── Get reviews for a user ── */
export async function getReviewsFor(req, res, next) {
  try {
    const prisma = getPrisma();
    const { userId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { revieweeId: userId },
      include: {
        reviewer: { select: { displayName: true, avatarColor: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const avgRow = await prisma.review.aggregate({
      where: { revieweeId: userId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    res.json({
      reviews: reviews.map((r) => ({
        ...r,
        reviewer_name: r.reviewer?.displayName,
        reviewer_color: r.reviewer?.avatarColor,
      })),
      avgRating: avgRow._avg.rating ? Math.round(avgRow._avg.rating * 10) / 10 : null,
      reviewCount: avgRow._count.rating || 0,
    });
  } catch (error) { next(error); }
}
