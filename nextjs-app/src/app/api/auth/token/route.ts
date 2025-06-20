/**
 * Next.js API Route: 토큰 발급
 * POST /api/auth/token
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/eformsign';
import { handleApiError, createSuccessResponse } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    // 토큰 발급
    const tokenData = await getAccessToken();
    
    // 직접 토큰 데이터 반환 (래핑하지 않음)
    return NextResponse.json(tokenData);
  } catch (error) {
    const { status, body } = handleApiError(error as Error);
    return NextResponse.json(body, { status });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}