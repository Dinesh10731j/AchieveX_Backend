import { Request, Response } from 'express';
import { NotificationService } from './notification.service';
import { UpdateNotificationPreferenceDto } from './notification.dto';

export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  public list = async (req: Request, res: Response): Promise<void> => {
    const userId = req.auth!.userId;
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;

    const data = await this.notificationService.list(userId, page, limit);
    res.status(200).json(data);
  };

  public markRead = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    await this.notificationService.markRead(req.auth!.userId, req.params.id);
    res.status(204).send();
  };

  public getPreferences = async (req: Request, res: Response): Promise<void> => {
    const preference = await this.notificationService.getPreferences(req.auth!.userId);
    res.status(200).json(preference);
  };

  public updatePreferences = async (
    req: Request<unknown, unknown, UpdateNotificationPreferenceDto>,
    res: Response
  ): Promise<void> => {
    const updated = await this.notificationService.updatePreferences(req.auth!.userId, req.body);
    res.status(200).json(updated);
  };
}
