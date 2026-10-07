<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=200&section=header&text=Nexo%20GL%20Digital&fontSize=62&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Sistema%20de%20Gestão%20de%20Peças%20para%20Moto&descAlignY=58&descSize=16" width="100%"/>

</div>

<div align="center">

[![Site](https://img.shields.io/badge/🌐_Site-nexogldigital.com.br-22d3ee?style=for-the-badge&logo=googlechrome&logoColor=white)](https://nexogldigital.com.br)
[![Status](https://img.shields.io/badge/Status-✅_Em_Produção-00ff88?style=for-the-badge)](#)
[![Licença](https://img.shields.io/badge/Licença-Privado-red?style=for-the-badge)](#)

<br/>

[![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](#)
[![Fastify](https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL_18-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](#)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](#)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](#)

</div>

---

## ⚡ Sobre o Projeto

<div align="center">

> Sistema completo de gestão de peças para moto desenvolvido pela **Nexo GL Digital**.
> Controle de estoque, vendas, fornecedores, relatórios e muito mais — tudo em uma interface Dark Tech.

</div>

<br/>

<div align="center">

| 🎯 Item | 📝 Descrição |
|:---:|:---|
| 🏪 **Produtos** | Cadastro com SKU automático, estoque mínimo e badge de status |
| 🛒 **Vendas** | Carrinho completo com desconto PIX automático (5%) |
| 📦 **Movimentações** | Entrada, saída, ajuste, perda e devolução com rastreio |
| 🏭 **Fornecedores** | CRUD completo com validação de CNPJ |
| 📊 **Dashboard** | Cards, gráfico de faturamento e estoque crítico em tempo real |
| 📈 **Relatórios** | Vendas, mais vendidos, produtos parados e export CSV |
| 👥 **Usuários** | Perfis MASTER, ADMIN e OPERADOR com proteções por nível |
| 🔐 **Autenticação** | JWT + Refresh Token, bloqueio por tentativas e recuperação de senha |
| 📷 **Scanner** | Leitor de código de barras via USB HID e webcam integrados |

</div>

---

## 🛠️ Stack

<div align="center">

### Backend
![Fastify](https://img.shields.io/badge/Fastify_4-000000?style=for-the-badge&logo=fastify&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js_20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_5-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)

### Frontend
![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

### Banco & Infra
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_18-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)

</div>

---

## 📁 Arquitetura

```bash
Sistema/
├── apps/
│   ├── api/                    # Fastify + Prisma (porta 3001)
│   │   └── src/
│   │       ├── routes/         # Endpoints REST
│   │       ├── services/       # Regras de negócio
│   │       ├── schemas/        # Validação Zod
│   │       └── plugins/        # Auth, CORS, Rate Limit
│   └── web/                    # Next.js 14 (porta 3000)
│       └── src/
│           ├── app/            # App Router (auth + dashboard)
│           ├── components/     # UI, layout, scanner, produto
│           └── hooks/          # SWR hooks customizados
└── packages/
    ├── db/                     # Schema Prisma + migrations + seed
    ├── types/                  # Tipos compartilhados
    └── utils/                  # Utilitários compartilhados
```

---

## 🚀 Instalação

**Pré-requisitos:** Node.js >= 20, pnpm >= 12, PostgreSQL 18 na porta `5433`

```bash
# Clonar o repositório
git clone https://github.com/BrunoResendeEng/nexogl-sistema-vendas.git
cd nexogl-sistema-vendas

# Instalar dependências
pnpm install

# Aplicar migrations e seed
cd packages/db
npx prisma migrate deploy
node "../../node_modules/.pnpm/tsx@4.23.15/node_modules/tsx/dist/cli.mjs" prisma/seed.ts
cd ../..

# Rodar o projeto
pnpm dev
```

| Serviço  | URL                     |
|----------|-------------------------|
| Frontend | http://localhost:3000   |
| API      | http://localhost:3001   |

---

## 🔐 Acesso

| Perfil | E-mail | Senha |
|--------|--------|-------|
| MASTER | admin@loja.com | admin123 |

---

## 👥 Perfis de Usuário

<div align="center">

| Perfil | Permissões |
|:---:|:---|
| 🔴 **MASTER** | Acesso total. Não pode ser excluído. Só MASTER cria outro MASTER. |
| 🟡 **ADMIN** | Gerencia produtos, usuários e pode cancelar vendas. |
| 🟢 **OPERADOR** | Registra vendas e movimentações. |

</div>

---

## 📦 Regras de Negócio

### Estoque
- Nunca alterado diretamente — sempre via `Movimentacao`
- Ao criar produto com `estoqueInicial > 0` → cria movimentação `ENTRADA`
- Ao registrar venda → cria movimentação `SAIDA` por item
- Ao cancelar venda → cria movimentação `DEVOLUCAO` por item

### Status do Estoque

| Condição | Badge |
|----------|-------|
| `estoqueAtual === 0` | 🔴 SEM ESTOQUE |
| `estoqueAtual <= estoqueMinimo` | 🟠 BAIXO |
| `estoqueAtual > estoqueMinimo` | 🟢 OK |

### SKU
- Gerado automaticamente: `{CATEGORIA}-{NNNNN}` (ex: `MOT-00042`)
- Categoria não pode ser alterada após criação

### Desconto PIX
- 5% automático ao selecionar PIX como forma de pagamento
- Pode ser desmarcado no momento da venda

---

## 📬 Contato

<div align="center">

[![Site](https://img.shields.io/badge/🌐_nexogldigital.com.br-Visitar-22d3ee?style=for-the-badge)](https://nexogldigital.com.br)
[![WhatsApp](https://img.shields.io/badge/📱_WhatsApp-Falar-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://wa.me/5511967450247)
[![Instagram](https://img.shields.io/badge/📸_@nexogldigital-Seguir-E1306C?style=for-the-badge&logo=instagram&logoColor=white)](https://instagram.com/nexogldigital)

<br/>

📍 **Osasco · SP · Brasil**

</div>

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=120&section=footer&text=Nexo%20GL%20Digital&fontSize=20&fontColor=ffffff&animation=fadeIn" width="100%"/>

**Desenvolvido por [Bruno Resende](https://github.com/BrunoResendeEng)**

*© 2026 Nexo GL Digital · Osasco · SP · Brasil*

</div>
