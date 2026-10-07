# Guia de Instalação — MotoEstoque

Passo a passo completo para instalar o sistema em um novo computador do zero.

---

## 1. Pré-requisitos

Instale os programas abaixo na ordem indicada:

### Node.js
- Acesse: https://nodejs.org
- Baixe a versão **LTS** (22+)
- Instale com as opções padrão
- Verifique: `node -v`

### pnpm
Após instalar o Node, abra o terminal e rode:
```
npm install -g pnpm
```
Verifique: `pnpm -v`

### PostgreSQL
- Acesse: https://www.postgresql.org/download/windows/
- Baixe e instale a versão mais recente
- Durante a instalação:
  - Senha do usuário `postgres`: anote bem (você vai precisar)
  - Porta: **5432** (padrão)
  - Marque para instalar o **pgAdmin** (interface gráfica)
- Verifique se o serviço está rodando após a instalação

---

## 2. Copiar o projeto

Copie a pasta `Sistema` para o novo computador. Sugestão de destino:
```
C:\Projetos\Sistema
```

> Evite caminhos com acentos ou espaços (ex: `Bruno_Anotações`) pois podem causar problemas em alguns comandos Node.

---

## 3. Criar o banco de dados

Abra o **pgAdmin** (instalado junto com o PostgreSQL) e:

1. Conecte ao servidor local com a senha definida na instalação
2. Clique com botão direito em **Databases** → **Create** → **Database**
3. Nome: `estoque_moto`
4. Clique em **Save**

---

## 4. Configurar variáveis de ambiente

### API — `apps/api/.env`

Crie o arquivo `apps/api/.env` com o conteúdo abaixo, ajustando a senha do PostgreSQL:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/estoque_moto"
JWT_SECRET="troque-por-uma-chave-secreta-longa-aqui-minimo-32-chars"
JWT_REFRESH_SECRET="troque-por-outra-chave-secreta-longa-aqui-minimo-32-chars"
PORT=3001
NODE_ENV=development
UPLOAD_DIR=./uploads
FRONTEND_URL=http://localhost:3000
```

> Substitua `SUA_SENHA` pela senha que você definiu ao instalar o PostgreSQL.

### Banco — `packages/db/.env`

Crie o arquivo `packages/db/.env` com o mesmo DATABASE_URL:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/estoque_moto"
```

### Web — `apps/web/.env.local`

Crie o arquivo `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

---

## 5. Instalar dependências

Abra o terminal na raiz do projeto (`C:\Projetos\Sistema`) e rode:

```
pnpm install
```

---

## 6. Configurar o banco de dados

Ainda na raiz do projeto, rode em sequência:

```
cd packages\db
pnpm prisma generate
pnpm prisma migrate deploy
pnpm prisma db seed
cd ..\..
```

O seed cria o usuário inicial:
- **Email:** `admin@loja.com`
- **Senha:** `admin123`

> Troque a senha após o primeiro login!

---

## 7. Subir o sistema

Na raiz do projeto:

```
pnpm dev
```

Aguarde os dois serviços subirem:
- **Web (frontend):** http://localhost:3000
- **API (backend):** http://localhost:3001

---

## 8. Primeiro acesso

1. Abra o navegador em http://localhost:3000
2. Login: `admin@loja.com` / `admin123`
3. Vá em **Usuários** e troque a senha

---

## Problemas comuns

### Erro: `@prisma/client did not initialize yet`
Rode novamente:
```
cd packages\db && pnpm prisma generate
```

### Erro de conexão com o banco
- Verifique se o serviço do PostgreSQL está rodando (Serviços do Windows → `postgresql-x64-XX`)
- Confirme a senha no `DATABASE_URL`
- Confirme que o banco `estoque_moto` foi criado

### Porta já em uso
Para matar processos nas portas 3000 e 3001:
```
for /f "tokens=5" %a in ('netstat -ano ^| findstr :3000') do taskkill /PID %a /F
for /f "tokens=5" %a in ('netstat -ano ^| findstr :3001') do taskkill /PID %a /F
```

### pnpm não reconhecido
Feche e reabra o terminal após instalar o Node.js, ou rode:
```
npm install -g pnpm
```

---

## Acessar de outro computador na mesma rede

Se quiser acessar o sistema de outro computador na mesma rede Wi-Fi:

1. Descubra o IP da máquina que roda o sistema:
```
ipconfig
```
Anote o `Endereço IPv4` (ex: `192.168.1.105`)

2. Atualize `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://192.168.1.105:3001/api/v1
```

3. Reinicie o `pnpm dev`

4. No outro computador, acesse: `http://192.168.1.105:3000`

---

## Resumo dos comandos do dia a dia

| Ação | Comando |
|------|---------|
| Subir o sistema | `pnpm dev` (na raiz) |
| Gerar Prisma client | `cd packages\db && pnpm prisma generate` |
| Rodar migrations | `cd packages\db && pnpm prisma migrate deploy` |
| Rodar seed | `cd packages\db && pnpm prisma db seed` |
| Abrir banco visual | pgAdmin ou DBeaver |
