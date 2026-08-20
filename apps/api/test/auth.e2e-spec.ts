import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

process.env.DATABASE_URL ??=
  'postgresql://video_meetings:video_meetings@localhost:5432/video_meetings?schema=public';
process.env.JWT_SECRET ??= 'e2e-test-secret';

describe('Authentication (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a new user and returns a gvt token', async () => {
    const credentials = createCredentials();

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(credentials)
      .expect(201)
      .expect(({ body }) => {
        expect(body).toEqual({ gvtToken: expect.any(String) });
      });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send(credentials)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({ gvtToken: expect.any(String) });
      });
  });

  it('does not create a user when logging in with unknown credentials', async () => {
    const credentials = createCredentials();

    await request(app.getHttpServer())
      .post('/auth/login')
      .send(credentials)
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(credentials)
      .expect(201)
      .expect(({ body }) => {
        expect(body).toEqual({ gvtToken: expect.any(String) });
      });
  });
});

function createCredentials() {
  return {
    email: `auth-e2e-${crypto.randomUUID()}@example.com`,
    password: 'SecurePassword123!',
  };
}
