import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';


// Load environment variables from .env
dotenv.config();

/**
 * Application DataSource (TypeORM) configuration.
 *
 * Important:
 * - `synchronize: false` in this scaffold to avoid accidental schema changes in production.
 * - Use TypeORM migrations for schema changes (`migration:generate` / `migration:run`).
 */
export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'warehouse_db',
  synchronize: true,
  charset: 'utf8mb4', // thêm dòng này
  logging: true,
  entities: [__dirname + '/entity/**/*.{ts,js}'],
  // Migrations are emitted to dist/migration when using tsc build
  migrations: ['dist/migration/*.js'],
});
