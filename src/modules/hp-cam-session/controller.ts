import { Request, Response, NextFunction } from 'express';
import { hpCamSessionService } from './service';

class HpCamSessionController {
  async createSession(req: Request, res: Response, next: NextFunction) {
    try {
      const session = await hpCamSessionService.createSession(req.body);
      res.status(201).json({
        status: 'success',
        data: {
          sessionId: session.sessionId,
          pairingCode: session.pairingCode,
          expiresAt: session.expiresAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async joinSession(req: Request, res: Response, next: NextFunction) {
    try {
      const session = await hpCamSessionService.joinSession(req.body);
      res.json({
        status: 'success',
        data: {
          sessionId: session.sessionId,
          status: session.status,
          pairedAt: session.pairedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getSessionStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const session = await hpCamSessionService.getSessionStatus(req.params.sessionId);
      res.json({
        status: 'success',
        data: {
          sessionId: session.sessionId,
          status: session.status,
          hasViewer: session.hasViewer,
          createdAt: session.createdAt,
          pairedAt: session.pairedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async sendSignal(req: Request, res: Response, next: NextFunction) {
    try {
      await hpCamSessionService.sendSignal(req.body);
      res.json({ status: 'success', data: { message: 'Signal sent' } });
    } catch (error) {
      next(error);
    }
  }

  async getSignals(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const { forDevice, since } = req.query;
      
      const sinceDate = since ? new Date(since as string) : undefined;
      const signals = await hpCamSessionService.getSignals(
        sessionId,
        forDevice as 'mobile' | 'viewer',
        sinceDate
      );
      
      res.json({ status: 'success', data: { signals } });
    } catch (error) {
      next(error);
    }
  }

  async endSession(req: Request, res: Response, next: NextFunction) {
    try {
      await hpCamSessionService.endSession(req.body.sessionId);
      res.json({ status: 'success', data: { message: 'Session ended' } });
    } catch (error) {
      next(error);
    }
  }
}

export const hpCamSessionController = new HpCamSessionController();
