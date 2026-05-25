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

/** All typed configuration namespaces loaded by ConfigModule */
export const configNamespaces = [
  appConfig,
  databaseConfig,
  redisConfig,
  jwtConfig,
  authConfig,
  saasConfig,
  firebaseConfig,
  mapsConfig,
  sentryConfig,
  cloudinaryConfig,
] as const;
