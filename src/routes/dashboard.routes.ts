import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getDashboardSummary);

export default router;
