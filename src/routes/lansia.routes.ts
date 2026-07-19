import { Router } from 'express';
import {
  getLansia,
  getLansiaById,
  getLansiaHistory,
  createLansia,
  bulkCreateLansia,
  updateLansia,
  deleteLansia,
} from '../controllers/lansia.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { createLansiaSchema, updateLansiaSchema } from '../validations/lansia.validation';

const router = Router();

router.use(authMiddleware);

router.get('/', getLansia);
router.post('/', validateRequest(createLansiaSchema), createLansia);
router.post('/bulk-pemeriksaan', bulkCreateLansia);
router.get('/:id', getLansiaById);
router.put('/:id', validateRequest(updateLansiaSchema), updateLansia);
router.delete('/:id', deleteLansia);
router.get('/:wargaId/history', getLansiaHistory);

export default router;
