'use client';

import { useState } from 'react';
import { sendContract } from '@/lib/eformsign';
import { formatPhoneNumber, validateForm, FormData, FormState, initialFormState, createLoadingState, createSuccessState, createErrorState } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DemoInfo from '@/components/DemoInfo';

export default function ContractForm() {
  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    phoneNumber: '',
    contractDetails: ''
  });
  
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [remainingDocs, setRemainingDocs] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 폼 검증
    const validation = validateForm(formData);
    if (!validation.isValid) {
      setFormState(createErrorState(`입력 정보를 확인해주세요: ${validation.errors.join(', ')}`));
      return;
    }

    setFormState(createLoadingState());

    try {
      const response = await sendContract(validation.cleanData);
      
      if (response.success && response.document) {
        setFormState(createSuccessState());
        
        // 성공 시 DemoInfo 새로고침 트리거 (실제 서버 데이터 조회)
        setRefreshTrigger(prev => prev + 1);
        
        // 성공 시 폼 초기화
        setFormData({
          customerName: '',
          phoneNumber: '',
          contractDetails: ''
        });
      } else {
        setFormState(createErrorState(response.error?.message || '발송에 실패했습니다'));
      }
    } catch (error) {
      setFormState(createErrorState('시스템 오류가 발생했습니다'));
    }
  };

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, phoneNumber: formatted }));
  };

  // 발송 가능 여부 체크
  const canSend = remainingDocs === null || remainingDocs > 0;

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* 데모 정보 표시 */}
      <DemoInfo onRemainingUpdate={setRemainingDocs} refreshTrigger={refreshTrigger} />
      
      {/* 계약서 발송 폼 */}
      <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="bg-slate-800 text-white rounded-t-lg">
        <CardTitle className="text-center text-lg font-semibold">🛡️ 디지털 계약서 발송</CardTitle>
        <CardDescription className="text-center text-slate-200">
          고객 정보를 입력하시면 디지털 계약서가 즉시 발송됩니다
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
              고객명 *
            </label>
            <Input
              type="text"
              id="customerName"
              value={formData.customerName}
              onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
              placeholder="고객명을 입력하세요"
              className="text-gray-900 placeholder:text-gray-400"
              required
              disabled={formState.isLoading}
            />
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
              휴대폰번호 *
            </label>
            <Input
              type="tel"
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={handlePhoneInput}
              placeholder="010-0000-0000"
              className="text-gray-900 placeholder:text-gray-400"
              required
              disabled={formState.isLoading}
            />
          </div>

          <div>
            <label htmlFor="contractDetails" className="block text-sm font-medium text-gray-700 mb-1">
              계약내용 *
            </label>
            <textarea
              id="contractDetails"
              value={formData.contractDetails}
              onChange={(e) => setFormData(prev => ({ ...prev, contractDetails: e.target.value }))}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              rows={3}
              placeholder="계약 내용을 간단히 입력하세요"
              required
              disabled={formState.isLoading}
            />
          </div>

          <Button
            type="submit"
            disabled={formState.isLoading || !canSend}
            className={`w-full font-semibold py-3 rounded-md transition-colors ${
              !canSend 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
          >
            {formState.isLoading 
              ? '📤 발송 중...' 
              : !canSend 
                ? '📄 발송 한도 초과' 
                : '📄 계약서 발송하기'
            }
          </Button>

          {!canSend && remainingDocs === 0 && (
            <Alert className="border-orange-500 bg-orange-50">
              <AlertDescription className="text-orange-800">
                <strong>⚠️ 발송 한도 초과</strong>
                <div className="mt-1">
                  무료체험 발송 한도를 모두 사용했습니다.
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 결과 표시 */}
          {formState.isSuccess && (
            <Alert className="border-green-500 bg-green-50">
              <AlertDescription className="text-green-800">
                <strong>✅ 발송 완료!</strong>
                <div className="mt-1">
                  SMS가 성공적으로 발송되었습니다!
                </div>
              </AlertDescription>
            </Alert>
          )}
          {formState.isError && (
            <Alert className="border-red-500 bg-red-50">
              <AlertDescription className="text-red-800">
                <strong>❌ 발송 실패</strong>
                <div className="mt-1">
                  {formState.errorMessage}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
    </div>
  );
}