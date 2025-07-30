import { Router } from 'express';
import * as TemplateApiController from '../controllers/templates/template.controller.js';

const router = Router();

router.get('/api/client/json/template/:id', TemplateApiController.getOne); // API

export default router;
