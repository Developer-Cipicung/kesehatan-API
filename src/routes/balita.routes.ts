import { Router } from 'express';
import {
  getBalita,
  getBalitaById,
  getBalitaHistory,
  createBalita,
  updateBalita,
  deleteBalita,
  calculateBalitaZscore,
} from '../controllers/balita.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { createBalitaSchema, updateBalitaSchema } from '../validations/balita.validation';

const router = Router();

router.use(authMiddleware);

router.get('/', getBalita);
router.post('/', validateRequest(createBalitaSchema), createBalita);
router.post('/calculate-zscore', calculateBalitaZscore);
router.get('/:id', getBalitaById);
router.put('/:id', validateRequest(updateBalitaSchema), updateBalita);
router.delete('/:id', deleteBalita);
router.get('/:wargaId/history', getBalitaHistory);

export default router;
