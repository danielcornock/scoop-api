import { config } from 'dotenv';

config({ path: 'config.env' });

export const databasePassword = process.env.DB_PASSWORD;
export const databaseUriString = process.env.DATABASE_URI;
export const jwtSecret = process.env.JWT_SECRET;
export const environment = process.env.NODE_ENV;
export const port = process.env.PORT;
