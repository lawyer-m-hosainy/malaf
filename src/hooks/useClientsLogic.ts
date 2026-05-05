import React, { useState, useMemo, useCallback } from "react";
import { useClientsStore } from "@/store/useClientsStore";
import { clientSchema } from "@/lib/schemas";
import { ZodError } from "zod";
import { toast } from "sonner";
import { useEffect } from "react";
import { fetchClients } from "@/services/legalDataService";


export function useClientsLogic() {
  const clients = useClientsStore(state => state.clients);
  const addClient = useClientsStore(state => state.addClient);
  const updateClient = useClientsStore(state => state.updateClient);
  const deleteClient = useClientsStore(state => state.deleteClient);
  const hasLoaded = useClientsStore(state => state.hasLoaded);
  const setClients = useClientsStore(state => state.setClients);

  useEffect(() => {
    if (!hasLoaded) {
      fetchClients().then(data => {
        if (data) setClients(data);
      });
    }
  }, [hasLoaded, setClients]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"الكل" | "فرد" | "منشأة">("الكل");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

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

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      clientSchema.parse(formData);
      
      if (editingClientId) {
        updateClient(editingClientId, formData);
        toast.success("تم تحديث بيانات العميل بنجاح");
      } else {
        const newClient = {
          id: `C-${Date.now()}`,
          ...formData,
        };
        addClient(newClient as any);
        toast.success("تم إضافة العميل بنجاح");
      }
      
      setIsOpen(false);
      resetForm();
    } catch (error) {
      if (error instanceof ZodError) {
        toast.error((error as any).errors?.[0]?.message || "خطأ في التحقق");
      } else {
        toast.error("حدث خطأ غير متوقع");
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
