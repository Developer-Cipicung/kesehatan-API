import { Router } from 'express';
import {
  getPendataan,
  getPendataanStatusAll,
  getAdminStatusAll,
  selesaikanPendataan,
} from '../controllers/pendataan-bulanan.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest, validateQuery } from '../middleware/validation.middleware';
import {
  getPendataanStatusSchema,
  getAdminStatusSchema,
  selesaikanPendataanSchema,
} from '../validations/pendataan.validation';

const router = Router();

router.use(authMiddleware);

router.get('/', validateQuery(getPendataanStatusSchema), getPendataan);
router.get('/status', validateQuery(getPendataanStatusSchema), getPendataanStatusAll);
router.get('/admin/status', validateQuery(getAdminStatusSchema), getAdminStatusAll);
router.post('/:id/submit', selesaikanPendataan);

export default router;
