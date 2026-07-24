import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/integrations/prisma/prisma.service';
import { PrismaHealthIndicator } from '@nestjs/terminus';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findMany: jest.fn().mockResolvedValue([]),
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({}),
          update: jest.fn().mockResolvedValue({}),
          delete: jest.fn().mockResolvedValue({}),
        },
      })
      .overrideProvider(PrismaHealthIndicator)
      .useValue({
        pingCheck: jest.fn().mockResolvedValue({ database: { status: 'up' } }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  it('/health (GET) should return health check response', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.statusCode).toBe(200);
        expect(res.body.message).toBe('Success');
      });
  });

  it('/graphql (POST) — { hello }', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ hello }' })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.hello).toBe('Hello World!');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
