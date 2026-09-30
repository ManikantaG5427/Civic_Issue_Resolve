import express from 'express';
import { getDocsHtml } from '../controllers/docsController.js';

const router = express.Router();

router.get('/', getDocsHtml);

export default router;
