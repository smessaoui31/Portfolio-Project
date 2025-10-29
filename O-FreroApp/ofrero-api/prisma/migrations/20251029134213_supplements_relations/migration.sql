/*
  Warnings:

  - A unique constraint covering the columns `[cartId,productId,cooking]` on the table `CartItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "CookingLevel" AS ENUM ('NORMAL', 'WELL_DONE', 'EXTRA_CRISPY');

-- DropIndex
DROP INDEX "public"."CartItem_cartId_productId_key";

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "cooking" "CookingLevel" NOT NULL DEFAULT 'NORMAL';

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "cooking" "CookingLevel" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "supplementsTotalCents" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Supplement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSupplement" (
    "productId" TEXT NOT NULL,
    "supplementId" TEXT NOT NULL,
    "overridePriceCents" INTEGER,

    CONSTRAINT "ProductSupplement_pkey" PRIMARY KEY ("productId","supplementId")
);

-- CreateTable
CREATE TABLE "CartItemSupplement" (
    "id" TEXT NOT NULL,
    "cartItemId" TEXT NOT NULL,
    "supplementId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,

    CONSTRAINT "CartItemSupplement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItemSupplement" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,

    CONSTRAINT "OrderItemSupplement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Supplement_name_key" ON "Supplement"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productId_cooking_key" ON "CartItem"("cartId", "productId", "cooking");

-- AddForeignKey
ALTER TABLE "ProductSupplement" ADD CONSTRAINT "ProductSupplement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSupplement" ADD CONSTRAINT "ProductSupplement_supplementId_fkey" FOREIGN KEY ("supplementId") REFERENCES "Supplement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItemSupplement" ADD CONSTRAINT "CartItemSupplement_cartItemId_fkey" FOREIGN KEY ("cartItemId") REFERENCES "CartItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItemSupplement" ADD CONSTRAINT "CartItemSupplement_supplementId_fkey" FOREIGN KEY ("supplementId") REFERENCES "Supplement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemSupplement" ADD CONSTRAINT "OrderItemSupplement_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
