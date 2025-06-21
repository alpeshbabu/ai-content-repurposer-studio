import { NextResponse } from 'next/server';

// Public endpoint - no auth required for debugging
export async function GET() {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    
    // Detailed character analysis
    const validation = {
      exists: !!secretKey,
      length: secretKey ? secretKey.length : 0,
      prefix: secretKey ? secretKey.substring(0, 8) : 'none',
      suffix: secretKey ? secretKey.substring(secretKey.length - 8) : 'none',
      hasSpaces: secretKey ? secretKey.includes(' ') : false,
      hasNewlines: secretKey ? secretKey.includes('\n') || secretKey.includes('\r') : false,
      hasTabs: secretKey ? secretKey.includes('\t') : false,
      hasQuotes: secretKey ? secretKey.includes('"') || secretKey.includes("'") : false,
      charCodes: secretKey ? secretKey.split('').slice(0, 10).map(c => c.charCodeAt(0)) : [],
      lastCharCodes: secretKey ? secretKey.split('').slice(-5).map(c => c.charCodeAt(0)) : [],
      environment: process.env.VERCEL_ENV || 'local',
      firstChar: secretKey ? secretKey.charCodeAt(0) : null,
      lastChar: secretKey ? secretKey.charCodeAt(secretKey.length - 1) : null
    };

    // Try to create a clean version
    const cleanKey = secretKey ? secretKey.replace(/["'\n\r\t]/g, '').trim() : null;
    const isCleanDifferent = cleanKey !== secretKey;

    return NextResponse.json({
      message: 'Stripe key validation',
      validation,
      cleanKeyLength: cleanKey ? cleanKey.length : 0,
      needsCleaning: isCleanDifferent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Validation failed',
      message: (error as Error).message
    }, { status: 500 });
  }
} 