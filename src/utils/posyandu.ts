import { Request } from 'express';
import { AppError } from './AppError';

export const getOptionalPosyanduId = (req: Request): string | undefined => {
  if (req.query.posyanduId === 'all') {
    return undefined;
  }

  const requestedPosyanduId = req.query.posyanduId as string | undefined;
  if (requestedPosyanduId && requestedPosyanduId !== 'my') {
    return requestedPosyanduId;
  }

  // For Admin role without explicit 'my' posyandu request, allow access across all posyandus
  if (req.appUser?.role === 'admin' && requestedPosyanduId !== 'my') {
    return undefined;
  }

  return req.appUser?.posyandu_id ?? undefined;
};

export const getRequiredPosyanduId = (req: Request): string => {
  const requestedPosyanduId = req.query.posyanduId as string | undefined;
  const posyanduId = (requestedPosyanduId && requestedPosyanduId !== 'all' && requestedPosyanduId !== 'my')
    ? requestedPosyanduId
    : (req.appUser?.posyandu_id ?? undefined);

  if (!posyanduId) {
    throw new AppError(400, 'Posyandu ID wajib tersedia untuk aksi ini.');
  }

  return posyanduId;
};