import { Request, Response } from 'express';
import { Message } from '../../constant/message.constant';
import { HTTP_STATUS } from '../../constant/statusCode.constant';
import { ProofService } from './proof.service';
import { CreateProofDto } from './proof.dto';

export class ProofController {
  constructor(private readonly proofService: ProofService) {}

  public submit = async (
    req: Request<unknown, unknown, CreateProofDto>,
    res: Response
  ): Promise<void> => {
    await this.proofService.submitProof(req.auth!.userId, req.body, req.file);
    res.status(HTTP_STATUS.CREATED).json({ message: Message.CREATED });
  };
}
