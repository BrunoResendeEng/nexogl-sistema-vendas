import { PrismaClient } from '@prisma/client';

// Singleton global para evitar múltiplas instâncias em hot-reload (dev)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env['NODE_ENV'] === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Re-exporta tudo do Prisma Client para que os consumers não precisem
// instalar @prisma/client diretamente
export * from '@prisma/client';
