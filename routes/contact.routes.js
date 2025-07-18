import { Router } from 'express';
import * as ContactsUsController from '../controllers/contacts/contact_us.controller.js';

const router = Router();

router.post('/api/contact-us/send-message', ContactsUsController.sendMessage);

export default router;
