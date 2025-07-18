import { Router } from 'express';
import * as CourseController from '../controllers/course/course.controller.js';

const router = Router();

router.get('/api/course/rate/:code', CourseController.getCourse);

export default router;
