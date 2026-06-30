/*
  Warnings:

  - A unique constraint covering the columns `[xenditInvoiceId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentUrl" TEXT,
ADD COLUMN     "xenditInvoiceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_xenditInvoiceId_key" ON "Order"("xenditInvoiceId");
