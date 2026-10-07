-- =============================================================================
-- views_consulta.sql
-- Views para consulta manual no DBeaver/psql com nomes e colunas em snake_case
-- A API continua usando as tabelas originais normalmente.
-- Executar uma vez no banco estoque_moto.
-- =============================================================================

-- usuario
CREATE OR REPLACE VIEW vw_usuario AS
SELECT
  id,
  nome,
  email,
  perfil,
  ativo,
  "tentativasFalhas"  AS tentativas_falhas,
  "bloqueadoAte"      AS bloqueado_ate,
  "criadoEm"          AS criado_em,
  "atualizadoEm"      AS atualizado_em
FROM "Usuario";

-- fornecedor
CREATE OR REPLACE VIEW vw_fornecedor AS
SELECT
  id,
  "razaoSocial"  AS razao_social,
  cnpj,
  telefone,
  email,
  contato,
  ativo,
  "criadoEm"     AS criado_em,
  "atualizadoEm" AS atualizado_em
FROM "Fornecedor";

-- produto
CREATE OR REPLACE VIEW vw_produto AS
SELECT
  id,
  sku,
  nome,
  descricao,
  categoria,
  unidade,
  marca,
  aplicacao,
  localizacao,
  "fotoUrl"        AS foto_url,
  "estoqueMinimo"  AS estoque_minimo,
  "estoqueAtual"   AS estoque_atual,
  "custoMedio"     AS custo_medio,
  "precoVenda"     AS preco_venda,
  ativo,
  "criadoEm"       AS criado_em,
  "atualizadoEm"   AS atualizado_em
FROM "Produto";

-- venda
CREATE OR REPLACE VIEW vw_venda AS
SELECT
  v.id,
  v.numero,
  v."clienteNome"        AS cliente_nome,
  v."clienteTelefone"    AS cliente_telefone,
  v."clienteCpf"         AS cliente_cpf,
  v."formaPagamento"     AS forma_pagamento,
  v.subtotal,
  v."descontoPercentual" AS desconto_percentual,
  v."descontoAplicado"   AS desconto_aplicado,
  v.total,
  v.observacao,
  v."usuarioId"          AS usuario_id,
  u.nome                 AS usuario_nome,
  v."criadoEm"           AS criado_em,
  v."canceladoEm"        AS cancelado_em,
  v."canceladoPorId"     AS cancelado_por_id,
  c.nome                 AS cancelado_por_nome
FROM "Venda" v
JOIN "Usuario" u ON u.id = v."usuarioId"
LEFT JOIN "Usuario" c ON c.id = v."canceladoPorId";

-- item_venda
CREATE OR REPLACE VIEW vw_item_venda AS
SELECT
  i.id,
  i."vendaId"       AS venda_id,
  v.numero          AS venda_numero,
  i."produtoId"     AS produto_id,
  p.sku             AS produto_sku,
  p.nome            AS produto_nome,
  i.quantidade,
  i."precoUnitario" AS preco_unitario,
  i."custoUnitario" AS custo_unitario,
  i.subtotal
FROM "ItemVenda" i
JOIN "Venda"   v ON v.id = i."vendaId"
JOIN "Produto" p ON p.id = i."produtoId";

-- movimentacao
CREATE OR REPLACE VIEW vw_movimentacao AS
SELECT
  m.id,
  m.tipo,
  m.quantidade,
  m."custoUnitario" AS custo_unitario,
  m.observacao,
  m."produtoId"     AS produto_id,
  p.sku             AS produto_sku,
  p.nome            AS produto_nome,
  m."usuarioId"     AS usuario_id,
  u.nome            AS usuario_nome,
  m."fornecedorId"  AS fornecedor_id,
  f."razaoSocial"   AS fornecedor_nome,
  m."criadoEm"      AS criado_em
FROM "Movimentacao" m
JOIN "Produto"          p ON p.id = m."produtoId"
JOIN "Usuario"          u ON u.id = m."usuarioId"
LEFT JOIN "Fornecedor"  f ON f.id = m."fornecedorId";
