import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from './env';

const isTsRuntime = __filename.endsWith('.ts');

const normalizedDatabaseUrl = (() => {
  try {
    const parsed = new URL(env.databaseUrl);
    const sslMode = parsed.searchParams.get('sslmode');

    if (sslMode && ['prefer', 'require', 'verify-ca'].includes(sslMode) && !parsed.searchParams.has('uselibpqcompat')) {
      parsed.searchParams.set('uselibpqcompat', 'true');
    }

    return parsed.toString();
  } catch (_error) {
    return env.databaseUrl;
  }
})();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: normalizedDatabaseUrl,
  entities: [isTsRuntime ? 'src/database/entities/*.ts' : 'dist/database/entities/*.js'],
  migrations: [isTsRuntime ? 'src/database/migrations/*.ts' : 'dist/database/migrations/*.js'],
  logging: false,
  synchronize: false
});
