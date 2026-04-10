import { randomUUID } from 'crypto';
import { getPrisma } from '../lib/prisma.js';

/* ── Send collab request ── */
export async function sendRequest(req, res, next) {
  try {
    const prisma = getPrisma();
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

    const existing = await prisma.collaborationRequest.findFirst({
      where: {
        senderId,
        receiverId,
        status: { in: ['pending', 'negotiating'] },
      },
    });
    if (existing) {
      return res.status(409).json({ message: 'You already have a pending request with this user' });
    }

    const id = randomUUID();
    await prisma.collaborationRequest.create({
      data: {
        id,
        senderId,
        receiverId,
        message: message || '',
        campaignTitle: campaignTitle || '',
        budgetOffered: budgetOffered || 0,
        tenureDays: normalizedTenureDays,
        tenureValue: normalizedTenureValue,
        tenureUnit: normalizedTenureUnit,
      },
    });

    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { displayName: true },
    });
    await prisma.notification.create({
      data: {
        id: randomUUID(),
        userId: receiverId,
        type: 'collab_request',
        title: 'New collaboration request',
        body: `${sender?.displayName || 'Someone'} wants to collaborate with you — Budget: NPR ${(budgetOffered || 0).toLocaleString()} • Tenure: ${normalizedType === 'lifertime' ? 'Lifertime' : `${normalizedTenureValue} ${normalizedTenureUnit}`}`,
        relatedId: id,
      },
    });

    res.status(201).json({ id, message: 'Request sent' });
  } catch (error) { next(error); }
}

/* ── Respond to request (accept / reject / negotiate) ── */
export async function respondToRequest(req, res, next) {
  try {
    const prisma = getPrisma();
    const userId = req.userId;
    const { requestId } = req.params;
    const { status, message } = req.body;

    const request = await prisma.collaborationRequest.findUnique({ where: { id: requestId } });
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const isSender = request.senderId === userId;
    const isReceiver = request.receiverId === userId;
    if (!isSender && !isReceiver) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (isSender && request.status !== 'negotiating') {
      return res.status(400).json({ message: 'You can only respond during negotiation' });
    }

    if (isReceiver && request.status !== 'pending' && request.status !== 'negotiating') {
      return res.status(400).json({ message: 'Request already resolved' });
    }

    await prisma.collaborationRequest.update({
      where: { id: requestId },
      data: {
        status,
        message: message ?? request.message,
        acceptedAt: status === 'accepted' && !request.acceptedAt
          ? new Date()
          : status !== 'accepted' ? null : request.acceptedAt,
      },
    });

    const otherUserId = isSender ? request.receiverId : request.senderId;
    const responder = await prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true },
    });
    const statusText = status === 'accepted' ? 'accepted' : status === 'rejected' ? 'declined' : 'wants to negotiate';
    await prisma.notification.create({
      data: {
        id: randomUUID(),
        userId: otherUserId,
        type: 'collab_response',
        title: `Collaboration ${status}`,
        body: `${responder?.displayName || 'Someone'} ${statusText} your collaboration request`,
        relatedId: requestId,
      },
    });

    res.json({ message: `Request ${status}` });
  } catch (error) { next(error); }
}

/* ── Send counter-offer (negotiation message) ── */
export async function sendCounterOffer(req, res, next) {
  try {
    const prisma = getPrisma();
    const userId = req.userId;
    const { requestId } = req.params;
    const { message, proposedBudget, proposedTenureValue, proposedTenureUnit } = req.body;

    const request = await prisma.collaborationRequest.findUnique({ where: { id: requestId } });
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const isSender = request.senderId === userId;
    const isReceiver = request.receiverId === userId;
    if (!isSender && !isReceiver) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (request.status !== 'pending' && request.status !== 'negotiating') {
      return res.status(400).json({ message: 'Cannot negotiate on a resolved request' });
    }

    let newTenureValue = proposedTenureValue ? Number(proposedTenureValue) : null;
    let newTenureUnit = proposedTenureUnit || null;
    let newTenureDays = null;
    if (newTenureValue && newTenureUnit) {
      const multiplier = newTenureUnit === 'days' ? 1 : newTenureUnit === 'months' ? 30 : 365;
      newTenureDays = newTenureValue * multiplier;
    }

    await prisma.collaborationRequest.update({
      where: { id: requestId },
      data: {
        status: 'negotiating',
        budgetOffered: proposedBudget || request.budgetOffered,
        tenureValue: newTenureValue ?? request.tenureValue,
        tenureUnit: newTenureUnit ?? request.tenureUnit,
        tenureDays: newTenureDays ?? request.tenureDays,
      },
    });

    const msgId = randomUUID();
    await prisma.negotiationMessage.create({
      data: {
        id: msgId,
        requestId,
        senderId: userId,
        message: message || '',
        proposedBudget: proposedBudget || 0,
        proposedTenureValue: newTenureValue,
        proposedTenureUnit: newTenureUnit,
        action: 'counter',
      },
    });

    const otherUserId = isSender ? request.receiverId : request.senderId;
    const counterParty = await prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true },
    });
    const tenureText = newTenureValue && newTenureUnit ? ` • Tenure: ${newTenureValue} ${newTenureUnit}` : '';
    await prisma.notification.create({
      data: {
        id: randomUUID(),
        userId: otherUserId,
        type: 'negotiation',
        title: 'Counter-offer received',
        body: `${counterParty?.displayName || 'Someone'} proposed NPR ${(proposedBudget || 0).toLocaleString()}${tenureText} — "${(message || '').slice(0, 80)}"`,
        relatedId: requestId,
      },
    });

    res.json({ message: 'Counter-offer sent', id: msgId });
  } catch (error) { next(error); }
}

/* ── Get negotiation history for a request ── */
export async function getNegotiationHistory(req, res, next) {
  try {
    const prisma = getPrisma();
    const userId = req.userId;
    const { requestId } = req.params;

    const request = await prisma.collaborationRequest.findUnique({ where: { id: requestId } });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.senderId !== userId && request.receiverId !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const messages = await prisma.negotiationMessage.findMany({
      where: { requestId },
      include: {
        sender: { select: { displayName: true, avatarColor: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      requestId,
      originalBudget: request.budgetOffered,
      originalTenureValue: request.tenureValue,
      originalTenureUnit: request.tenureUnit,
      currentStatus: request.status,
      messages: messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderName: m.sender?.displayName,
        senderColor: m.sender?.avatarColor,
        message: m.message,
        proposedBudget: m.proposedBudget,
        proposedTenureValue: m.proposedTenureValue,
        proposedTenureUnit: m.proposedTenureUnit,
        action: m.action,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) { next(error); }
}

/* ── Get my requests (sent + received) ── */
export async function getMyRequests(req, res, next) {
  try {
    const prisma = getPrisma();
    const userId = req.userId;

    const sent = await prisma.collaborationRequest.findMany({
      where: { senderId: userId },
      include: {
        receiver: { select: { displayName: true, avatarColor: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const received = await prisma.collaborationRequest.findMany({
      where: { receiverId: userId },
      include: {
        sender: { select: { displayName: true, avatarColor: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      sent: sent.map((r) => formatRequest(r, 'sent')),
      received: received.map((r) => formatRequest(r, 'received')),
    });
  } catch (error) { next(error); }
}

/* ── Get my notifications ── */
export async function getNotifications(req, res, next) {
  try {
    const prisma = getPrisma();
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    res.json({ notifications });
  } catch (error) { next(error); }
}

/* ── Mark notification read ── */
export async function markNotificationRead(req, res, next) {
  try {
    const prisma = getPrisma();
    await prisma.notification.updateMany({
      where: { id: req.params.notifId, userId: req.userId },
      data: { isRead: true },
    });
    res.json({ message: 'Marked as read' });
  } catch (error) { next(error); }
}

function formatRequest(r, direction) {
  return {
    id: r.id,
    senderId: r.senderId,
    receiverId: r.receiverId,
    senderName: r.sender?.displayName,
    senderColor: r.sender?.avatarColor,
    senderRole: r.sender?.role,
    receiverName: r.receiver?.displayName,
    receiverColor: r.receiver?.avatarColor,
    receiverRole: r.receiver?.role,
    message: r.message,
    status: r.status,
    campaignTitle: r.campaignTitle,
    budgetOffered: r.budgetOffered,
    tenureDays: r.tenureDays,
    tenureValue: r.tenureValue,
    tenureUnit: r.tenureUnit,
    acceptedAt: r.acceptedAt,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}
