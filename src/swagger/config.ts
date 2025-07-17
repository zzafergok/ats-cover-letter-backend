import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express, Request, Response } from 'express';

const getSwaggerOptions = (): swaggerJSDoc.Options => {
  const isDev = process.env.NODE_ENV === 'development';
  const baseUrl = isDev
    ? `http://localhost:${process.env.PORT || 5000}`
    : 'https://api.starkon-kanban.com';

  // Production'da compiled JS dosyalarını kullan
  const apiPaths = isDev
    ? ['./src/routes/*.ts', './src/controllers/*.ts']
    : ['./dist/routes/*.js', './dist/controllers/*.js'];

  return {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Kanban Task Management API',
        version: '2.0.0',
        description:
          'Modern Enterprise Kanban API with comprehensive task management capabilities.',
      },
      servers: [
        {
          url: baseUrl,
          description: isDev ? 'Development Server' : 'Production Server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    apis: apiPaths,
  };
};

export const setupSwagger = (app: Express): void => {
  try {
    console.log('🔄 Setting up Swagger documentation...');

    const swaggerOptions = getSwaggerOptions();
    const specs = swaggerJSDoc(swaggerOptions) as swaggerUi.JsonObject & {
      info?: { title?: string; version?: string };
      paths?: Record<string, unknown>;
    };

    // Swagger spec'in doğru oluştuğunu kontrol et
    if (!specs || !specs.info) {
      throw new Error('Failed to generate Swagger specification');
    }

    console.log('📋 Swagger spec generated successfully');
    console.log(`   Title: ${specs.info.title}`);
    console.log(`   Version: ${specs.info.version}`);
    console.log(
      `   Paths: ${specs.paths ? Object.keys(specs.paths).length : 0}`
    );

    const uiOptions: swaggerUi.SwaggerUiOptions = {
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'none',
        filter: true,
        tryItOutEnabled: true,
      },
      customSiteTitle: 'Kanban API Documentation',
      customCss: `
        .swagger-ui {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .swagger-ui .topbar { display: none !important; }
        .swagger-ui .info { 
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          padding: 2rem;
          border-radius: 0.5rem;
          margin-bottom: 2rem;
        }
        .swagger-ui .info .title { 
          color: white !important; 
          font-size: 2rem; 
          font-weight: 700; 
        }
      `,
    };

    // Ana Swagger UI endpoint
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, uiOptions));

    // JSON endpoint
    app.get('/api-docs.json', (req: Request, res: Response) => {
      res.setHeader('Content-Type', 'application/json');
      res.json(specs);
    });

    // Health check endpoint
    app.get('/docs-health', (req: Request, res: Response) => {
      type SwaggerSpec = typeof specs & {
        info?: { version?: string };
        paths?: Record<string, unknown>;
      };
      const swaggerSpec = specs as SwaggerSpec;
      const pathCount = swaggerSpec.paths
        ? Object.keys(swaggerSpec.paths).length
        : 0;
      res.json({
        status: 'healthy',
        environment: process.env.NODE_ENV || 'unknown',
        endpoints: pathCount,
        version: swaggerSpec.info?.version || 'unknown',
        urls: {
          interactive: '/api-docs',
          json: '/api-docs.json',
        },
        timestamp: new Date().toISOString(),
      });
    });

    console.log('✅ Swagger documentation setup completed');
    console.log(`   📚 Interactive Docs: /api-docs`);
    console.log(`   📄 JSON Schema: /api-docs.json`);
    console.log(`   🏥 Health Check: /docs-health`);
  } catch (error) {
    console.error('❌ Swagger setup failed:', error);

    // Fallback endpoint production'da
    app.get('/api-docs', (req: Request, res: Response) => {
      res.status(503).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>API Documentation Unavailable</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 2rem; text-align: center; }
            .error { background: #fee; border: 1px solid #fcc; padding: 1rem; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>API Documentation Temporarily Unavailable</h2>
            <p>The documentation service is currently experiencing issues.</p>
            <p>Please try again later or contact support.</p>
            <p><a href="/docs-health">Check Service Health</a></p>
          </div>
        </body>
        </html>
      `);
    });

    // Error endpoint
    app.get('/api-docs.json', (req: Request, res: Response) => {
      res.status(503).json({
        error: 'Documentation service unavailable',
        message: 'Swagger specification could not be generated',
        timestamp: new Date().toISOString(),
      });
    });
  }
};

export const setupSwaggerDev = (app: Express): void => {
  if (process.env.NODE_ENV !== 'development') return;

  app.get('/swagger-reload', (req: Request, res: Response) => {
    try {
      setupSwagger(app);

      res.json({
        success: true,
        message: 'Documentation reloaded successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        error: 'Reload failed',

        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  console.log('🔧 Development features enabled: /swagger-reload');
};
