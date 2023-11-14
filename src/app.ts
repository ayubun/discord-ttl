import dotenv from 'dotenv';
import { loginToDiscordAndBeginDeleting } from './bot/api';
import { applyDatabaseMigrations } from './database/api';
dotenv.config();

applyDatabaseMigrations();
loginToDiscordAndBeginDeleting();
