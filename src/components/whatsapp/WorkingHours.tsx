import React, { useState } from "react";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const daysOfWeek = [
  { id: 'sat', label: 'السبت' },
  { id: 'sun', label: 'الأحد' },
  { id: 'mon', label: 'الاثنين' },
  { id: 'tue', label: 'الثلاثاء' },
  { id: 'wed', label: 'الأربعاء' },
  { id: 'thu', label: 'الخميس' },
  { id: 'fri', label: 'الجمعة' }
];

const timeOptions = [
  { value: "06:00", label: "6:00 ص" },
  { value: "07:00", label: "7:00 ص" },
  { value: "08:00", label: "8:00 ص" },
  { value: "09:00", label: "9:00 ص" },
  { value: "10:00", label: "10:00 ص" },
  { value: "11:00", label: "11:00 ص" },
  { value: "12:00", label: "12:00 م" },
  { value: "13:00", label: "1:00 م" },
  { value: "14:00", label: "2:00 م" },
  { value: "15:00", label: "3:00 م" },
  { value: "16:00", label: "4:00 م" },
  { value: "17:00", label: "5:00 م" },
  { value: "18:00", label: "6:00 م" },
  { value: "19:00", label: "7:00 م" },
  { value: "20:00", label: "8:00 م" },
  { value: "21:00", label: "9:00 م" },
  { value: "22:00", label: "10:00 م" },
  { value: "23:00", label: "11:00 م" }
];

export default function WorkingHours() {
  const [workingHours, setWorkingHours] = useState({
    from: '08:00',
    to: '17:00',
    days: ['sat', 'sun', 'mon', 'tue', 'wed', 'thu']
  });

  const toggleDay = (dayId: string) => {
    setWorkingHours(prev => {
      const isSelected = prev.days.includes(dayId);
      return {
        ...prev,
        days: isSelected 
          ? prev.days.filter(d => d !== dayId) 
          : [...prev.days, dayId]
      };
    });
  };

  const handleTimeChange = (type: 'from' | 'to', value: string) => {
    setWorkingHours(prev => ({ ...prev, [type]: value }));
  };

  return (
    <Card className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-green-700" />
          <CardTitle className="text-lg font-bold text-gray-800">أوقات العمل</CardTitle>
        </div>
        <CardDescription className="text-sm text-gray-500">
          خارج هذه الأوقات، يُرسَل رد الغياب تلقائياً
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* ساعات العمل */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-end" dir="rtl">
          <div className="space-y-2 flex-1">
            <Label>من الساعة</Label>
            <Select value={workingHours.from} onValueChange={(val) => val && handleTimeChange('from', val)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر وقت البداية" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map(time => (
                  <SelectItem key={`from-${time.value}`} value={time.value}>
                    {time.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2 flex-1">
            <Label>إلى الساعة</Label>
            <Select value={workingHours.to} onValueChange={(val) => val && handleTimeChange('to', val)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر وقت النهاية" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map(time => (
                  <SelectItem key={`to-${time.value}`} value={time.value}>
                    {time.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* أيام العمل */}
        <div className="space-y-3">
          <Label>أيام العمل</Label>
          <div className="flex flex-wrap gap-2">
            {daysOfWeek.map((day) => {
              const isActive = workingHours.days.includes(day.id);
              return (
                <button
                  key={day.id}
                  onClick={() => toggleDay(day.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                    isActive 
                      ? 'bg-[#15803d] text-white border-[#15803d]' 
                      : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
