import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';

export const authorizeRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // If we only have Cadre MVP and we don't have RBAC fully implemented in DB,
    // we just check if req.user exists (authentication handled by authMiddleware).
    // In the future, this should check the user's role from the DB.
    
    if (!req.user) {
      return errorResponse(res, 401, 'Unauthorized: User not authenticated.');
    }

    // Temporary placeholder for actual role checking.
    // For MVP, we assume any authenticated user is a "Cadre".
    // Example: const userRole = await getUserRole(req.user.id);
    const userRole = 'Cadre'; 

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return errorResponse(res, 403, 'Forbidden: Insufficient permissions.');
    }

    next();
  };
};
