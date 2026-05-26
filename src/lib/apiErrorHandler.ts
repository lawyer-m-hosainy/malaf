/**
 * معيار استجابة الخطأ الموحد RFC 7807
 */
export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  errors?: Array<{ field: string; message: string }>;
}

export const createApiError = (
  slug: 'validation-error' | 'not-found' | 'unauthorized' | 'forbidden' | 'conflict' | 'payment-failed' | 'eta-rejection',
  detail: string,
  instance: string,
  status?: number,
  fieldErrors?: Array<{ field: string; message: string }>
): ApiError => {
  const statusMap: Record<string, number> = {
    'validation-error': 422,
    'not-found': 404,
    'unauthorized': 401,
    'forbidden': 403,
    'conflict': 409,
    'payment-failed': 402,
    'eta-rejection': 422,
  };

  const titleMap: Record<string, string> = {
    'validation-error': 'خطأ في التحقق من البيانات',
    'not-found': 'المورد غير موجود',
    'unauthorized': 'غير مصرح بالوصول',
    'forbidden': 'صلاحيات غير كافية',
    'conflict': 'تعارض في البيانات',
    'payment-failed': 'فشل عملية الدفع',
    'eta-rejection': 'رفض من منظومة الضرائب',
  };

  return {
    type: `https://api.malaf.pro/errors/${slug}`,
    title: titleMap[slug],
    status: status || statusMap[slug],
    detail,
    instance,
    errors: fieldErrors,
  };
};
