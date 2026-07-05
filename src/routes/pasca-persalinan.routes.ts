import { Router } from 'express';
import {
  getPascaPersalinan,
  getPascaPersalinanById,
  getPascaPersalinanHistory,
  createPascaPersalinan,
  updatePascaPersalinan,
  deletePascaPersalinan,
} from '../controllers/pasca-persalinan.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { createPascaPersalinanSchema, updatePascaPersalinanSchema } from '../validations/pasca-persalinan.validation';

const router = Router();

router.use(authMiddleware);

router.get('/', getPascaPersalinan);
router.post('/', validateRequest(createPascaPersalinanSchema), createPascaPersalinan);
router.get('/:id', getPascaPersalinanById);
router.put('/:id', validateRequest(updatePascaPersalinanSchema), updatePascaPersalinan);
router.delete('/:id', deletePascaPersalinan);
router.get('/:wargaId/history', getPascaPersalinanHistory);

export default router;
