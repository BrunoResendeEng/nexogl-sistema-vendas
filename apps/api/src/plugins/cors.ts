import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import fastifyCors from '@fastify/cors';

async function corsPluginFn(app: FastifyInstance): Promise<void> {
  await app.register(fastifyCors, {
    origin: process.env['FRONTEND_URL'] ?? 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
}

export const corsPlugin = fp(corsPluginFn);
