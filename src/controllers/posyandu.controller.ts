import { Request, Response } from 'express';
import { successResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { PosyanduService } from '../services/posyandu.service';

const posyanduService = new PosyanduService();

export const findAll = asyncHandler(async (req: Request, res: Response) => {
  const data = await posyanduService.findAll();
  return successResponse(res, 200, 'Success', data);
});

export const findById = asyncHandler(async (req: Request, res: Response) => {
  const data = await posyanduService.findById(req.params.id as string);
  return successResponse(res, 200, 'Success', data);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await posyanduService.create(req.body);
  return successResponse(res, 201, 'Posyandu created successfully', data);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await posyanduService.update(req.params.id as string, req.body);
  return successResponse(res, 200, 'Posyandu updated successfully', data);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await posyanduService.delete(req.params.id as string);
  return successResponse(res, 200, 'Posyandu deleted successfully');
});
