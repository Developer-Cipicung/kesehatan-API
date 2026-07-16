import { Router } from 'express';
import {
  getWarga,
  getWargaById,
  createWarga,
  bulkCreateWarga,
  updateWarga,
  deleteWarga,
} from '../controllers/warga.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { createWargaSchema, bulkCreateWargaSchema, updateWargaSchema } from '../validations/warga.validation';

const router = Router();

router.use(authMiddleware);

router.get('/', getWarga);
router.post('/bulk', validateRequest(bulkCreateWargaSchema), bulkCreateWarga);
router.get('/:id', getWargaById);
router.post('/', validateRequest(createWargaSchema), createWarga);
router.put('/:id', validateRequest(updateWargaSchema), updateWarga);
router.delete('/:id', deleteWarga);

export default router;
