import dotenv from 'dotenv';
import { loginToDiscord } from './bot/api';
import { applyDatabaseMigrations } from './database/api';
dotenv.config();

applyDatabaseMigrations();
loginToDiscord();
