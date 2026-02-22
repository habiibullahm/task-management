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
    // API routes
    this.app.use(env.get('API_PREFIX'), routes);

    // 404 handler
    this.app.use(ErrorMiddleware.notFound);
  }

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use(ErrorMiddleware.handle);
  }
}

export default new App().app;

