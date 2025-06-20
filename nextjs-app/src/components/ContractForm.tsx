'use client';

import { useState } from 'react';
import { sendContract } from '@/lib/eformsign';
import { formatPhoneNumber, validateForm, FormData, FormState, initialFormState, createLoadingState, createSuccessState, createErrorState } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ContractForm() {
  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    phoneNumber: '',
    contractDetails: ''
  });
  
  const [formState, setFormState] = useState<FormState>(initialFormState);

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

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>🐛 방역 계약서 발송 시스템</CardTitle>
        <CardDescription>
          고객 정보를 입력하여 휴대폰으로 계약서를 발송합니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              rows={3}
              placeholder="계약 내용을 간단히 입력하세요"
              required
              disabled={formState.isLoading}
            />
          </div>

          <Button
            type="submit"
            disabled={formState.isLoading}
            className="w-full"
          >
            {formState.isLoading ? '발송 중...' : '📄 계약서 발송하기'}
          </Button>

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
  );
}