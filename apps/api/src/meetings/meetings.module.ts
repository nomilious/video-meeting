import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';

@Module({
  imports: [AuthModule],
  controllers: [MeetingsController],
  providers: [MeetingsService, JwtAuthGuard],
})
export class MeetingsModule {}
