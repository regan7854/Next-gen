import { Router } from 'express';
import authenticate from '../middleware/authenticate.js';
import {
  sendRequest,
  respondToRequest,
  getMyRequests,
  getNotifications,
  markNotificationRead,
  sendCounterOffer,
  getNegotiationHistory,
} from '../controllers/collabController.js';

const router = Router();

router.post('/', authenticate, sendRequest);
router.get('/', authenticate, getMyRequests);
router.patch('/:requestId', authenticate, respondToRequest);
router.post('/:requestId/counter', authenticate, sendCounterOffer);
router.get('/:requestId/negotiation', authenticate, getNegotiationHistory);
router.get('/notifications', authenticate, getNotifications);
router.patch('/notifications/:notifId/read', authenticate, markNotificationRead);

export default router;
