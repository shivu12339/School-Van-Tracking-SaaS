import { registerAs } from '@nestjs/config';

export default registerAs('firebase', () => ({
  projectId: process.env.FCM_PROJECT_ID,
  clientEmail: process.env.FCM_CLIENT_EMAIL,
  privateKey: process.env.FCM_PRIVATE_KEY,
  credentialsPath: process.env.FCM_CREDENTIALS_PATH,
}));
