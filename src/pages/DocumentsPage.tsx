import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Upload, Clock, CheckCircle, Trash2, Download, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDocuments, useUploadDocument, useDeleteDocument, type Document } from "@/hooks/useDocuments";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const stagger = {
  container: { transition: { staggerChildren: 0.06 } },
  item: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  },
};

const DOC_TYPES = [
  { value: "pension_statement", label: "Pension Statement" },
  { value: "broker_statement", label: "Broker Statement" },
  { value: "payslip", label: "Payslip" },
  { value: "mortgage", label: "Mortgage" },
  { value: "other", label: "Other" },
];

function formatType(t: string) {
  return t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export default function DocumentsPage() {
  const { data: documents = [], isLoading } = useDocuments();
  const upload = useUploadDocument();
  const deleteMut = useDeleteDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState("other");
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);

  const pending = documents.filter(d => d.status === "pending");
  const approved = documents.filter(d => d.status === "approved");

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      upload.mutate({ file, documentType: docType });
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleDownload = async (doc: Document) => {
    if (!doc.file_url) return;
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.file_url, 60);
    if (error || !data?.signedUrl) {
      toast.error("Could not generate download link");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const renderDocRow = (doc: Document) => (
    <div
      key={doc.id}
      className="flex items-center justify-between px-5 py-3.5 hover:bg-secondary/30 transition-colors group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-card-foreground truncate">{doc.file_name}</p>
          <p className="text-[11px] text-muted-foreground">
            {formatType(doc.document_type)} · {new Date(doc.uploaded_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide mr-2 ${
            doc.status === "pending"
              ? "text-warning bg-warning/10"
              : doc.status === "approved"
              ? "text-success bg-success/10"
              : "text-destructive bg-destructive/10"
          }`}
        >
          {doc.status}
        </span>
        {doc.file_url && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => handleDownload(doc)}
            title="Download"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
          onClick={() => setDeleteTarget(doc)}
          title="Remove"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  return (
    <motion.div className="space-y-5" variants={stagger.container} initial="initial" animate="animate">
      <motion.div variants={stagger.item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Documents</h1>
          <p className="label-subtle mt-1">Upload and classify financial documents</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={docType} onValueChange={setDocType}>
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOC_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={upload.isPending}>
            {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.csv"
          multiple
          onChange={e => handleFiles(e.target.files)}
        />
      </motion.div>

      <motion.div
        variants={stagger.item}
        className="rounded-xl border-2 border-dashed border-border bg-card/30 p-10 text-center hover:border-primary/30 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
      >
        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium text-card-foreground">Drop files here or click to upload</p>
        <p className="text-[11px] text-muted-foreground mt-1">PDF, CSV — pension statements, payslips, broker reports</p>
      </motion.div>

      {isLoading && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && documents.length === 0 && (
        <motion.div variants={stagger.item} className="card-surface p-10 text-center">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-card-foreground">No documents yet</p>
          <p className="text-[11px] text-muted-foreground mt-1">Upload your first document to get started</p>
        </motion.div>
      )}

      {pending.length > 0 && (
        <motion.div variants={stagger.item}>
          <div className="flex items-center gap-2 mb-2.5">
            <Clock className="h-4 w-4 text-warning" />
            <p className="label-muted text-warning">Pending Review ({pending.length})</p>
          </div>
          <div className="card-surface divide-y divide-border overflow-hidden">
            {pending.map(renderDocRow)}
          </div>
        </motion.div>
      )}

      {approved.length > 0 && (
        <motion.div variants={stagger.item}>
          <div className="flex items-center gap-2 mb-2.5">
            <CheckCircle className="h-4 w-4 text-success" />
            <p className="label-muted">Approved ({approved.length})</p>
          </div>
          <div className="card-surface divide-y divide-border overflow-hidden">
            {approved.map(renderDocRow)}
          </div>
        </motion.div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.file_name}</strong> and its stored file. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) deleteMut.mutate(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
