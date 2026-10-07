# MotoEstoque — Sistema de Gestão de Peças

## Como iniciar

```bash
cd "C:\Users\bruno.resende\Desktop\Bruno_Anotações\Desenvolvimento\Sistema"
pnpm dev
```

Sobe API (3001) e Web (3000) em paralelo. Parar: `Ctrl+C`.

## URLs

| Serviço  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:3000 |
| API      | http://localhost:3001 |

---

## Banco de Dados

- **PostgreSQL 18**, porta `5433`
- Usuário: `postgres` / Senha: `postgres`
- Database: `estoque_moto`
- Instalado diretamente (sem Docker)

### Conectar via psql

```bash
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -p 5433 -U postgres -d estoque_moto
```

> ⚠️ O psql do PG18 pode falhar autenticação via linha de comando. Usar DBeaver (localhost:5433, usuário postgres, senha postgres).

### Aplicar migration manual

1. Rodar o SQL no DBeaver ou psql
2. Inserir registro na tabela `_prisma_migrations`
3. Rodar `prisma generate`

### Prisma Generate

```bash
# Parar o servidor antes (pnpm dev usa o .dll do client)
cd packages\db
node_modules\.bin\prisma generate
```

### Seed

```bash
cd packages\db
node "..\..\node_modules\.pnpm\tsx@4.23.15\node_modules\tsx\dist\cli.mjs" prisma/seed.ts
```

---

## Credenciais padrão

| Perfil | E-mail         | Senha    |
|--------|----------------|----------|
| MASTER | admin@loja.com | admin123 |

---

## Perfis de usuário

| Perfil       | Descrição |
|--------------|-----------|
| **MASTER**   | Superusuário. Acesso total. Não pode ser excluído nem desativado. Só MASTER cria outro MASTER. Badge roxo. |
| **ADMIN**    | Gerencia produtos, usuários e pode cancelar vendas. Badge laranja. |
| **OPERADOR** | Registra vendas e movimentações. Badge azul. |

---

## Arquitetura

```
Sistema/
├── apps/
│   ├── api/          # Fastify + Prisma (porta 3001)
│   └── web/          # Next.js 14 + Tailwind + shadcn/ui (porta 3000)
└── packages/
    ├── db/           # Schema Prisma + migrations + seed
    ├── types/        # Tipos compartilhados (Perfil, etc.)
    └── utils/        # Utilitários compartilhados
```

## Stack

| Camada    | Tecnologia |
|-----------|------------|
| Monorepo  | Turborepo + pnpm workspaces |
| API       | Fastify 4, Prisma 5.22, @fastify/jwt, @fastify/cookie, Zod |
| Frontend  | Next.js 14, React 18, Tailwind CSS 3, shadcn/ui, SWR |
| Auth      | JWT access (15min) + Refresh Token (7d) via cookie |
| Banco     | PostgreSQL 18 |

---

## Regras de negócio

### Estoque
- Estoque **nunca** é alterado diretamente — sempre via `Movimentacao`
- Tipos: `ENTRADA`, `SAIDA`, `AJUSTE`, `PERDA`, `DEVOLUCAO`
- Ao criar produto com `estoqueInicial > 0` → cria movimentação `ENTRADA`
- Ao registrar venda → cria movimentação `SAIDA` por item
- Ao cancelar venda → cria movimentação `DEVOLUCAO` por item (estoque volta)

### Status do estoque (badge na tabela de produtos)
| Condição | Cor | Label |
|----------|-----|-------|
| `estoqueAtual === 0` | 🔴 Vermelho | SEM ESTOQUE |
| `estoqueAtual <= estoqueMinimo` | 🟠 Laranja | BAIXO |
| `estoqueAtual > estoqueMinimo` | 🟢 Verde | OK |

### Desconto PIX
- 5% automático quando forma de pagamento = PIX
- Checkbox para desmarcar no momento da venda
- Sempre persiste `descontoPercentual` (5.00 ou 0) e `descontoAplicado` (R$)

### Cancelamento de venda
- Apenas **MASTER** e **ADMIN** podem cancelar
- Cancela a venda inteira (não item a item)
- Cria movimentação `DEVOLUCAO` para cada item → estoque restaurado
- Registra `canceladoEm` e `canceladoPorId`
- Venda cancelada aparece riscada com badge `CANCELADA` na listagem

### SKU
- Gerado automaticamente: `{CATEGORIA}-{NNNNN}` (ex: `MOT-00042`)
- Sequência por categoria via tabela `SkuSequencia` com lock atômico
- Categoria **não pode ser alterada** após criação (define o SKU)

---

## Módulos implementados

- [x] Autenticação — login, logout, refresh token, bloqueio por tentativas
- [x] Usuários — CRUD completo com proteções por perfil
- [x] Produtos — listar, criar, editar, ativar/desativar, badge de estoque, upload de foto
- [x] Vendas — nova venda (carrinho), listagem, detalhe, desconto PIX
- [x] Cancelamento de venda — ADMIN/MASTER, devolução de estoque
- [x] Recibo — HTML para impressão via `GET /vendas/:id/recibo`
- [x] Movimentações — ENTRADA (recalcula custo médio), AJUSTE, PERDA, DEVOLUCAO; filtro por data
- [x] Fornecedores — CRUD completo, validação de CNPJ, soft delete, vínculo na ENTRADA
- [x] Dashboard — cards, estoque crítico, últimas vendas, gráfico 7 dias (Recharts)
- [x] Relatórios — vendas, mais vendidos, produtos parados, posição de estoque; export CSV
- [x] Código de barras — leitor USB HID (`use-scanner.ts`), webcam (`@zxing/browser`), integrado em produtos e nova venda

## Correções aplicadas

- [x] `"type": "module"` adicionado nos `package.json` de `@repo/utils`, `@repo/db` e `@repo/types` — resolvia ciclo ESM→CJS que impedia a API de iniciar
- [x] Campo `exports` dos pacotes internos atualizado com condições `import`/`require`/`types` para compatibilidade com `moduleResolution: NodeNext`
- [x] Enums renomeados no banco para PascalCase (`categoria` → `"Categoria"`, etc.) — banco foi criado com schema antigo sem `@map`, Prisma esperava nomes com maiúscula
- [x] Seed corrigido para atualizar `senhaHash` no `upsert` — antes só atualizava `perfil`, senha ficava desatualizada
- [x] Reset manual de senha via UPDATE direto no DBeaver quando hash no banco estava inválido

### Resetar senha do admin manualmente

```bash
# Gerar hash bcrypt de qualquer senha
node -e "const b=require('./node_modules/.pnpm/bcryptjs@3.0.3/node_modules/bcryptjs/index.js');b.hash('admin123',12).then(h=>console.log(h));"
```

Depois rodar no DBeaver:
```sql
UPDATE usuario SET tentativas_falhas = 0, bloqueado_ate = NULL, senha_hash = '<hash gerado>' WHERE email = 'admin@loja.com';
```
