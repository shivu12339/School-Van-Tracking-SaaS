import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type MediaFolder = 'schools' | 'drivers' | 'students';

export interface SignedUploadParams {
  folder: MediaFolder;
  schoolId: string;
  resourceId: string;
}

/**
 * Cloudinary-backed media storage (MVP).
 * AWS migration: swap implementation to S3 presigned URLs — keep this interface.
 */
@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    this.enabled = Boolean(
      config.get<string>('cloudinary.cloudName') &&
        config.get<string>('cloudinary.apiKey') &&
        config.get<string>('cloudinary.apiSecret'),
    );
  }

  buildFolderPath(params: SignedUploadParams): string {
    const root = this.config.get<string>('cloudinary.folder', 'schoolvan');
    return `${root}/${params.folder}/${params.schoolId}/${params.resourceId}`;
  }

  /** Returns Cloudinary upload preset metadata for client-side signed uploads. */
  getUploadConfig(params: SignedUploadParams): { folder: string; enabled: boolean } {
    if (!this.enabled) {
      this.logger.warn('Cloudinary not configured — uploads disabled');
      return { folder: this.buildFolderPath(params), enabled: false };
    }
    return { folder: this.buildFolderPath(params), enabled: true };
  }
}
