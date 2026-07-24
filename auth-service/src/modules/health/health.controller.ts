import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../../integrations/prisma/prisma.service';
import { RedisHealthIndicator } from '../../integrations/redis/redis.health';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaIndicator: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
    private readonly redisHealth: RedisHealthIndicator,
  ) {}

  @Get()
  check() {
    return this.health.check([
      () => this.prismaIndicator.pingCheck('database', this.prisma),
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }
}
