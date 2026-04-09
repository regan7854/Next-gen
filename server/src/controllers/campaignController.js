import { randomUUID } from 'crypto';
import { getDb, dbRun, dbGet, dbAll } from '../lib/database.js';

/* ── Add campaign / portfolio item ── */
export async function addCampaign(req, res, next) {
  try {
    const db = getDb();
    const userId = req.userId;
    const { title, description, platform, resultsSummary, reach, engagement, imageUrl } = req.body;

    const id = randomUUID();
    await dbRun(db,
      `INSERT INTO campaigns (id, user_id, title, description, platform, results_summary, reach, engagement, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, title, description || '', platform || '', resultsSummary || '', reach || 0, engagement || 0, imageUrl || '']
    );

    res.status(201).json({ id, message: 'Campaign added' });
  } catch (error) { next(error); }
}

/* ── Get my campaigns ── */
export async function getMyCampaigns(req, res, next) {
  try {
    const db = getDb();
    const campaigns = await dbAll(db,
      'SELECT * FROM campaigns WHERE user_id = ? ORDER BY created_at DESC',
      [req.userId]
    );
    res.json({ campaigns });
  } catch (error) { next(error); }
}

/* ── Delete campaign ── */
export async function deleteCampaign(req, res, next) {
  try {
    const db = getDb();
    await dbRun(db,
      'DELETE FROM campaigns WHERE id = ? AND user_id = ?',
      [req.params.campaignId, req.userId]
    );
    res.json({ message: 'Campaign deleted' });
  } catch (error) { next(error); }
}

/* ── Leave a review ── */
export async function leaveReview(req, res, next) {
  try {
    const db = getDb();
    const reviewerId = req.userId;
    const { revieweeId, collabRequestId, rating, comment } = req.body;

    if (reviewerId === revieweeId) {
      return res.status(400).json({ message: 'Cannot review yourself' });
    }

    if (collabRequestId) {
      const existing = await dbGet(db,
        'SELECT id FROM reviews WHERE reviewer_id = ? AND collab_request_id = ?',
        [reviewerId, collabRequestId]
      );
      if (existing) return res.status(409).json({ message: 'Already reviewed this collaboration' });
    }

    const id = randomUUID();
    await dbRun(db,
      `INSERT INTO reviews (id, reviewer_id, reviewee_id, collab_request_id, rating, comment)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, reviewerId, revieweeId, collabRequestId || null, rating, comment || '']
    );

    const reviewer = await dbGet(db, 'SELECT display_name FROM users WHERE id = ?', [reviewerId]);
    await dbRun(db,
      `INSERT INTO notifications (id, user_id, type, title, body, related_id)
       VALUES (?, ?, 'review', ?, ?, ?)`,
      [randomUUID(), revieweeId, 'New review',
        `${reviewer?.display_name || 'Someone'} left you a ${rating}-star review`, id]
    );

    res.status(201).json({ id, message: 'Review submitted' });
  } catch (error) { next(error); }
}

/* ── Get reviews for a user ── */
export async function getReviewsFor(req, res, next) {
  try {
    const db = getDb();
    const { userId } = req.params;

    const reviews = await dbAll(db,
      `SELECT r.*, u.display_name as reviewer_name, u.avatar_color as reviewer_color
       FROM reviews r JOIN users u ON r.reviewer_id = u.id
       WHERE r.reviewee_id = ? ORDER BY r.created_at DESC`,
      [userId]
    );

    const avgRow = await dbGet(db,
      'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE reviewee_id = ?',
      [userId]
    );

    res.json({
      reviews,
      avgRating: avgRow?.avg_rating ? Math.round(avgRow.avg_rating * 10) / 10 : null,
      reviewCount: avgRow?.count || 0,
    });
  } catch (error) { next(error); }
}
