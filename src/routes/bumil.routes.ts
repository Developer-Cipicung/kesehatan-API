import { Router } from 'express';
import {
  getBumil,
  getBumilById,
  getBumilHistory,
  createBumil,
  bulkCreateBumil,
  updateBumil,
  deleteBumil,
} from '../controllers/bumil.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { createBumilSchema, updateBumilSchema } from '../validations/bumil.validation';

const router = Router();

router.use(authMiddleware);

router.get('/', getBumil);
router.post('/', validateRequest(createBumilSchema), createBumil);
router.post('/bulk-pemeriksaan', bulkCreateBumil);
router.get('/:id', getBumilById);
router.put('/:id', validateRequest(updateBumilSchema), updateBumil);
router.delete('/:id', deleteBumil);
router.get('/:wargaId/history', getBumilHistory);

export default router;
