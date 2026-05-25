/**
 * @deprecated Use `configNamespaces` from `./index` — kept for backward compatibility.
 * Merges all namespaces into a single object for legacy `configuration()` consumers.
 */
import appConfig from './app.config';
import authConfig from './auth.config';
import cloudinaryConfig from './cloudinary.config';
import databaseConfig from './database.config';
import firebaseConfig from './firebase.config';
import jwtConfig from './jwt.config';
import mapsConfig from './maps.config';
import redisConfig from './redis.config';
import sentryConfig from './sentry.config';
import saasConfig from './saas.config';

export default () => ({
  app: appConfig(),
  database: databaseConfig(),
  redis: redisConfig(),
  jwt: jwtConfig(),
  auth: authConfig(),
  saas: saasConfig(),
  firebase: firebaseConfig(),
  maps: mapsConfig(),
  sentry: sentryConfig(),
  cloudinary: cloudinaryConfig(),
});
