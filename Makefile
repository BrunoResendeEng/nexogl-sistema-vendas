# Atalhos para o fluxo de desenvolvimento
# Uso: make <comando>

.PHONY: db-up db-down db-migrate db-seed db-reset dev

## Sobe apenas o PostgreSQL em background
db-up:
	docker compose -f docker-compose.db.yml up -d

## Para o PostgreSQL
db-down:
	docker compose -f docker-compose.db.yml down

## Roda as migrations pendentes
db-migrate:
	pnpm --filter @repo/db db:migrate

## Roda o seed
db-seed:
	pnpm --filter @repo/db db:seed

## Reset completo: drop + migrate + seed
db-reset:
	pnpm --filter @repo/db exec prisma migrate reset --force

## Sobe tudo em modo desenvolvimento
dev:
	docker compose -f docker-compose.db.yml up -d
	pnpm dev
