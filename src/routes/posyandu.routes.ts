import { Router } from 'express';
import { create, findAll, findById, remove, update } from '../controllers/posyandu.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { createPosyanduSchema, updatePosyanduSchema } from '../validations/posyandu.validation';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', findAll);
router.post('/', validateRequest(createPosyanduSchema), create);
router.get('/:id', findById);
router.put('/:id', validateRequest(updatePosyanduSchema), update);
router.delete('/:id', remove);

export default router;
