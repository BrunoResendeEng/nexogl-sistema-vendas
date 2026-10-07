-- =============================================================================
-- reset_banco.sql
-- Dropa tudo e recria com snake_case + IDs inteiros
-- Rodar no DBeaver conectado ao banco estoque_moto
-- =============================================================================

-- ─── Drop tudo ───────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS "ItemVenda"       CASCADE;
DROP TABLE IF EXISTS "Venda"           CASCADE;
DROP TABLE IF EXISTS "VendaSequencia"  CASCADE;
DROP TABLE IF EXISTS "Movimentacao"    CASCADE;
DROP TABLE IF EXISTS "Codigo"          CASCADE;
DROP TABLE IF EXISTS "Produto"         CASCADE;
DROP TABLE IF EXISTS "SkuSequencia"    CASCADE;
DROP TABLE IF EXISTS "Fornecedor"      CASCADE;
DROP TABLE IF EXISTS "Usuario"         CASCADE;
DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;

DROP TYPE IF EXISTS "Perfil"            CASCADE;
DROP TYPE IF EXISTS "Categoria"         CASCADE;
DROP TYPE IF EXISTS "Unidade"           CASCADE;
DROP TYPE IF EXISTS "TipoMovimentacao"  CASCADE;
DROP TYPE IF EXISTS "FormaPagamento"    CASCADE;

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE perfil            AS ENUM ('MASTER', 'ADMIN', 'OPERADOR');
CREATE TYPE categoria         AS ENUM ('MOT', 'FRE', 'TRA', 'ELE', 'SUS', 'PNE', 'ACC', 'OUT');
CREATE TYPE unidade           AS ENUM ('UN', 'CX', 'PC', 'KG', 'L');
CREATE TYPE tipo_movimentacao AS ENUM ('ENTRADA', 'SAIDA', 'AJUSTE', 'PERDA', 'DEVOLUCAO');
CREATE TYPE forma_pagamento   AS ENUM ('DINHEIRO', 'PIX', 'CARTAO');

-- ─── usuario ─────────────────────────────────────────────────────────────────

CREATE TABLE usuario (
  id                 SERIAL PRIMARY KEY,
  nome               TEXT        NOT NULL,
  email              TEXT        NOT NULL UNIQUE,
  senha_hash         TEXT        NOT NULL,
  perfil             perfil      NOT NULL,
  ativo              BOOLEAN     NOT NULL DEFAULT true,
  tentativas_falhas  INT         NOT NULL DEFAULT 0,
  bloqueado_ate      TIMESTAMPTZ,
  refresh_token_hash TEXT,
  criado_em          TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_usuario_email ON usuario (email);

-- ─── fornecedor ──────────────────────────────────────────────────────────────

CREATE TABLE fornecedor (
  id            SERIAL PRIMARY KEY,
  razao_social  TEXT        NOT NULL,
  cnpj          TEXT        NOT NULL UNIQUE,
  telefone      TEXT,
  email         TEXT,
  contato       TEXT,
  ativo         BOOLEAN     NOT NULL DEFAULT true,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fornecedor_cnpj  ON fornecedor (cnpj);
CREATE INDEX idx_fornecedor_ativo ON fornecedor (ativo);

-- ─── produto ─────────────────────────────────────────────────────────────────

CREATE TABLE produto (
  id             SERIAL PRIMARY KEY,
  sku            TEXT        NOT NULL UNIQUE,
  nome           TEXT        NOT NULL,
  descricao      TEXT,
  categoria      categoria   NOT NULL,
  unidade        unidade     NOT NULL,
  marca          TEXT,
  aplicacao      TEXT,
  localizacao    TEXT,
  foto_url       TEXT,
  estoque_minimo INT         NOT NULL DEFAULT 0,
  estoque_atual  INT         NOT NULL DEFAULT 0,
  custo_medio    NUMERIC(10,2) NOT NULL DEFAULT 0,
  preco_venda    NUMERIC(10,2),
  ativo          BOOLEAN     NOT NULL DEFAULT true,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_produto_nome      ON produto (nome);
CREATE INDEX idx_produto_categoria ON produto (categoria);
CREATE INDEX idx_produto_ativo     ON produto (ativo);

-- ─── codigo (código de barras) ───────────────────────────────────────────────

CREATE TABLE codigo (
  id         SERIAL PRIMARY KEY,
  codigo     TEXT        NOT NULL UNIQUE,
  produto_id INT         NOT NULL REFERENCES produto (id),
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_codigo_produto_id ON codigo (produto_id);

-- ─── sku_sequencia ───────────────────────────────────────────────────────────

CREATE TABLE sku_sequencia (
  categoria categoria PRIMARY KEY,
  proximo   INT NOT NULL DEFAULT 1
);

INSERT INTO sku_sequencia (categoria) VALUES
  ('MOT'), ('FRE'), ('TRA'), ('ELE'), ('SUS'), ('PNE'), ('ACC'), ('OUT');

-- ─── movimentacao ────────────────────────────────────────────────────────────

CREATE TABLE movimentacao (
  id             SERIAL PRIMARY KEY,
  tipo           tipo_movimentacao NOT NULL,
  quantidade     INT               NOT NULL,
  custo_unitario NUMERIC(10,2)     NOT NULL,
  observacao     TEXT,
  produto_id     INT               NOT NULL REFERENCES produto    (id),
  usuario_id     INT               NOT NULL REFERENCES usuario    (id),
  fornecedor_id  INT                        REFERENCES fornecedor (id),
  criado_em      TIMESTAMPTZ       NOT NULL DEFAULT now()
);

CREATE INDEX idx_mov_produto_id ON movimentacao (produto_id);
CREATE INDEX idx_mov_usuario_id ON movimentacao (usuario_id);
CREATE INDEX idx_mov_tipo       ON movimentacao (tipo);
CREATE INDEX idx_mov_criado_em  ON movimentacao (criado_em);

-- ─── venda_sequencia ─────────────────────────────────────────────────────────

CREATE TABLE venda_sequencia (
  id      INT PRIMARY KEY DEFAULT 1,
  proximo INT NOT NULL DEFAULT 1
);

INSERT INTO venda_sequencia (id, proximo) VALUES (1, 1);

-- ─── venda ───────────────────────────────────────────────────────────────────

CREATE TABLE venda (
  id                  SERIAL PRIMARY KEY,
  numero              TEXT            NOT NULL UNIQUE,
  cliente_nome        TEXT,
  cliente_telefone    TEXT,
  cliente_cpf         TEXT,
  forma_pagamento     forma_pagamento NOT NULL,
  subtotal            NUMERIC(10,2)   NOT NULL,
  desconto_percentual NUMERIC(5,2)    NOT NULL DEFAULT 0,
  desconto_aplicado   NUMERIC(10,2)   NOT NULL DEFAULT 0,
  total               NUMERIC(10,2)   NOT NULL,
  observacao          TEXT,
  usuario_id          INT             NOT NULL REFERENCES usuario (id),
  criado_em           TIMESTAMPTZ     NOT NULL DEFAULT now(),
  cancelado_em        TIMESTAMPTZ,
  cancelado_por_id    INT                      REFERENCES usuario (id)
);

CREATE INDEX idx_venda_criado_em       ON venda (criado_em);
CREATE INDEX idx_venda_usuario_id      ON venda (usuario_id);
CREATE INDEX idx_venda_forma_pagamento ON venda (forma_pagamento);

-- ─── item_venda ──────────────────────────────────────────────────────────────

CREATE TABLE item_venda (
  id             SERIAL PRIMARY KEY,
  venda_id       INT           NOT NULL REFERENCES venda   (id),
  produto_id     INT           NOT NULL REFERENCES produto  (id),
  quantidade     INT           NOT NULL,
  preco_unitario NUMERIC(10,2) NOT NULL,
  custo_unitario NUMERIC(10,2) NOT NULL,
  subtotal       NUMERIC(10,2) NOT NULL
);

CREATE INDEX idx_item_venda_venda_id   ON item_venda (venda_id);
CREATE INDEX idx_item_venda_produto_id ON item_venda (produto_id);

-- ─── Seed: usuário MASTER ────────────────────────────────────────────────────
-- Senha: admin123 (bcrypt hash)

INSERT INTO usuario (nome, email, senha_hash, perfil) VALUES (
  'Administrador',
  'admin@loja.com',
  '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'MASTER'
);
