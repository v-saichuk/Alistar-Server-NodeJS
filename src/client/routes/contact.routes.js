import { Router } from 'express';
import * as ContactsUsController from '../controllers/contacts/contact_us.controller.js';

const router = Router();

router.post('/api/client/contact-us/send-message', ContactsUsController.sendMessage);

export default router;
