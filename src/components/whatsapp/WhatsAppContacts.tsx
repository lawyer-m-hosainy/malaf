import React, { useState } from "react";
import { Users, Search, Plus, MessageCircle, Edit2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const initialContacts = [
  {
    id: 1,
    name: 'محمد أحمد علي',
    phone: '01012345678',
    type: 'client',
    cases: 3,
    lastContact: 'منذ ساعتين',
    status: 'active'
  },
  {
    id: 2,
    name: 'المحامي / خالد إبراهيم',
    phone: '01098765432',
    type: 'lawyer',
    cases: 12,
    lastContact: 'منذ 30 دقيقة',
    status: 'active'
  },
  {
    id: 3,
    name: 'سارة محمود حسن',
    phone: '01156789012',
    type: 'client',
    cases: 1,
    lastContact: 'أمس',
    status: 'active'
  },
  {
    id: 4,
    name: 'أحمد عبد الرحمن',
    phone: '01234567890',
    type: 'client',
    cases: 2,
    lastContact: 'منذ 3 أيام',
    status: 'inactive'
  },
  {
    id: 5,
    name: 'موظف الاستقبال / نور',
    phone: '01187654321',
    type: 'staff',
    cases: 0,
    lastContact: 'منذ ساعة',
    status: 'active'
  }
];

export default function WhatsAppContacts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const filteredContacts = initialContacts.filter(contact => {
    const matchesSearch = contact.name.includes(searchTerm) || contact.phone.includes(searchTerm);
    const matchesType = filterType === "all" || contact.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeBadge = (type: string) => {
    switch(type) {
      case 'client':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border-none font-normal">موكل</Badge>;
      case 'lawyer':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 border-none font-normal">محامي</Badge>;
      case 'staff':
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 border-none font-normal">موظف</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs text-slate-600 dark:text-slate-400">نشط</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5">
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-300 dark:bg-slate-600"></span>
        <span className="text-xs text-slate-500">غير نشط</span>
      </div>
    );
  };

  return (
    <Card className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-600" />
          <CardTitle className="text-lg font-bold text-gray-800">جهات الاتصال المسجّلة</CardTitle>
        </div>
        <CardDescription className="text-sm text-gray-500">
          الموكلين والمحامين المربوطين بالبوت
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="ابحث بالاسم أو الرقم..." 
                className="pr-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-40" dir="rtl">
              <Select value={filterType} onValueChange={(val) => val && setFilterType(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="كل الأنواع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="client">موكل</SelectItem>
                  <SelectItem value="lawyer">محامي</SelectItem>
                  <SelectItem value="staff">موظف</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="bg-[#15803d] hover:bg-[#166534] text-white gap-2">
            <Plus className="w-4 h-4" />
            إضافة جهة اتصال
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-800">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">الاسم</th>
                <th className="py-3 px-4 font-semibold">الرقم</th>
                <th className="py-3 px-4 font-semibold">النوع</th>
                <th className="py-3 px-4 font-semibold">القضايا</th>
                <th className="py-3 px-4 font-semibold">آخر تواصل</th>
                <th className="py-3 px-4 font-semibold">الحالة</th>
                <th className="py-3 px-4 font-semibold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.length > 0 ? (
                filteredContacts.map((contact, idx) => (
                  <tr 
                    key={contact.id} 
                    className={`border-b border-gray-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${idx === filteredContacts.length - 1 ? 'border-none' : ''}`}
                  >
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{contact.name}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400" dir="ltr">{contact.phone}</td>
                    <td className="py-3 px-4">{getTypeBadge(contact.type)}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{contact.cases}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{contact.lastContact}</td>
                    <td className="py-3 px-4">{getStatusBadge(contact.status)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    لا توجد جهات اتصال مطابقة للبحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </CardContent>
    </Card>
  );
}
