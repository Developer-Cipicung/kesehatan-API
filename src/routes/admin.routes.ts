import { Router } from 'express';
import { getKasusRisti, getIndikatorMedis } from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { authorizeRole } from '../middleware/authz.middleware';

const router = Router();

router.use(authMiddleware);
router.use(authorizeRole(['admin']));

router.get('/risti', getKasusRisti);
router.get('/indikator-medis', getIndikatorMedis);

export default router;
