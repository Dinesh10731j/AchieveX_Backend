import { Request, Response } from 'express';
import { Message } from '../../constant/message.constant';
import { HTTP_STATUS } from '../../constant/statusCode.constant';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './comment.dto';

export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  public create = async (
    req: Request<unknown, unknown, CreateCommentDto>,
    res: Response
  ): Promise<void> => {
    await this.commentService.create(req.auth!.userId, req.body);
    res.status(HTTP_STATUS.CREATED).json({ message: Message.CREATED });
  };

  public list = async (req: Request, res: Response): Promise<void> => {
    const manifestationId = String(req.query.manifestationId);
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;

    const data = await this.commentService.list(manifestationId, page, limit);
    res.status(HTTP_STATUS.OK).json(data);
  };

  public softDelete = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    await this.commentService.softDelete(req.params.id, req.auth!.userId, req.auth!.role);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  };
}
