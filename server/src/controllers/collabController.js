import { randomUUID } from 'crypto';
import { getDb, dbRun, dbGet, dbAll } from '../lib/database.js';

/* ── Send collab request ── */
export async function sendRequest(req, res, next) {
  try {
    const db = getDb();
    const senderId = req.userId;
    const { receiverId, message, campaignTitle, budgetOffered, tenureType, tenureValue, tenureUnit } = req.body;

    const normalizedType = tenureType === 'lifertime' ? 'lifertime' : 'fixed';
    let normalizedTenureValue = null;
    let normalizedTenureUnit = null;
    let normalizedTenureDays = null;

    if (normalizedType === 'fixed') {
      const unit = ['days', 'months', 'years'].includes(tenureUnit) ? tenureUnit : 'days';
      const value = Number(tenureValue);
      if (!Number.isInteger(value) || value < 1) {
        return res.status(400).json({ message: 'Tenure value must be a positive whole number' });
      }

      const multiplier = unit === 'days' ? 1 : unit === 'months' ? 30 : 365;
      const days = value * multiplier;
      if (days < 20) {
        return res.status(400).json({ message: 'Tenure must be at least 20 days' });
      }

      normalizedTenureValue = value;
      normalizedTenureUnit = unit;
      normalizedTenureDays = days;
    }

    if (senderId === receiverId) {
      return res.status(400).json({ message: 'Cannot send request to yourself' });
    }

    // check if a pending request already exists between these users
    const existing = await dbGet(db,
      `SELECT id FROM collaboration_requests
       WHERE sender_id = ? AND receiver_id = ? AND status IN ('pending', 'negotiating')`,
      [senderId, receiverId]
    );
    if (existing) {
      return res.status(409).json({ message: 'You already have a pending request with this user' });
    }

    const id = randomUUID();
    await dbRun(db,
      `INSERT INTO collaboration_requests (id, sender_id, receiver_id, message, campaign_title, budget_offered, tenure_days, tenure_value, tenure_unit)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        senderId,
        receiverId,
        message || '',
        campaignTitle || '',
        budgetOffered || 0,
        normalizedTenureDays,
        normalizedTenureValue,
        normalizedTenureUnit,
      ]
    );

    // create notification for receiver
    const sender = await dbGet(db, 'SELECT display_name FROM users WHERE id = ?', [senderId]);
    await dbRun(db,
      `INSERT INTO notifications (id, user_id, type, title, body, related_id)
       VALUES (?, ?, 'collab_request', ?, ?, ?)`,
      [randomUUID(), receiverId, 'New collaboration request',
        `${sender?.display_name || 'Someone'} wants to collaborate with you — Budget: NPR ${(budgetOffered || 0).toLocaleString()} • Tenure: ${normalizedType === 'lifertime' ? 'Lifertime' : `${normalizedTenureValue} ${normalizedTenureUnit}`}`,
        id,
      ]
    );

    res.status(201).json({ id, message: 'Request sent' });
  } catch (error) { next(error); }
}

/* ── Respond to request (accept / reject / negotiate) ── */
export async function respondToRequest(req, res, next) {
  try {
    const db = getDb();
    const userId = req.userId;
    const { requestId } = req.params;
    const { status, message } = req.body; // status: accepted, rejected, negotiating

    // Allow both sender and receiver to respond during negotiation
    const request = await dbGet(db,
      'SELECT * FROM collaboration_requests WHERE id = ?',
      [requestId]
    );
    if (!request) return res.status(404).json({ message: 'Request not found' });

    // Check the user is part of this request
    const isSender = request.sender_id === userId;
    const isReceiver = request.receiver_id === userId;
    if (!isSender && !isReceiver) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Senders can only respond during negotiation (accept counter, reject, or counter back)
    if (isSender && request.status !== 'negotiating') {
      return res.status(400).json({ message: 'You can only respond during negotiation' });
    }

    // Receivers can respond to pending or negotiating
    if (isReceiver && request.status !== 'pending' && request.status !== 'negotiating') {
      return res.status(400).json({ message: 'Request already resolved' });
    }

    await dbRun(
      db,
      `UPDATE collaboration_requests
       SET status = ?,
           message = COALESCE(?, message),
           accepted_at = CASE
             WHEN ? = 'accepted' AND accepted_at IS NULL THEN CURRENT_TIMESTAMP
             WHEN ? <> 'accepted' THEN NULL
             ELSE accepted_at
           END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, message, status, status, requestId]
    );

    // Determine who to notify
    const otherUserId = isSender ? request.receiver_id : request.sender_id;
    const responder = await dbGet(db, 'SELECT display_name FROM users WHERE id = ?', [userId]);
    const statusText = status === 'accepted' ? 'accepted' : status === 'rejected' ? 'declined' : 'wants to negotiate';
    await dbRun(db,
      `INSERT INTO notifications (id, user_id, type, title, body, related_id)
       VALUES (?, ?, 'collab_response', ?, ?, ?)`,
      [randomUUID(), otherUserId, `Collaboration ${status}`,
        `${responder?.display_name || 'Someone'} ${statusText} your collaboration request`, requestId]
    );

    res.json({ message: `Request ${status}` });
  } catch (error) { next(error); }
}

/* ── Send counter-offer (negotiation message) ── */
export async function sendCounterOffer(req, res, next) {
  try {
    const db = getDb();
    const userId = req.userId;
    const { requestId } = req.params;
    const { message, proposedBudget } = req.body;

    const request = await dbGet(db,
      'SELECT * FROM collaboration_requests WHERE id = ?',
      [requestId]
    );
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const isSender = request.sender_id === userId;
    const isReceiver = request.receiver_id === userId;
    if (!isSender && !isReceiver) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (request.status !== 'pending' && request.status !== 'negotiating') {
      return res.status(400).json({ message: 'Cannot negotiate on a resolved request' });
    }

    // Update the request status to negotiating and update the budget
    await dbRun(db,
      `UPDATE collaboration_requests SET status = 'negotiating', budget_offered = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [proposedBudget || request.budget_offered, requestId]
    );

    // Save the negotiation message
    const msgId = randomUUID();
    await dbRun(db,
      `INSERT INTO negotiation_messages (id, request_id, sender_id, message, proposed_budget, action)
       VALUES (?, ?, ?, ?, ?, 'counter')`,
      [msgId, requestId, userId, message || '', proposedBudget || 0]
    );

    // Notify the other party
    const otherUserId = isSender ? request.receiver_id : request.sender_id;
    const counterParty = await dbGet(db, 'SELECT display_name FROM users WHERE id = ?', [userId]);
    await dbRun(db,
      `INSERT INTO notifications (id, user_id, type, title, body, related_id)
       VALUES (?, ?, 'negotiation', ?, ?, ?)`,
      [randomUUID(), otherUserId, 'Counter-offer received',
        `${counterParty?.display_name || 'Someone'} proposed NPR ${(proposedBudget || 0).toLocaleString()} — "${(message || '').slice(0, 80)}"`, requestId]
    );

    res.json({ message: 'Counter-offer sent', id: msgId });
  } catch (error) { next(error); }
}

/* ── Get negotiation history for a request ── */
export async function getNegotiationHistory(req, res, next) {
  try {
    const db = getDb();
    const userId = req.userId;
    const { requestId } = req.params;

    const request = await dbGet(db,
      'SELECT * FROM collaboration_requests WHERE id = ?',
      [requestId]
    );
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.sender_id !== userId && request.receiver_id !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const messages = await dbAll(db, `
      SELECT nm.*, u.display_name as sender_name, u.avatar_color as sender_color
      FROM negotiation_messages nm
      JOIN users u ON nm.sender_id = u.id
      WHERE nm.request_id = ?
      ORDER BY nm.created_at ASC
    `, [requestId]);

    res.json({
      requestId,
      originalBudget: request.budget_offered,
      currentStatus: request.status,
      messages: messages.map((m) => ({
        id: m.id,
        senderId: m.sender_id,
        senderName: m.sender_name,
        senderColor: m.sender_color,
        message: m.message,
        proposedBudget: m.proposed_budget,
        action: m.action,
        createdAt: m.created_at,
      })),
    });
  } catch (error) { next(error); }
}

/* ── Get my requests (sent + received) ── */
export async function getMyRequests(req, res, next) {
  try {
    const db = getDb();
    const userId = req.userId;

    const sent = await dbAll(db, `
      SELECT cr.*, u.display_name as receiver_name, u.avatar_color as receiver_color, u.role as receiver_role
      FROM collaboration_requests cr
      JOIN users u ON cr.receiver_id = u.id
      WHERE cr.sender_id = ?
      ORDER BY cr.created_at DESC
    `, [userId]);

    const received = await dbAll(db, `
      SELECT cr.*, u.display_name as sender_name, u.avatar_color as sender_color, u.role as sender_role
      FROM collaboration_requests cr
      JOIN users u ON cr.sender_id = u.id
      WHERE cr.receiver_id = ?
      ORDER BY cr.created_at DESC
    `, [userId]);

    res.json({
      sent: sent.map(formatRequest),
      received: received.map(formatRequest),
    });
  } catch (error) { next(error); }
}

/* ── Get my notifications ── */
export async function getNotifications(req, res, next) {
  try {
    const db = getDb();
    const notifications = await dbAll(db,
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30',
      [req.userId]
    );
    res.json({ notifications });
  } catch (error) { next(error); }
}

/* ── Mark notification read ── */
export async function markNotificationRead(req, res, next) {
  try {
    const db = getDb();
    await dbRun(db,
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.notifId, req.userId]
    );
    res.json({ message: 'Marked as read' });
  } catch (error) { next(error); }
}

function formatRequest(r) {
  return {
    id: r.id,
    senderId: r.sender_id,
    receiverId: r.receiver_id,
    senderName: r.sender_name,
    senderColor: r.sender_color,
    senderRole: r.sender_role,
    receiverName: r.receiver_name,
    receiverColor: r.receiver_color,
    receiverRole: r.receiver_role,
    message: r.message,
    status: r.status,
    campaignTitle: r.campaign_title,
    budgetOffered: r.budget_offered,
    tenureDays: r.tenure_days,
    tenureValue: r.tenure_value,
    tenureUnit: r.tenure_unit,
    acceptedAt: r.accepted_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
