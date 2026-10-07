import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import {
  login,
  refreshTokens,
  logout,
  alterarStatusUsuario,
} from './auth.service.js';
import {
  CredenciaisInvalidasError,
  ContaBloqueadaError,
  TokenExpiradoError,
  AcessoNegadoError,
} from '../errors/domain-errors.js';

function makePrisma(overrides: Record<string, unknown> = {}) {
  return {
    usuario: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    ...overrides,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

const gerarTokens = vi.fn().mockReturnValue({
  accessToken: 'access-token-mock',
  refreshToken: 'refresh-token-mock',
});

const senhaHash = bcrypt.hashSync('senha123', 10);

const usuarioAtivo = {
  id: 'user-1',
  nome: 'Teste',
  email: 'teste@loja.com',
  senhaHash,
  perfil: 'OPERADOR',
  ativo: true,
  tentativasFalhas: 0,
  bloqueadoAte: null,
  refreshTokenHash: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── login ────────────────────────────────────────────────────────────────────

describe('login', () => {
  it('deve autenticar com credenciais válidas e zerar tentativas', async () => {
    const prisma = makePrisma();
    prisma.usuario.findUnique.mockResolvedValue(usuarioAtivo);
    prisma.usuario.update.mockResolvedValue(usuarioAtivo);

    const result = await login(prisma, 'teste@loja.com', 'senha123', gerarTokens);

    expect(result.usuario.email).toBe('teste@loja.com');
    expect(result.tokens.accessToken).toBe('access-token-mock');
    expect(prisma.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tentativasFalhas: 0, bloqueadoAte: null }),
      }),
    );
  });

  it('deve lançar CredenciaisInvalidasError para usuário inexistente', async () => {
    const prisma = makePrisma();
    prisma.usuario.findUnique.mockResolvedValue(null);

    await expect(login(prisma, 'nao@existe.com', 'senha', gerarTokens))
      .rejects.toBeInstanceOf(CredenciaisInvalidasError);
  });

  it('deve lançar CredenciaisInvalidasError para usuário inativo', async () => {
    const prisma = makePrisma();
    prisma.usuario.findUnique.mockResolvedValue({ ...usuarioAtivo, ativo: false });

    await expect(login(prisma, 'teste@loja.com', 'senha123', gerarTokens))
      .rejects.toBeInstanceOf(CredenciaisInvalidasError);
  });

  it('deve lançar CredenciaisInvalidasError para senha errada', async () => {
    const prisma = makePrisma();
    prisma.usuario.findUnique.mockResolvedValue(usuarioAtivo);
    prisma.usuario.update.mockResolvedValue({});

    await expect(login(prisma, 'teste@loja.com', 'senha-errada', gerarTokens))
      .rejects.toBeInstanceOf(CredenciaisInvalidasError);
  });

  it('deve bloquear a conta após 5 tentativas falhas', async () => {
    const prisma = makePrisma();
    prisma.usuario.findUnique.mockResolvedValue({
      ...usuarioAtivo,
      tentativasFalhas: 4,
    });
    prisma.usuario.update.mockResolvedValue({});

    await expect(login(prisma, 'teste@loja.com', 'errada', gerarTokens))
      .rejects.toBeInstanceOf(ContaBloqueadaError);

    expect(prisma.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tentativasFalhas: 5,
          bloqueadoAte: expect.any(Date),
        }),
      }),
    );
  });

  it('deve lançar ContaBloqueadaError quando bloqueadoAte ainda não expirou', async () => {
    const prisma = makePrisma();
    prisma.usuario.findUnique.mockResolvedValue({
      ...usuarioAtivo,
      bloqueadoAte: new Date(Date.now() + 10 * 60 * 1000), // 10min no futuro
    });

    await expect(login(prisma, 'teste@loja.com', 'senha123', gerarTokens))
      .rejects.toBeInstanceOf(ContaBloqueadaError);
  });
});

// ─── refreshTokens ────────────────────────────────────────────────────────────

describe('refreshTokens', () => {
  it('deve rotacionar o token quando o hash bate', async () => {
    const prisma = makePrisma();
    prisma.usuario.findFirst.mockResolvedValue(usuarioAtivo);
    prisma.usuario.update.mockResolvedValue({});

    const result = await refreshTokens(prisma, 'refresh-token-mock', gerarTokens);
    expect(result.accessToken).toBe('access-token-mock');
    expect(prisma.usuario.update).toHaveBeenCalled();
  });

  it('deve lançar TokenExpiradoError quando hash não é encontrado', async () => {
    const prisma = makePrisma();
    prisma.usuario.findFirst.mockResolvedValue(null);

    await expect(refreshTokens(prisma, 'token-invalido', gerarTokens))
      .rejects.toBeInstanceOf(TokenExpiradoError);
  });
});

// ─── logout ───────────────────────────────────────────────────────────────────

describe('logout', () => {
  it('deve zerar o refreshTokenHash do usuário', async () => {
    const prisma = makePrisma();
    prisma.usuario.updateMany.mockResolvedValue({ count: 1 });

    await logout(prisma, 'refresh-token-mock');

    expect(prisma.usuario.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { refreshTokenHash: null },
      }),
    );
  });
});

// ─── alterarStatusUsuario ─────────────────────────────────────────────────────

describe('alterarStatusUsuario', () => {
  it('deve desativar usuário e zerar refreshTokenHash', async () => {
    const prisma = makePrisma();
    prisma.usuario.update.mockResolvedValue({ id: 'user-2', ativo: false });
    prisma.usuario.findUnique.mockResolvedValue({ perfil: 'OPERADOR' });

    const result = await alterarStatusUsuario(prisma, 2, false, 1, 'ADMIN');
    expect(result.ativo).toBe(false);
    expect(prisma.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ refreshTokenHash: null }),
      }),
    );
  });

  it('deve lançar AcessoNegadoError se ADMIN tentar desativar a si mesmo', async () => {
    const prisma = makePrisma();

    await expect(alterarStatusUsuario(prisma, 1, false, 1, 'ADMIN'))
      .rejects.toBeInstanceOf(AcessoNegadoError);
  });

  it('deve ativar usuário sem zerar refreshTokenHash', async () => {
    const prisma = makePrisma();
    prisma.usuario.update.mockResolvedValue({ id: 2, ativo: true });
    prisma.usuario.findUnique.mockResolvedValue({ perfil: 'OPERADOR' });

    await alterarStatusUsuario(prisma, 2, true, 1, 'ADMIN');
    expect(prisma.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ refreshTokenHash: null }),
      }),
    );
  });
});
