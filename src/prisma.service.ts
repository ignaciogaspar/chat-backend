import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
// Ensure you import PrismaClient from the generated client
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
  async enableShutdownHooks(app: INestApplication) {
    // Type assertion to fix the error
    (this.$on as any)('beforeExit', async () => {
      await app.close();
    });
  }
}
