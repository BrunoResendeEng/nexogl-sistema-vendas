import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import type { PrismaClient } from '@repo/db';
import type { Perfil } from '@repo/types';
import {
  CredenciaisInvalidasError,
  ContaBloqueadaError,
  TokenExpiradoError,
  AcessoNegadoError,
  ValidacaoError,
} from '../errors/domain-errors.js';

const MAX_TENTATIVAS = 5;
const BLOQUEIO_MINUTOS = 15;
const SALT_ROUNDS = 12;

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type UsuarioPublico = {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
};

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function login(
  prisma: PrismaClient,
  email: string,
  senha: string,
  gerarTokens: (payload: { sub: string; perfil: Perfil }) => TokenPair,
): Promise<{ usuario: UsuarioPublico; tokens: TokenPair }> {
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (!usuario || !usuario.ativo) throw new CredenciaisInvalidasError();

  if (usuario.bloqueadoAte && usuario.bloqueadoAte > new Date()) {
    const minutosRestantes = Math.ceil(
      (usuario.bloqueadoAte.getTime() - Date.now()) / 60000,
    );
    throw new ContaBloqueadaError(minutosRestantes);
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);

  if (!senhaValida) {
    const novasTentativas = usuario.tentativasFalhas + 1;
    const deveBloquear = novasTentativas >= MAX_TENTATIVAS;

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        tentativasFalhas: novasTentativas,
        bloqueadoAte: deveBloquear
          ? new Date(Date.now() + BLOQUEIO_MINUTOS * 60 * 1000)
          : null,
      },
    });

    if (deveBloquear) throw new ContaBloqueadaError(BLOQUEIO_MINUTOS);
    throw new CredenciaisInvalidasError();
  }

  const tokens = gerarTokens({ sub: String(usuario.id), perfil: usuario.perfil });

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      tentativasFalhas: 0,
      bloqueadoAte: null,
      refreshTokenHash: hashToken(tokens.refreshToken),
    },
  });

  return {
    tokens,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      ativo: usuario.ativo,
    },
  };
}

export async function refreshTokens(
  prisma: PrismaClient,
  refreshToken: string,
  gerarTokens: (payload: { sub: string; perfil: Perfil }) => TokenPair,
): Promise<TokenPair> {
  const tokenHash = hashToken(refreshToken);

  const usuario = await prisma.usuario.findFirst({
    where: { refreshTokenHash: tokenHash, ativo: true },
  });

  if (!usuario) throw new TokenExpiradoError();

  const tokens = gerarTokens({ sub: String(usuario.id), perfil: usuario.perfil });

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { refreshTokenHash: hashToken(tokens.refreshToken) },
  });

  return tokens;
}

export async function logout(
  prisma: PrismaClient,
  refreshToken: string,
): Promise<void> {
  const tokenHash = hashToken(refreshToken);
  await prisma.usuario.updateMany({
    where: { refreshTokenHash: tokenHash },
    data: { refreshTokenHash: null },
  });
}

export async function listarUsuarios(
  prisma: PrismaClient,
  page: number,
  pageSize: number,
): Promise<{ data: UsuarioPublico[]; total: number }> {
  const [data, total] = await Promise.all([
    prisma.usuario.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { criadoEm: 'desc' },
      select: { id: true, nome: true, email: true, perfil: true, ativo: true },
    }),
    prisma.usuario.count(),
  ]);

  return { data, total };
}

export async function criarUsuario(
  prisma: PrismaClient,
  input: { nome: string; email: string; senha: string; perfil: Perfil },
): Promise<UsuarioPublico> {
  const existe = await prisma.usuario.findUnique({ where: { email: input.email } });
  if (existe) {
    throw new ValidacaoError('E-mail já cadastrado', { email: ['E-mail já está em uso'] });
  }

  const senhaHash = await bcrypt.hash(input.senha, SALT_ROUNDS);

  return prisma.usuario.create({
    data: { nome: input.nome, email: input.email, senhaHash, perfil: input.perfil },
    select: { id: true, nome: true, email: true, perfil: true, ativo: true },
  });
}

export async function editarUsuario(
  prisma: PrismaClient,
  id: number,
  input: { nome?: string; email?: string; perfil?: Perfil },
): Promise<UsuarioPublico> {
  if (input.email) {
    const existe = await prisma.usuario.findFirst({
      where: { email: input.email, NOT: { id } },
    });
    if (existe) {
      throw new ValidacaoError('E-mail já cadastrado', { email: ['E-mail já está em uso'] });
    }
  }

  return prisma.usuario.update({
    where: { id },
    data: input,
    select: { id: true, nome: true, email: true, perfil: true, ativo: true },
  });
}

export async function alterarStatusUsuario(
  prisma: PrismaClient,
  id: number,
  ativo: boolean,
  operadorId: number,
  operadorPerfil: string,
): Promise<{ id: number; ativo: boolean }> {
  if (!ativo && id === operadorId) {
    throw new AcessoNegadoError('Você não pode desativar sua própria conta');
  }

  const alvo = await prisma.usuario.findUnique({ where: { id }, select: { perfil: true } });
  if (alvo?.perfil === 'MASTER' && operadorPerfil !== 'MASTER') {
    throw new AcessoNegadoError('Apenas o MASTER pode alterar o status de outro MASTER');
  }

  return prisma.usuario.update({
    where: { id },
    data: {
      ativo,
      ...(ativo === false ? { refreshTokenHash: null } : {}),
    },
    select: { id: true, ativo: true },
  });
}

export async function excluirUsuario(
  prisma: PrismaClient,
  id: number,
  operadorId: number,
  operadorPerfil: string,
): Promise<void> {
  if (id === operadorId) {
    throw new AcessoNegadoError('Você não pode excluir sua própria conta');
  }

  const alvo = await prisma.usuario.findUnique({ where: { id }, select: { perfil: true } });
  if (!alvo) throw new ValidacaoError('Usuário não encontrado', {});

  if (alvo.perfil === 'MASTER' && operadorPerfil !== 'MASTER') {
    throw new AcessoNegadoError('Apenas o MASTER pode excluir outro MASTER');
  }

  await prisma.usuario.delete({ where: { id } });
}

export async function recuperarSenha(
  prisma: PrismaClient,
  email: string,
): Promise<{ senhaTemporaria: string }> {
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !usuario.ativo) {
    throw new ValidacaoError('E-mail não encontrado', { email: ['Nenhuma conta ativa com este e-mail'] });
  }

  const senhaTemporaria = `Nexo@${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const senhaHash = await bcrypt.hash(senhaTemporaria, SALT_ROUNDS);

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { senhaHash, tentativasFalhas: 0, bloqueadoAte: null, refreshTokenHash: null },
  });

  return { senhaTemporaria };
}

export async function alterarSenha(
  prisma: PrismaClient,
  usuarioId: number,
  senhaAtual: string,
  novaSenha: string,
): Promise<void> {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) throw new ValidacaoError('Usuário não encontrado', {});

  const senhaValida = await bcrypt.compare(senhaAtual, usuario.senhaHash);
  if (!senhaValida) {
    throw new ValidacaoError('Senha atual incorreta', { senhaAtual: ['Senha atual incorreta'] });
  }

  const senhaHash = await bcrypt.hash(novaSenha, SALT_ROUNDS);
  await prisma.usuario.update({ where: { id: usuarioId }, data: { senhaHash } });
}
