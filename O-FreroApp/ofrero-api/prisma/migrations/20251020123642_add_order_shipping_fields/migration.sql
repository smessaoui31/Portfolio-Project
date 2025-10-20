/*
  Warnings:

  - Added the required column `shippingCity` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingLine1` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingPhone` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingPostalCode` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shippingCity" TEXT NOT NULL,
ADD COLUMN     "shippingLine1" TEXT NOT NULL,
ADD COLUMN     "shippingLine2" TEXT,
ADD COLUMN     "shippingPhone" TEXT NOT NULL,
ADD COLUMN     "shippingPostalCode" TEXT NOT NULL;
