export class Container {
  private readonly services = new Map<string, unknown>();

  public register<T>(key: string, instance: T): void {
    this.services.set(key, instance as unknown);
  }

  public resolve<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service not found in container: ${key}`);
    }

    return service as T;
  }
}
