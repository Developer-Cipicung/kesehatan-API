import { Router } from 'express';
import {
  getPendataan,
  getPendataanStatusAll,
  selesaikanPendataan,
} from '../controllers/pendataan-bulanan.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest, validateQuery } from '../middleware/validation.middleware';
import { getPendataanStatusSchema, selesaikanPendataanSchema } from '../validations/pendataan.validation';

const router = Router();

router.use(authMiddleware);

router.get('/', validateQuery(getPendataanStatusSchema), getPendataan);
router.get('/status', validateQuery(getPendataanStatusSchema), getPendataanStatusAll);
router.post('/selesai', validateRequest(selesaikanPendataanSchema), selesaikanPendataan);

export default router;
