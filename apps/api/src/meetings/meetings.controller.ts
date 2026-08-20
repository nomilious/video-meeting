import { Body, Controller, Get, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { MeetingsService } from './meetings.service';
import { Req } from '@nestjs/common';

@Controller('meetings')
@UseGuards(JwtAuthGuard)
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  create(@Body() meeting: CreateMeetingDto, @Req() request: AuthenticatedRequest) {
    return this.meetingsService.create(request.user.sub, meeting);
  }

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.meetingsService.findAll(request.user.sub);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    const meeting = await this.meetingsService.findOne(request.user.sub, id);

    if (!meeting) {
      throw new NotFoundException();
    }

    return meeting;
  }
}
