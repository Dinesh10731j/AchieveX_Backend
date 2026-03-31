import { Request, Response } from 'express';
import { Message } from '../../constant/message.constant';
import { HTTP_STATUS } from '../../constant/statusCode.constant';
import { ReactionService } from './reaction.service';
import { CreateReactionDto } from './reaction.dto';

export class ReactionController {
  constructor(private readonly reactionService: ReactionService) {}

  public create = async (
    req: Request<unknown, unknown, CreateReactionDto>,
    res: Response
  ): Promise<void> => {
    await this.reactionService.create(req.auth!.userId, req.body);
    res.status(HTTP_STATUS.CREATED).json({ message: Message.CREATED });
  };

  public remove = async (
    req: Request<unknown, unknown, CreateReactionDto>,
    res: Response
  ): Promise<void> => {
    await this.reactionService.remove(req.auth!.userId, req.body);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  };
}
