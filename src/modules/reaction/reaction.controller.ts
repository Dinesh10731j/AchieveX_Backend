import { Request, Response } from 'express';
import { ReactionService } from './reaction.service';
import { CreateReactionDto } from './reaction.dto';

export class ReactionController {
  constructor(private readonly reactionService: ReactionService) {}

  public create = async (
    req: Request<unknown, unknown, CreateReactionDto>,
    res: Response
  ): Promise<void> => {
    const data = await this.reactionService.create(req.auth!.userId, req.body);
    res.status(201).json(data);
  };

  public remove = async (
    req: Request<unknown, unknown, CreateReactionDto>,
    res: Response
  ): Promise<void> => {
    await this.reactionService.remove(req.auth!.userId, req.body);
    res.status(204).send();
  };
}
