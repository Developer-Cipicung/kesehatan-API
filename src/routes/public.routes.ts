import { Router } from 'express';
import { cekKartu } from '../controllers/public.controller';

const router = Router();

// Public endpoint for digital card check without auth
router.post('/cek-kartu', cekKartu);

export default router;
