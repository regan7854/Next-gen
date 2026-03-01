import { Router } from 'express';
import authenticate from '../middleware/authenticate.js';
import {
  addCampaign,
  getMyCampaigns,
  deleteCampaign,
  leaveReview,
  getReviewsFor,
} from '../controllers/campaignController.js';

const router = Router();

router.post('/', authenticate, addCampaign);
router.get('/mine', authenticate, getMyCampaigns);
router.delete('/:campaignId', authenticate, deleteCampaign);
router.post('/reviews', authenticate, leaveReview);
router.get('/reviews/:userId', authenticate, getReviewsFor);

export default router;
