import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { successResponse } from '../utils/response';

export const findAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await userService.findAll();
    return successResponse(res, 200, 'Berhasil mengambil daftar user.', data);
  } catch (error) {
    next(error);
  }
};

export const findUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await userService.findById(req.params.id as string);
    return successResponse(res, 200, 'Berhasil mengambil detail user.', data);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await userService.create(req.body);
    return successResponse(res, 201, 'Berhasil menambahkan user.', data);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await userService.update(req.params.id as string, req.body);
    return successResponse(res, 200, 'Berhasil mengubah user.', data);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await userService.delete(req.params.id as string);
    return successResponse(res, 200, 'Berhasil menghapus user.', data);
  } catch (error) {
    next(error);
  }
};
