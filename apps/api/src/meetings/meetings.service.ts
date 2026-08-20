import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';

const meetingSelect = {
  id: true,
  title: true,
  date: true,
  participants: true,
};

@Injectable()
export class MeetingsService {
  constructor(private readonly prisma: PrismaService) {}

  create(ownerId: string, meeting: CreateMeetingDto) {
    return this.prisma.meeting.create({
      data: { ...meeting, date: new Date(meeting.date), ownerId },
      select: meetingSelect,
    });
  }

  findAll(ownerId: string) {
    return this.prisma.meeting.findMany({
      where: { ownerId },
      orderBy: { date: 'asc' },
      select: meetingSelect,
    });
  }

  findOne(ownerId: string, id: string) {
    return this.prisma.meeting.findFirst({
      where: { id, ownerId },
      select: meetingSelect,
    });
  }
}
