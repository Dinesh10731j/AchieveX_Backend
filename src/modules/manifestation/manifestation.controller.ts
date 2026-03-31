import { Request, Response } from 'express';
import { Message } from '../../constant/message.constant';
import { HTTP_STATUS } from '../../constant/statusCode.constant';
import { ManifestationService } from './manifestation.service';
import { CreateManifestationDto, ListManifestationQueryDto } from './manifestation.dto';

export class ManifestationController {
  constructor(private readonly manifestationService: ManifestationService) {}

  public create = async (
    req: Request<unknown, unknown, CreateManifestationDto>,
    res: Response
  ): Promise<void> => {
    await this.manifestationService.create(req.auth!.userId, req.body);
    res.status(HTTP_STATUS.CREATED).json({ message: Message.CREATED });
  };

  public list = async (
    req: Request<unknown, unknown, unknown, ListManifestationQueryDto>,
    res: Response
  ): Promise<void> => {
    const data = await this.manifestationService.list(req.query, req.auth ?? {});
    res.status(HTTP_STATUS.OK).json(data);
  };

  public trending = async (req: Request, res: Response): Promise<void> => {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const data = await this.manifestationService.trending(limit ?? 10);
    res.status(HTTP_STATUS.OK).json(data);
  };

  public getById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const data = await this.manifestationService.getById(req.params.id, req.auth ?? {});
    res.status(HTTP_STATUS.OK).json(data);
  };
}
