import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Document = Tables<"documents">;
type DocumentType = Database["public"]["Enums"]["document_type"];

export function useDocuments() {
  const { householdId } = useAuth();

  return useQuery({
    queryKey: ["documents", householdId],
    queryFn: async () => {
      if (!householdId) return [];
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("household_id", householdId)
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Document[];
    },
    enabled: !!householdId,
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  const { householdId } = useAuth();

  return useMutation({
    mutationFn: async ({ file, documentType }: { file: File; documentType: string }) => {
      if (!householdId) throw new Error("No household");

      const filePath = `${householdId}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("documents").insert({
        household_id: householdId,
        file_name: file.name,
        file_url: filePath,
        document_type: documentType as DocumentType,
        status: "pending",
      });
      if (dbError) {
        await supabase.storage.from("documents").remove([filePath]);
        throw dbError;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document uploaded");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (doc: Document) => {
      // Delete from storage if file_url exists
      if (doc.file_url) {
        const { error: storageError } = await supabase.storage.from("documents").remove([doc.file_url]);
        if (storageError) throw storageError;
      }
      const { error } = await supabase.from("documents").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
