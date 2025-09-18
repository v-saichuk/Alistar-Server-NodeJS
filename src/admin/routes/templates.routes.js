import { Router } from 'express';
import checkAuth from '../../shared/utils/checkAuth.js';
import * as TemplatesController from '../controllers/templates/templates.controller.js';
import * as TemplateSectionController from '../controllers/templates/sections/template.section.controller.js';
import * as TemplateFieldsController from '../controllers/templates/fields/template.fields.controller.js';
import * as TemplateValidation from '../../admin/validators/templates.validation.js';

const router = Router();
router.get('/api/admin/json/template/:id', TemplatesController.getOne);

router.get('/api/template', TemplatesController.getAll);
router.get('/api/template/:id', TemplatesController.getOne);
router.post('/api/template', checkAuth, TemplateValidation.create, TemplatesController.create);
router.patch('/api/template/:id', checkAuth, TemplateValidation.update, TemplatesController.update);
router.delete('/api/template/:id', checkAuth, TemplatesController.remove);

router.post('/api/template/section/action', checkAuth, TemplateSectionController.create);
router.patch('/api/template/section/action', checkAuth, TemplateSectionController.update);
router.patch('/api/template/section/delete', checkAuth, TemplateSectionController.remove);
router.patch('/api/template/section/position', checkAuth, TemplateSectionController.position);
router.patch('/api/template/section/update-one/:template_id/:section_id', checkAuth, TemplateSectionController.updateStatus);
router.patch('/api/template/section/update-all/:template_id/:section_id', checkAuth, TemplateSectionController.updateStatusLendingSection);

router.post('/api/template/field/action', checkAuth, TemplateFieldsController.create);
router.patch('/api/template/field/update', checkAuth, TemplateFieldsController.update);
router.patch('/api/template/field/delete', checkAuth, TemplateFieldsController.remove);
router.patch('/api/template/field/position', checkAuth, TemplateFieldsController.position);

export default router;
