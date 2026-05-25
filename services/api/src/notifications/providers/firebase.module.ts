import { Global, Module } from '@nestjs/common';
import { FcmProvider } from './fcm.provider';

@Global()
@Module({
  providers: [FcmProvider],
  exports: [FcmProvider],
})
export class FirebaseModule {}
