import { Request } from 'express';
import { AppError } from './AppError';

export const getOptionalPosyanduId = (req: Request): string | undefined => {
  if (req.query.posyanduId === 'all') {
    return undefined;
  }

  const requestedPosyanduId = req.query.posyanduId as string | undefined;
  if (requestedPosyanduId) {
    return requestedPosyanduId;
  }

  return req.appUser?.posyandu_id ?? undefined;
};

export const getRequiredPosyanduId = (req: Request): string => {
  const posyanduId = getOptionalPosyanduId(req);

  if (!posyanduId) {
    throw new AppError(400, 'Posyandu ID wajib tersedia untuk aksi ini.');
  }

  return posyanduId;
};