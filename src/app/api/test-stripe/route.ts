import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    
    // Basic validation
    const validation = {
      exists: !!secretKey,
      length: secretKey ? secretKey.length : 0,
      prefix: secretKey ? secretKey.substring(0, 8) : 'none',
      hasSpaces: secretKey ? secretKey.includes(' ') : false,
      hasNewlines: secretKey ? secretKey.includes('\n') || secretKey.includes('\r') : false,
      environment: process.env.VERCEL_ENV || 'local'
    };

    return NextResponse.json({
      message: 'Stripe key validation',
      validation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Validation failed',
      message: (error as Error).message
    }, { status: 500 });
  }
} 