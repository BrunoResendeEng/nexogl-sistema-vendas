import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { criarVenda, buscarVendaPorId, listarVendas, cancelarVenda } from '../services/venda.service.js';
import { criarVendaSchema, listarVendasSchema } from '../schemas/venda.schema.js';
import { ValidacaoError } from '../errors/domain-errors.js';

export async function vendaRoutes(app: FastifyInstance): Promise<void> {
  const authenticate = async (req: FastifyRequest, rep: FastifyReply) =>
    app.authenticate(req, rep);
  const soAdminOuOperador = async (req: FastifyRequest, rep: FastifyReply) =>
    app.requirePerfil(['ADMIN', 'OPERADOR'])(req, rep);
  const authAny = [authenticate, soAdminOuOperador];
  const soAdmin = async (req: FastifyRequest, rep: FastifyReply) =>
    app.requirePerfil(['ADMIN'])(req, rep);
  const authAdmin = [authenticate, soAdmin];

  // GET /vendas
  app.get('/vendas', { preHandler: authAny }, async (request) => {
    const parse = listarVendasSchema.safeParse(request.query);
    if (!parse.success) throw new ValidacaoError('Parâmetros inválidos', parse.error.flatten().fieldErrors);
    const { data, total } = await listarVendas(prisma, parse.data);
    return { data, meta: { total, page: parse.data.page, pageSize: parse.data.pageSize } };
  });

  // GET /vendas/:id
  app.get('/vendas/:id', { preHandler: authAny }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const venda = await buscarVendaPorId(prisma, Number(id));
    if (!venda) return reply.status(404).send({ message: 'Venda não encontrada' });
    return venda;
  });

  // GET /vendas/:id/recibo
  app.get('/vendas/:id/recibo', { preHandler: authAny }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const venda = await buscarVendaPorId(prisma, Number(id));
    if (!venda) return reply.status(404).send({ message: 'Venda não encontrada' });

    const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const data = new Date(venda.criadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

    const itensHtml = venda.itens.map((i) => `
      <tr>
        <td>${i.produtoNome}<br><small>${i.produtoSku}</small></td>
        <td style="text-align:center">${i.quantidade}</td>
        <td style="text-align:right">${fmt(i.precoUnitario)}</td>
        <td style="text-align:right">${fmt(i.subtotal)}</td>
      </tr>`).join('');

    const descontoHtml = venda.descontoAplicado > 0
      ? `<tr><td colspan="3">Desconto PIX (${venda.descontoPercentual}%)</td><td style="text-align:right;color:green">- ${fmt(venda.descontoAplicado)}</td></tr>`
      : '';

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>Recibo ${venda.numero}</title>
<style>
  body { font-family: monospace; max-width: 400px; margin: 20px auto; font-size: 13px; color: #000; }
  h2 { text-align: center; margin: 0; }
  .center { text-align: center; }
  hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; border-bottom: 1px solid #000; padding: 4px 2px; }
  td { padding: 4px 2px; vertical-align: top; }
  .total { font-weight: bold; font-size: 15px; }
  @media print { body { margin: 0; } button { display: none; } }
</style></head><body>
<h2>Nexo GL Digital</h2>
<p class="center">${venda.numero} &mdash; ${data}</p>
<hr>
${venda.clienteNome ? `<p><b>Cliente:</b> ${venda.clienteNome}${venda.clienteTelefone ? ` &mdash; ${venda.clienteTelefone}` : ''}${venda.clienteCpf ? `<br>CPF: ${venda.clienteCpf}` : ''}</p><hr>` : ''}
<table>
  <thead><tr><th>Produto</th><th style="text-align:center">Qtd</th><th style="text-align:right">Unit.</th><th style="text-align:right">Total</th></tr></thead>
  <tbody>${itensHtml}</tbody>
</table>
<hr>
<table>
  <tr><td colspan="3">Subtotal</td><td style="text-align:right">${fmt(venda.subtotal)}</td></tr>
  ${descontoHtml}
  <tr class="total"><td colspan="3">TOTAL</td><td style="text-align:right">${fmt(venda.total)}</td></tr>
</table>
<hr>
<p class="center"><b>Pagamento:</b> ${{ DINHEIRO: 'Dinheiro', PIX: 'PIX', CARTAO: 'Cartão' }[venda.formaPagamento] ?? venda.formaPagamento}</p>
${venda.observacao ? `<p class="center"><i>${venda.observacao}</i></p>` : ''}
<p class="center">Operador: ${venda.usuarioNome}</p>
<hr>
<p class="center">Obrigado pela preferência!</p>
<br>
<div class="center"><button onclick="window.print()">🖨️ Imprimir</button></div>
</body></html>`;

    return reply.type('text/html').send(html);
  });

  // PATCH /vendas/:id/cancelar
  app.patch('/vendas/:id/cancelar', { preHandler: authAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const venda = await cancelarVenda(prisma, Number(id), Number(request.user.sub));
    if (!venda) return reply.status(404).send({ message: 'Venda não encontrada' });
    return venda;
  });

  // POST /vendas
  app.post('/vendas', { preHandler: authAny }, async (request, reply) => {
    const parse = criarVendaSchema.safeParse(request.body);
    if (!parse.success) throw new ValidacaoError('Dados inválidos', parse.error.flatten().fieldErrors);
    const venda = await criarVenda(prisma, parse.data, Number(request.user.sub));
    return reply.status(201).send(venda);
  });
}
