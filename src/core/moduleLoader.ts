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
        const routesJsPath = join(modulesPath, moduleName, 'routes.js');
        
        // Check both .ts (dev) and .js (prod) files
        const finalPath = existsSync(routesPath) ? routesPath : routesJsPath;
        
        if (existsSync(finalPath)) {
          const { default: routes } = require(finalPath);
          const fullPath = `${config.apiPrefix}/${moduleName}`;
          app.use(fullPath, routes);
          logger.info(`✅ Module loaded: ${moduleName} at ${fullPath}`);
        } else {
          logger.warn(`⚠️ No routes file found for module: ${moduleName}`);
        }
      } catch (error) {
        logger.error(`❌ Failed to load module ${moduleName}:`, error);
      }
    });
  }
}

export const moduleLoader = new ModuleLoader();
