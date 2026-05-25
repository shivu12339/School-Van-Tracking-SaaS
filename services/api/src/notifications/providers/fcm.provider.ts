import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export interface FcmSendInput {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  silent?: boolean;
}

export interface FcmSendResult {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
  messageId?: string;
}

@Injectable()
export class FcmProvider implements OnModuleInit {
  private readonly logger = new Logger(FcmProvider.name);
  private initialized = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    if (admin.apps.length > 0) {
      this.initialized = true;
      return;
    }
    const projectId = this.configService.get<string>('firebase.projectId');
    const clientEmail = this.configService.get<string>('firebase.clientEmail');
    const privateKey = this.configService.get<string>('firebase.privateKey');
    const credentialsPath = this.configService.get<string>('firebase.credentialsPath');

    const isPlaceholder = (value: string | undefined): boolean =>
      !value ||
      value === 'replace' ||
      value.includes('your-project') ||
      value.includes('...');

    if (credentialsPath && !isPlaceholder(credentialsPath)) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert(credentialsPath),
        });
        this.initialized = true;
        this.logger.log('Firebase Admin initialized from credentials file');
      } catch (error) {
        this.logger.warn(
          `FCM credentials file invalid; push sends will be simulated (${error instanceof Error ? error.message : String(error)})`,
        );
      }
      return;
    }

    if (isPlaceholder(projectId) || isPlaceholder(clientEmail) || isPlaceholder(privateKey)) {
      this.logger.warn('FCM credentials missing or placeholder; push sends will be simulated');
      return;
    }

    try {
      const normalizedKey = privateKey!.replace(/\\n/g, '\n');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId!,
          clientEmail: clientEmail!,
          privateKey: normalizedKey,
        }),
      });
      this.initialized = true;
      this.logger.log('Firebase Admin initialized');
    } catch (error) {
      this.logger.warn(
        `FCM init failed; push sends will be simulated (${error instanceof Error ? error.message : String(error)})`,
      );
    }
  }

  async sendMulticast(input: FcmSendInput): Promise<FcmSendResult> {
    if (!input.tokens.length) {
      return { successCount: 0, failureCount: 0, invalidTokens: [] };
    }
    if (!this.initialized) {
      this.logger.debug(`Simulated FCM push to ${input.tokens.length} devices`);
      return { successCount: input.tokens.length, failureCount: 0, invalidTokens: [] };
    }

    const response = await admin.messaging().sendEachForMulticast({
      tokens: input.tokens,
      notification: input.silent
        ? undefined
        : {
            title: input.title,
            body: input.body,
          },
      data: {
        ...input.data,
        title: input.title,
        body: input.body,
      },
      android: { priority: 'high' },
      apns: {
        payload: {
          aps: {
            sound: input.silent ? undefined : 'default',
            contentAvailable: input.silent ? true : undefined,
          },
        },
      },
    });

    const invalidTokens: string[] = [];
    response.responses.forEach((item, index) => {
      if (!item.success) {
        const code = item.error?.code;
        if (
          code === 'messaging/invalid-registration-token' ||
          code === 'messaging/registration-token-not-registered'
        ) {
          const token = input.tokens[index];
          if (token) invalidTokens.push(token);
        }
      }
    });

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokens,
    };
  }
}
