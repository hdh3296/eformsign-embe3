import { NextRequest, NextResponse } from 'next/server';
import { getTemplateList, getTemplateInfo } from '@/lib/eformsign';
import config from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    console.log('템플릿 API 호출 시작');
    
    const url = new URL(request.url);
    const templateId = url.searchParams.get('id');
    
    if (templateId) {
      // 특정 템플릿 정보 조회
      const result = await getTemplateInfo(templateId);
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          template: result.data
        });
      } else {
        return NextResponse.json({
          success: false,
          error: result.error
        }, { status: 400 });
      }
    } else {
      // 모든 템플릿 목록 조회
      const result = await getTemplateList();
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          templates: result.data,
          currentTemplateId: config.eformsign.templates.pestControl
        });
      } else {
        return NextResponse.json({
          success: false,
          error: result.error
        }, { status: 400 });
      }
    }
    
  } catch (error) {
    console.error('템플릿 API 에러:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : '서버 오류가 발생했습니다'
      }
    }, { status: 500 });
  }
}