import { Router } from 'express';
import authenticate from '../middleware/authenticate.js';
import {
  saveInfluencerProfile,
  saveBrandProfile,
  getPublicProfile,
  updateMyProfile,
} from '../controllers/profileController.js';

const router = Router();

router.put('/influencer', authenticate, saveInfluencerProfile);
router.put('/brand', authenticate, saveBrandProfile);
router.put('/me', authenticate, updateMyProfile);
router.get('/:userId', authenticate, getPublicProfile);

export default router;
