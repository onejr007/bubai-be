import { Express } from 'express';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { logger } from '@/core/logger';
import { config } from '@/core/config';

class ModuleLoader {
  loadModules(app: Express) {
    const modulesPath = join(__dirname, '../modules');
    
    if (!existsSync(modulesPath)) {
      logger.warn('No modules directory found');
      return;
    }

    const modules = readdirSync(modulesPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    logger.info(`📦 Loading ${modules.length} modules...`);

    modules.forEach(moduleName => {
      try {
        const routesPath = join(modulesPath, moduleName, 'routes.ts');
        
        if (existsSync(routesPath)) {
          const { default: routes } = require(routesPath);
          app.use(`${config.apiPrefix}/${moduleName}`, routes);
          logger.info(`✅ Module loaded: ${moduleName}`);
        }
      } catch (error) {
        logger.error(`❌ Failed to load module ${moduleName}:`, error);
      }
    });
  }
}

export const moduleLoader = new ModuleLoader();
