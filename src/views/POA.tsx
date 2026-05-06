import React, { useState } from "react";
import { useClientsStore } from "@/store/useClientsStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, FileSignature, AlertCircle, Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function POA() {
  const clients = useClientsStore(state => state.clients);
  const [searchTerm, setSearchTerm] = useState("");

  // Extract all POAs from clients
  const allPOAs = clients.flatMap(c => {
    // We mock the POAs for now based on the client list, 
    // since the original system merged them into the client record
    return [
      {
        id: `POA-${c.id}-1`,
        clientId: c.id,
        clientName: c.name,
        poaNumber: `100${c.id.replace(/\D/g, '').substring(0, 3)}`,
        poaLetter: "ب",
        poaYear: "2023",
        notaryOffice: "توثيق " + (c.governorate || "القاهرة"),
        type: "قضايا",
        status: Math.random() > 0.8 ? "منتهي" : "ساري",
        expiryDate: "2028-12-31"
      }
    ];
  });

  const filteredPOAs = allPOAs.filter(poa => 
    poa.clientName.includes(searchTerm) || 
    poa.poaNumber.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <FileSignature className="h-8 w-8 text-primary-600" />
            إدارة التوكيلات
          </h1>
          <p className="text-slate-500 mt-2">سجل التوكيلات الخاص بالمكتب (عام، قضايا، خاص)</p>
        </div>
        <Button className="bg-primary-600 hover:bg-primary-700 text-white gap-2">
          <Plus size={16} />
          إضافة توكيل جديد
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-3 text-slate-400" size={18} />
          <Input 
            placeholder="بحث برقم التوكيل أو اسم الموكل..." 
            className="pr-10 dark:bg-navy-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPOAs.length > 0 ? (
          filteredPOAs.map(poa => (
            <Card key={poa.id} className="dark:bg-navy-800 border-none shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b dark:border-white/5">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="outline" className="mb-2 bg-slate-50 dark:bg-white/5">
                      {poa.type}
                    </Badge>
                    <CardTitle className="text-lg text-primary-700 dark:text-primary-400">
                      رقم {poa.poaNumber} حرف {poa.poaLetter} لسنة {poa.poaYear}
                    </CardTitle>
                  </div>
                  <Badge variant={poa.status === 'ساري' ? 'default' : 'destructive'} 
                    className={poa.status === 'ساري' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                    {poa.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">اسم الموكل:</span>
                  <span className="font-bold">{poa.clientName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">مكتب التوثيق:</span>
                  <span>{poa.notaryOffice}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">تاريخ الانتهاء:</span>
                  <span>{poa.expiryDate}</span>
                </div>
                
                {poa.status === 'منتهي' && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md flex items-start gap-2 text-xs">
                    <AlertCircle size={16} />
                    <span>هذا التوكيل منتهي الصلاحية أو تم إلغاؤه، يرجى مراجعة الموكل لتجديده.</span>
                  </div>
                )}

                <div className="pt-4 mt-2 border-t dark:border-white/5">
                  <Button variant="ghost" className="w-full text-primary-600 dark:text-primary-400 gap-2">
                    <Eye size={16} />
                    عرض التفاصيل
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 flex flex-col items-center justify-center bg-white dark:bg-navy-800 rounded-xl border-2 border-dashed border-slate-100 dark:border-white/5">
            <FileSignature className="h-16 w-16 text-slate-200 dark:text-white/10 mb-4" />
            <p className="text-slate-500 dark:text-slate-400">لا توجد توكيلات تطابق بحثك</p>
          </div>
        )}
      </div>
    </div>
  );
}
