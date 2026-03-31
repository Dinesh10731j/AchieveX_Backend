import { AppDataSource } from '../../config/database';
import { Proof } from '../entities';

export class ProofRepository {
  private readonly repository = AppDataSource.getRepository(Proof);

  public create(input: Partial<Proof>): Proof {
    return this.repository.create(input);
  }

  public save(entity: Proof): Promise<Proof> {
    return this.repository.save(entity);
  }

  public findByManifestationId(manifestationId: string): Promise<Proof | null> {
    return this.repository.findOne({ where: { manifestationId } });
  }
}
