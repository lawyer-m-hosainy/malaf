import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface ConsentModalProps {
  isOpen: boolean;
  onAccept: (consents: Record<string, boolean>) => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({ isOpen, onAccept }) => {
  const [consents, setConsents] = useState({
    essential: true, // Always true
    marketing: false,
    analytics: false,
  });

  const handleAccept = () => {
    onAccept(consents);
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>الموافقة على معالجة البيانات</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox id="essential" checked disabled />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="essential">الخدمات الأساسية (إلزامي)</Label>
              <p className="text-xs text-muted-foreground">
                ضروري لتشغيل المنصة وإدارة القضايا والفوترة.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox 
              id="marketing" 
              checked={consents.marketing} 
              onCheckedChange={(checked) => setConsents(prev => ({ ...prev, marketing: !!checked }))}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="marketing">التسويق والتواصل</Label>
              <p className="text-xs text-muted-foreground">
                إرسال تحديثات قانونية وعروض خاصة عبر البريد أو واتساب.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox 
              id="analytics" 
              checked={consents.analytics} 
              onCheckedChange={(checked) => setConsents(prev => ({ ...prev, analytics: !!checked }))}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="analytics">تحسين الخدمة (التحليلات)</Label>
              <p className="text-xs text-muted-foreground">
                مساعدتنا في فهم كيفية استخدامك للمنصة لتحسين تجربتك.
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAccept}>تأكيد وحفظ التفضيلات</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
