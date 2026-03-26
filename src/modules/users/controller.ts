import { Request, Response, NextFunction } from 'express';
import { userService } from './service';

class UserController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await userService.getAll();
      res.json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await userService.getById(req.params.id);
      res.json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await userService.create(req.body);
      res.status(201).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await userService.update(req.params.id, req.body);
      res.json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await userService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
