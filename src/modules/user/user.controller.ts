import { Request, Response } from 'express';
import { Message } from '../../constant/message.constant';
import { HTTP_STATUS } from '../../constant/statusCode.constant';
import { UserService } from './user.service';

export class UserController {
  constructor(private readonly userService: UserService) {}

  public getMe = async (req: Request, res: Response): Promise<void> => {
    const profile = await this.userService.getMe(req.auth!.userId);
    res.status(HTTP_STATUS.OK).json(profile);
  };

  public followUser = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    await this.userService.followUser(req.auth!.userId, req.params.id);
    res.status(HTTP_STATUS.CREATED).json({ message: Message.CREATED });
  };

  public unfollowUser = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    await this.userService.unfollowUser(req.auth!.userId, req.params.id);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  };

  public listFollowers = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const data = await this.userService.listFollowers(req.params.id);
    res.status(HTTP_STATUS.OK).json(data);
  };

  public listFollowing = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const data = await this.userService.listFollowing(req.params.id);
    res.status(HTTP_STATUS.OK).json(data);
  };

  public bookmark = async (req: Request<{ manifestationId: string }>, res: Response): Promise<void> => {
    await this.userService.bookmark(req.auth!.userId, req.params.manifestationId);
    res.status(HTTP_STATUS.CREATED).json({ message: Message.CREATED });
  };

  public removeBookmark = async (req: Request<{ manifestationId: string }>, res: Response): Promise<void> => {
    await this.userService.removeBookmark(req.auth!.userId, req.params.manifestationId);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  };

  public listBookmarks = async (req: Request, res: Response): Promise<void> => {
    const data = await this.userService.listBookmarks(req.auth!.userId);
    res.status(HTTP_STATUS.OK).json(data);
  };
}
