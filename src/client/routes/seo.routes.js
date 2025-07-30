import { Router } from 'express';
import * as SeoController from '../controllers/seo/seo.controller.js';

const router = Router();

router.get('/api/sitemap.xml', SeoController.generateMainSitemapIndex);
router.get('/api/sitemap-:lang.xml', SeoController.generateSitemapForLangPart);
router.get('/api/googlefid-:lang.xml', SeoController.generateGoogleXML);

export default router;
