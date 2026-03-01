import { Router } from 'express';
import authenticate from '../middleware/authenticate.js';
import {
  searchInfluencers,
  searchBrands,
  getRecommendations,
  getFilterOptions,
  getTrending,
} from '../controllers/discoverController.js';

const router = Router();

router.get('/influencers', authenticate, searchInfluencers);
router.get('/brands', authenticate, searchBrands);
router.get('/recommendations', authenticate, getRecommendations);
router.get('/filters', authenticate, getFilterOptions);
router.get('/trending', authenticate, getTrending);

export default router;
