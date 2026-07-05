import { Router } from 'express';
import {
  getImunisasi,
  getImunisasiById,
  getImunisasiHistory,
  createImunisasi,
  updateImunisasi,
  deleteImunisasi,
} from '../controllers/imunisasi.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { createImunisasiSchema, updateImunisasiSchema } from '../validations/imunisasi.validation';

const router = Router();

router.use(authMiddleware);

router.get('/', getImunisasi);
router.post('/', validateRequest(createImunisasiSchema), createImunisasi);
router.get('/:id', getImunisasiById);
router.put('/:id', validateRequest(updateImunisasiSchema), updateImunisasi);
router.delete('/:id', deleteImunisasi);
router.get('/:wargaId/history', getImunisasiHistory);

export default router;
