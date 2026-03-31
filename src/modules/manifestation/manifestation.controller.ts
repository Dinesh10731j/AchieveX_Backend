import { Request, Response } from 'express';
import { ManifestationService } from './manifestation.service';
import { CreateManifestationDto, ListManifestationQueryDto } from './manifestation.dto';

export class ManifestationController {
  constructor(private readonly manifestationService: ManifestationService) {}

  public create = async (
    req: Request<unknown, unknown, CreateManifestationDto>,
    res: Response
  ): Promise<void> => {
    const data = await this.manifestationService.create(req.auth!.userId, req.body);
    res.status(201).json(data);
  };

  public list = async (
    req: Request<unknown, unknown, unknown, ListManifestationQueryDto>,
    res: Response
  ): Promise<void> => {
    const data = await this.manifestationService.list(req.query, req.auth ?? {});
    res.status(200).json(data);
  };

  public trending = async (req: Request, res: Response): Promise<void> => {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const data = await this.manifestationService.trending(limit ?? 10);
    res.status(200).json(data);
  };

  public getById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const data = await this.manifestationService.getById(req.params.id, req.auth ?? {});
    res.status(200).json(data);
  };
}
