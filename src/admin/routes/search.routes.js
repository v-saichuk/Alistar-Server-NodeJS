import { Router } from 'express';
import * as SearchController from '../controllers/search/search.controller.js';

const router = Router();

router.post('/api/search-products', SearchController.searchProducts);
router.get('/api/users/search', SearchController.searchUsers);

export default router;
