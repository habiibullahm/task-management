import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import env from './config/env';
import routes from './routes';
import { ErrorMiddleware } from './middleware/error.middleware';

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // CORS
    this.app.use(
      cors({
        origin: env.get('CORS_ORIGIN'),
        credentials: true,
      })
    );

    // Body parser
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Logging
    if (env.isDevelopment()) {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Security headers
    this.app.use((_req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });
  }

  private initializeRoutes(): void {
    const apiPrefix = env.get('API_PREFIX') as string;

    // Friendly root for Render primary URL / browser visits
    this.app.get('/', (_req, res) => {
      res.json({
        success: true,
        message: 'Task Management API',
        health: `${apiPrefix}/health`,
        auth: `${apiPrefix}/auth`,
        tasks: `${apiPrefix}/tasks`,
      });
    });

    this.app.head('/', (_req, res) => {
      res.status(200).end();
    });

    // API routes
    this.app.use(apiPrefix, routes);

    // 404 handler
    this.app.use(ErrorMiddleware.notFound);
  }

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use(ErrorMiddleware.handle);
  }
}

export default new App().app;

