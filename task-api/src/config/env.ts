import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  API_PREFIX: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  CORS_ORIGIN: string[];
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  LOG_LEVEL: string;
}

class Environment {
  private config: EnvConfig;

  constructor() {
    this.config = this.validateEnv();
  }

  private validateEnv(): EnvConfig {
    return {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: parseInt(process.env.PORT || '3000', 10),
      API_PREFIX: process.env.API_PREFIX || '/api/v1',
      DATABASE_URL: this.getRequired('DATABASE_URL'),
      JWT_SECRET: this.getRequired('JWT_SECRET'),
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
      JWT_REFRESH_SECRET: this.getRequired('JWT_REFRESH_SECRET'),
      JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
      CORS_ORIGIN: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
      RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
      LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    };
  }

  private getRequired(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Environment variable ${key} is required but not set`);
    }
    return value;
  }

  public get(key: keyof EnvConfig): any {
    return this.config[key];
  }

  public getAll(): EnvConfig {
    return { ...this.config };
  }

  public isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  public isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  public isTest(): boolean {
    return this.config.NODE_ENV === 'test';
  }
}

export const env = new Environment();
export default env;
