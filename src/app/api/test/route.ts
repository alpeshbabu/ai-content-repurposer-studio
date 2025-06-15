import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Test endpoint working',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Test endpoint failed'
    }, { status: 500 })
  }
} 