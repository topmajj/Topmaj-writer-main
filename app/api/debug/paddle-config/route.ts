import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    vendorId: process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID,
    productIdPro: process.env.NEXT_PUBLIC_PADDLE_PRODUCT_ID_PRO,
    productIdBusiness: process.env.NEXT_PUBLIC_PADDLE_PRODUCT_ID_BUSINESS,
    priceIdPro: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_PRO,
    priceIdBusiness: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_BUSINESS,
    environment: process.env.PADDLE_ENVIRONMENT || "sandbox",
  })
}
