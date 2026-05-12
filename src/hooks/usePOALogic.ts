import { useState, useMemo, useCallback } from "react";
import { useClientsStore, PowerOfAttorney, POAType, POAOffice, POAStatus } from "@/store/useClientsStore";
import { poaSchema } from "@/lib/schemas";
import { ZodError } from "zod";
import { toast } from "sonner";

export function usePOALogic() {
  const clients = useClientsStore(state => state.clients);
  const poas = useClientsStore(state => state.poas);
  const addPOA = useClientsStore(state => state.addPOA);
  const updatePOA = useClientsStore(state => state.updatePOA);

  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingPoaId, setEditingPoaId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    clientId: "",
    poaNumber: "",
    poaLetter: "ب",
    poaYear: new Date().getFullYear().toString(),
    office: "الشهر العقاري" as POAOffice,
    type: "قضايا فقط" as POAType,
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: "",
    status: "ساري" as POAStatus,
  });

  const filteredPOAs = useMemo(() => {
    return (poas || []).filter(poa => {
      const client = clients.find(c => c.id === poa.clientId);
      const clientName = client?.name || "";
      return clientName.includes(searchTerm) || poa.poaNumber.includes(searchTerm);
    }).map(poa => ({
      ...poa,
      clientName: clients.find(c => c.id === poa.clientId)?.name || "عميل غير معروف"
    }));
  }, [poas, clients, searchTerm]);

  const resetForm = useCallback(() => {
    setFormData({
      clientId: "",
      poaNumber: "",
      poaLetter: "ب",
      poaYear: new Date().getFullYear().toString(),
      office: "الشهر العقاري",
      type: "قضايا فقط",
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: "",
      status: "ساري",
    });
    setEditingPoaId(null);
  }, []);

  const handleEditClick = useCallback((poa: PowerOfAttorney) => {
    setEditingPoaId(poa.id);
    setFormData({
      clientId: poa.clientId,
      poaNumber: poa.poaNumber,
      poaLetter: poa.poaLetter,
      poaYear: poa.poaYear,
      office: poa.office,
      type: poa.type,
      issueDate: poa.issueDate,
      expiryDate: poa.expiryDate || "",
      status: poa.status,
    });
    setIsOpen(true);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      poaSchema.parse(formData);
      
      if (editingPoaId) {
        updatePOA(editingPoaId, formData);
        toast.success("تم تحديث بيانات التوكيل بنجاح");
      } else {
        const newPOA: PowerOfAttorney = {
          id: `POA-${Date.now()}`,
          cancellationRequested: false,
          ...formData,
        };
        addPOA(newPOA);
        toast.success("تم إضافة التوكيل بنجاح");
      }
      
      setIsOpen(false);
      resetForm();
    } catch (error) {
      if (error instanceof ZodError) {
        toast.error(error.issues[0]?.message || "خطأ في التحقق");
      } else {
        toast.error("حدث خطأ غير متوقع");
      }
    }
  }, [formData, editingPoaId, updatePOA, addPOA, resetForm]);

  const openNewPOADialog = useCallback(() => {
    resetForm();
    setIsOpen(true);
  }, [resetForm]);

  return {
    clients,
    filteredPOAs,
    searchTerm,
    setSearchTerm,
    isOpen,
    setIsOpen,
    formData,
    setFormData,
    editingPoaId,
    handleSubmit,
    handleEditClick,
    openNewPOADialog,
  };
}
