import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DriverController } from './driver.controller';
import { DriverService } from './driver.service';

@Module({
  imports: [PrismaModule],
  controllers: [DriverController],
  providers: [DriverService],
  exports: [DriverService],
})
export class DriverModule {}
