import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useRef, useEffect } from "react";
import { Building2, Mail, Phone, MapPin, Hash, Upload, Moon, Sun, Monitor, History, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useUIStore } from '@/store/useUIStore';

export default function Settings() {
  const officeSettings = useUIStore((state) => state.officeSettings);
  const setOfficeSettings = useUIStore((state) => state.setOfficeSettings);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  
  // Initialize with fallback to prevent runtime errors if store is empty
  const [formData, setFormData] = useState(officeSettings || {
    name: "",
    vatNumber: "",
    address: "",
    phone: "",
    email: "",
    logo: ""
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (officeSettings) {
      setFormData(officeSettings);
    }
  }, [officeSettings]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("حجم الصورة يجب أن لا يتجاوز 5 ميجابايت");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result as string }));
        toast.success("تم تغيير الشعار، لا تنسى حفظ التغييرات");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setOfficeSettings(formData);
    toast.success("تم حفظ الإعدادات بنجاح");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">إعدادات المكتب</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">إدارة معلومات المكتب، الهوية البصرية، وتفضيلات النظام.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm dark:bg-navy-800">
            <CardHeader className="border-b border-slate-50 dark:border-white/5">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary-500" />
                معلومات المكتب الأساسية
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم المكتب</Label>
                  <div className="relative">
                    <Building2 className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input 
                      id="name" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="ps-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vat">الرقم الضريبي (مصلحة الضرائب)</Label>
                  <div className="relative">
                    <Hash className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input 
                      id="vat" 
                      value={formData.vatNumber} 
                      onChange={(e) => setFormData({...formData, vatNumber: e.target.value})}
                      className="ps-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني الرسمي</Label>
                  <div className="relative">
                    <Mail className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input 
                      id="email" 
                      type="email"
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="ps-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <div className="relative">
                    <Phone className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input 
                      id="phone" 
                      value={formData.phone} 
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="ps-10"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">العنوان الجغرافي</Label>
                <div className="relative">
                  <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input 
                    id="address" 
                    value={formData.address} 
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="ps-10"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button onClick={handleSave} className="bg-primary-500 hover:bg-primary-600 text-white">
                  حفظ التغييرات
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm dark:bg-navy-800">
            <CardHeader className="border-b border-slate-50 dark:border-white/5">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Monitor className="w-5 h-5 text-primary-500" />
                تفضيلات المظهر (Theme)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4">
                <button 
                  onClick={() => setTheme("light")}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${theme === 'light' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-100 dark:border-white/5 hover:border-slate-200 dark:border-white/10'}`}
                >
                  <Sun className={theme === 'light' ? 'text-primary-600' : 'text-slate-400'} />
                  <span className="text-sm font-bold">فاتح</span>
                </button>
                <button 
                  onClick={() => setTheme("dark")}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${theme === 'dark' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-100 dark:border-white/5 hover:border-slate-200 dark:border-white/10'}`}
                >
                  <Moon className={theme === 'dark' ? 'text-primary-600' : 'text-slate-400'} />
                  <span className="text-sm font-bold">داكن</span>
                </button>
                <button 
                  onClick={() => setTheme("system")}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${theme === 'system' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-100 dark:border-white/5 hover:border-slate-200 dark:border-white/10'}`}
                >
                  <Monitor className={theme === 'system' ? 'text-primary-600' : 'text-slate-400'} />
                  <span className="text-sm font-bold">تلقائي</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm dark:bg-navy-800">
            <CardHeader className="border-b border-slate-50 dark:border-white/5">
              <CardTitle className="text-lg font-bold">شعار المكتب</CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-200 dark:border-white/10">
                {formData.logo ? (
                  <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building2 size={48} className="text-slate-300" />
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleLogoChange} 
                accept="image/png, image/jpeg, image/svg+xml" 
                className="hidden" 
              />
              <Button variant="outline" className="w-full gap-2" onClick={() => fileInputRef.current?.click()}>
                <Upload size={16} />
                تغيير الشعار
              </Button>
              <p className="text-[10px] text-slate-400 text-center">يفضل استخدام صورة بصيغة PNG أو SVG بخلفية شفافة.</p>
            </CardContent>
          </Card>

          {/* سجل العمليات */}
          <Card className="border-none shadow-sm dark:bg-navy-800 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/audit-logs')}>
            <CardContent className="p-6 flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <History size={28} className="text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-bold text-navy-900 dark:text-white">سجل العمليات</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                تتبع كافة الأنشطة والتغييرات على النظام — مين فتح ملف، مين عدّل فاتورة، ومتى.
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full">
                <ShieldCheck size={12} />
                أداة أمنية — للمدير فقط
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
