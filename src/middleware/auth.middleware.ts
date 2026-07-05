import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { errorResponse } from '../utils/response';
import { prisma } from '../lib/prisma';

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

    const appUser = await prisma.user.findUnique({
      where: { auth_id: user.id },
    });

    if (!appUser || !appUser.is_active) {
      logger.warn(`Authorization failed: User ${user.id} not found in database or inactive.`);
      return errorResponse(
        res,
        403,
        'Forbidden: User is inactive or not registered in the system.',
      );
    }

    req.user = user;
    req.appUser = appUser;
    next();
  } catch (error) {
    logger.error(error, 'Error in auth middleware:');
    return errorResponse(res, 500, 'Internal server error.');
  }
};
