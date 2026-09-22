// Singleton do PrismaClient para a API.
// Importa do package @repo/db para não instanciar múltiplas conexões.
export { prisma } from '@repo/db';
