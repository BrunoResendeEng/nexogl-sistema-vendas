import type { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';

export async function corsPlugin(app: FastifyInstance): Promise<void> {
  await app.register(fastifyCors, {
    origin: process.env['FRONTEND_URL'] ?? 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
}
