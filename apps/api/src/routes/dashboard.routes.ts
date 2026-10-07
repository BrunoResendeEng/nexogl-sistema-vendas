import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { getDashboard } from '../services/dashboard.service.js';

export async function dashboardRoutes(app: FastifyInstance): Promise<void> {
  const authenticate = async (req: FastifyRequest, rep: FastifyReply) =>
    app.authenticate(req, rep);
  const soAdminOuOperador = async (req: FastifyRequest, rep: FastifyReply) =>
    app.requirePerfil(['ADMIN', 'OPERADOR'])(req, rep);

  app.get('/dashboard', { preHandler: [authenticate, soAdminOuOperador] }, async (req) => {
    const { dias } = req.query as { dias?: string };
    const numDias = Math.min(Math.max(Number(dias) || 7, 7), 90);
    return getDashboard(prisma, numDias);
  });
}
