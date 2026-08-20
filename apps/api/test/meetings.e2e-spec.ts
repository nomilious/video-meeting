import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

process.env.DATABASE_URL ??=
  'postgresql://video_meetings:video_meetings@localhost:5432/video_meetings?schema=public';
process.env.JWT_SECRET ??= 'e2e-test-secret';

describe('Meetings (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    token = await registerUser(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires authentication', async () => {
    await request(app.getHttpServer()).post('/meetings').send(createMeeting()).expect(401);
    await request(app.getHttpServer()).get('/meetings').expect(401);
    await request(app.getHttpServer()).get('/meetings/unknown-id').expect(401);
  });

  it('creates a meeting', async () => {
    const meeting = createMeeting();

    await request(app.getHttpServer())
      .post('/meetings')
      .set('Authorization', `Bearer ${token}`)
      .send(meeting)
      .expect(201)
      .expect(({ body }) => {
        expect(body).toEqual({ id: expect.any(String), ...meeting });
      });
  });

  it('returns only meetings of the current user', async () => {
    const ownMeeting = createMeeting();
    const otherUserToken = await registerUser(app);
    const otherUserMeeting = createMeeting();

    await createMeetingFor(app, token, ownMeeting);
    await createMeetingFor(app, otherUserToken, otherUserMeeting);

    await request(app.getHttpServer())
      .get('/meetings')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([expect.objectContaining({ title: ownMeeting.title })]),
        );
        expect(body).not.toEqual(
          expect.arrayContaining([expect.objectContaining({ title: otherUserMeeting.title })]),
        );
      });
  });

  it('returns a meeting by id', async () => {
    const meeting = createMeeting();
    const { body: createdMeeting } = await createMeetingFor(app, token, meeting);

    await request(app.getHttpServer())
      .get(`/meetings/${createdMeeting.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({ id: createdMeeting.id, ...meeting });
      });
  });

  it('does not return another user\'s meeting', async () => {
    const otherUserToken = await registerUser(app);
    const { body: otherUserMeeting } = await createMeetingFor(
      app,
      otherUserToken,
      createMeeting(),
    );

    await request(app.getHttpServer())
      .get(`/meetings/${otherUserMeeting.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('returns 404 when the meeting does not exist', async () => {
    await request(app.getHttpServer())
      .get('/meetings/non-existent-id')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});

function createMeeting() {
  return {
    title: `Team sync ${crypto.randomUUID()}`,
    date: '2026-10-15T14:30:00.000Z',
    participants: ['alice@example.com', 'bob@example.com'],
  };
}

async function registerUser(app: INestApplication) {
  const { body } = await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      email: `meetings-e2e-${crypto.randomUUID()}@example.com`,
      password: 'SecurePassword123!',
    })
    .expect(201);

  return body.gvtToken as string;
}

function createMeetingFor(
  app: INestApplication,
  token: string,
  meeting: ReturnType<typeof createMeeting>,
) {
  return request(app.getHttpServer())
    .post('/meetings')
    .set('Authorization', `Bearer ${token}`)
    .send(meeting)
    .expect(201);
}
