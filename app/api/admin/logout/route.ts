import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const cookieStore = cookies()

    // Remove admin session cookie
    cookieStore.delete("admin-session")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
