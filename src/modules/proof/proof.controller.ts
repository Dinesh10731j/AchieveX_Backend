import { Request, Response } from 'express';
import { ProofService } from './proof.service';
import { CreateProofDto } from './proof.dto';

export class ProofController {
  constructor(private readonly proofService: ProofService) {}

  public submit = async (
    req: Request<unknown, unknown, CreateProofDto>,
    res: Response
  ): Promise<void> => {
    const data = await this.proofService.submitProof(req.auth!.userId, req.body, req.file);
    res.status(201).json(data);
  };
}
