import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'healthy', 
    service: 'theme-evolution-api',
    timestamp: new Date().toISOString()
  });
}

