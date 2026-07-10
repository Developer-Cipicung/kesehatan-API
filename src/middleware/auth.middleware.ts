import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { errorResponse } from '../utils/response';
import { prisma } from '../lib/prisma';
import type { User } from '../../prisma/generated-schema';

const APP_USER_CACHE_TTL_MS = 30 * 1000;
const appUserCache = new Map<string, { data: User; expiry: number }>();

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 401, 'Unauthorized: Missing or invalid token.');
    }

    const token = authHeader.split(' ')[1];
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn(`Authentication failed: ${error?.message || 'User not found'}`);
      return errorResponse(res, 401, 'Unauthorized: Invalid or expired token.');
    }

    const now = Date.now();
    const cachedAppUser = appUserCache.get(user.id);
    const appUser = cachedAppUser && now < cachedAppUser.expiry
      ? cachedAppUser.data
      : await prisma.user.findUnique({
          where: { auth_id: user.id },
        });

    if (!appUser || !appUser.is_active) {
      appUserCache.delete(user.id);
      logger.warn(`Authorization failed: User ${user.id} not found in database or inactive.`);
      return errorResponse(
        res,
        403,
        'Forbidden: User is inactive or not registered in the system.',
      );
    }

    if (!cachedAppUser || now >= cachedAppUser.expiry) {
      appUserCache.set(user.id, {
        data: appUser,
        expiry: now + APP_USER_CACHE_TTL_MS,
      });
    }

    req.user = user;
    req.appUser = appUser;
    next();
  } catch (error) {
    logger.error(error, 'Error in auth middleware:');
    return errorResponse(res, 500, 'Internal server error.');
  }
};
