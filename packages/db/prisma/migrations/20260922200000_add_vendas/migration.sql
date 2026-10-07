-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('DINHEIRO', 'PIX', 'CARTAO');

-- Add relation columns to Usuario and Produto (already exist, just adding relations via new tables)

-- CreateTable VendaSequencia
CREATE TABLE "VendaSequencia" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "proximo" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "VendaSequencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable Venda
CREATE TABLE "Venda" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "clienteNome" TEXT,
    "clienteTelefone" TEXT,
    "clienteCpf" TEXT,
    "formaPagamento" "FormaPagamento" NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "descontoPercentual" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "descontoAplicado" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "observacao" TEXT,
    "usuarioId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Venda_pkey" PRIMARY KEY ("id")
);

-- CreateTable ItemVenda
CREATE TABLE "ItemVenda" (
    "id" TEXT NOT NULL,
    "vendaId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "precoUnitario" DECIMAL(10,2) NOT NULL,
    "custoUnitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    CONSTRAINT "ItemVenda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Venda_numero_key" ON "Venda"("numero");
CREATE INDEX "Venda_criadoEm_idx" ON "Venda"("criadoEm");
CREATE INDEX "Venda_usuarioId_idx" ON "Venda"("usuarioId");
CREATE INDEX "Venda_formaPagamento_idx" ON "Venda"("formaPagamento");
CREATE INDEX "ItemVenda_vendaId_idx" ON "ItemVenda"("vendaId");
CREATE INDEX "ItemVenda_produtoId_idx" ON "ItemVenda"("produtoId");

-- AddForeignKey
ALTER TABLE "Venda" ADD CONSTRAINT "Venda_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ItemVenda" ADD CONSTRAINT "ItemVenda_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES "Venda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ItemVenda" ADD CONSTRAINT "ItemVenda_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
