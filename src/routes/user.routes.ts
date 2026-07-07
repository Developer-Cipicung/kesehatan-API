import { Router } from 'express';
import {
  findAllUsers,
  findUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { authorizeRole } from '../middleware/authz.middleware';

const router = Router();

// Only admin can manage users globally
router.use(authMiddleware);
router.use(authorizeRole(['admin']));

router.get('/', findAllUsers);
router.get('/:id', findUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
