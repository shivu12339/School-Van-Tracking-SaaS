import { Global, Module } from '@nestjs/common';
import { GeoService } from './geo.service';
import { PrismaService } from './prisma.service';
import { TrackingRepository } from './repositories/tracking.repository';

@Global()
@Module({
  providers: [PrismaService, GeoService, TrackingRepository],
  exports: [PrismaService, GeoService, TrackingRepository],
})
export class PrismaModule {}
