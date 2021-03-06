/**
 * Entrypoint for sount backend.
 */

import express, { Request, Response } from 'express';
import { setupDb } from './db';
import multer from 'multer';
import { authorize } from './auth/auth';
import cors from 'cors';
import { existsSync } from 'fs';
import { authPath } from './services/email';
import { resolve } from 'path';

const config = {
  port: 8004
};

let app: express.Application;

if (!existsSync(authPath)) {
  console.log(`Error: A file at the email auth path "${authPath}" does not exist!`);
  process.exit(-1);
}

const formDataHandler = multer({
  dest: resolve('./media'),
});

setupDb().then(() => {
  app = express();
  app.use((req, res, next) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    next();
  });
  app.use(cors({
    origin: [
      'http://localhost:8080',
      'http://localhost:8081',
      'http://127.0.0.1:8081'
    ]
  }));
  app.use(express.json());
  app.use((req, res, next) => {
    try {
      next();
    } catch (e) {
      next(e);
    }
  });


  app.listen(config.port, () => {
    console.log("App listening on port :" + config.port);
  });

  app.use('/media', express.static(resolve('./media'), {
    
  }));

  const basePath = '/api';
  app.get(`${basePath}/enterprises`, require('./get/enterprises').default);
  app.get(`${basePath}/enterprise/:enterpriseId/bmc/`, require('./get/bmc').default);
  app.post(`${basePath}/enterprises`, authorize, formDataHandler.single('logo'), require('./post/enterprises').default);
  app.post(`${basePath}/enterprise/:enterpriseId/member`, authorize, require('./post/member').default);
  app.delete(`${basePath}/enterprise/:enterpriseId/member/:targetEmail`, authorize, require('./delete/member').default);
  app.put(`${basePath}/enterprises/:enterpriseId/bmc/:cardId`, authorize, require('./put/bmc_card').default);
  app.put(`${basePath}/enterprises/:enterpriseId/bmc/:cardId/cover`, authorize, formDataHandler.single('image'), require('./put/bmc_card_cover_image').default);
  app.post(`${basePath}/user/auth`, require('./post/auth').default)
})