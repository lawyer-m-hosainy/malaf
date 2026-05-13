import React, { useState, useMemo, useCallback } from "react";
import { useClientsStore } from "@/store/useClientsStore";
import { clientSchema } from "@/lib/schemas";
import { ZodError } from "zod";
import { toast } from "sonner";
import { useEffect } from "react";
import { fetchClients, fetchClientsPaginated, saveClient } from "@/services/legalDataService";


export function useClientsLogic() {
  const clients = useClientsStore(state => state.clients);
  const addClient = useClientsStore(state => state.addClient);
  const updateClient = useClientsStore(state => state.updateClient);
  const deleteClient = useClientsStore(state => state.deleteClient);
  const hasLoaded = useClientsStore(state => state.hasLoaded);
  const setClients = useClientsStore(state => state.setClients);
  const currentPageStore = useClientsStore(state => state.currentPage);
  const setCurrentPageStore = useClientsStore(state => state.setCurrentPage);
  const hasMore = useClientsStore(state => state.hasMore);
  const setHasMore = useClientsStore(state => state.setHasMore);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const loadClients = async () => {
      try {
        const { data, hasMore: more } = await fetchClientsPaginated(itemsPerPage, currentPage - 1);
        if (data) {
          setClients(data);
          setHasMore(more);
        }
      } catch (error) {
        console.error("Failed to fetch paginated clients", error);
      }
    };

    loadClients();
  }, [currentPage, setClients, setHasMore]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"الكل" | "فرد" | "منشأة">("الكل");

  const [isOpen, setIsOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "فرد" as "فرد" | "منشأة",
    nationalId: "",
    commercialRegistration: "",
    vatNumber: "",
    phone: "",
  });

  const filteredClients = useMemo(() => {
    return (clients || []).filter(c => {
      const matchesSearch = c.name?.includes(searchQuery) || 
                            c.nationalId?.includes(searchQuery) || 
                            c.commercialRegistration?.includes(searchQuery);
      const matchesType = filterType === "الكل" || c.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [clients, searchQuery, filterType]);

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / itemsPerPage));
  const currentClients = useMemo(() => {
    return filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredClients, currentPage, itemsPerPage]);

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      type: "فرد",
      nationalId: "",
      commercialRegistration: "",
      vatNumber: "",
      phone: "",
    });
    setEditingClientId(null);
  }, []);

  const handleEditClick = useCallback((client: any) => {
    setEditingClientId(client.id);
    setFormData({
      name: client.name || "",
      type: (client.type as "فرد" | "منشأة") || "فرد",
      nationalId: client.nationalId || "",
      commercialRegistration: client.commercialRegistration || "",
      vatNumber: client.vatNumber || "",
      phone: client.phone || "",
    });
    setIsOpen(true);
  }, []);

  const handleDeleteClick = useCallback((id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا العميل؟")) {
      deleteClient(id);
      toast.success("تم حذف العميل بنجاح");
    }
  }, [deleteClient]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // تنظيف البيانات وتحويل الهاتف للصيغة الدولية
      const cleanPhone = formData.phone.trim().replace(/\s+/g, '');
      const formattedData = {
        ...formData,
        name: formData.name.trim(),
        phone: cleanPhone.startsWith('01') ? `+20${cleanPhone.substring(1)}` : cleanPhone,
        nationalId: formData.nationalId.trim(),
        commercialRegistration: formData.commercialRegistration.trim(),
        vatNumber: formData.vatNumber.trim(),
      };

      // التحقق من البيانات
      const validated = clientSchema.parse(formattedData);
      
      if (editingClientId) {
        await saveClient({ ...validated, id: editingClientId } as any);
        updateClient(editingClientId, validated);
        toast.success("تم تحديث بيانات العميل بنجاح");
      } else {
        const newId = `C-${Date.now()}`;
        const newClient = {
          id: newId,
          ...validated,
        };
        await saveClient(newClient as any);
        addClient(newClient as any);
        toast.success("تم إضافة العميل بنجاح");
      }
      
      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error("Validation/Save Error:", error);
      if (error instanceof ZodError) {
        // إظهار أول خطأ موجود في الـ Schema
        const firstError = error.issues[0];
        toast.error(firstError.message || "خطأ في البيانات المدخلة");
      } else {
        toast.error("حدث خطأ أثناء حفظ البيانات، يرجى المحاولة مرة أخرى");
      }
    }
  }, [formData, editingClientId, updateClient, addClient, resetForm]);

  const openNewClientDialog = useCallback(() => {
    resetForm();
    setIsOpen(true);
  }, [resetForm]);

  return {
    // State
    clients,
    filteredClients,
    currentClients,
    searchQuery,
    filterType,
    currentPage,
    totalPages,
    isOpen,
    editingClientId,
    formData,
    // Setters
    setSearchQuery,
    setFilterType,
    setCurrentPage,
    setIsOpen,
    setFormData,
    // Actions
    handleEditClick,
    handleDeleteClick,
    handleSubmit,
    openNewClientDialog,
  };
}
