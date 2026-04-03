import { motion } from "framer-motion";
import { FileText, Upload, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockDocs = [
  { id: "1", name: "Aviva_Annual_Statement_2025.pdf", type: "pension_statement", status: "approved", date: "2026-03-15" },
  { id: "2", name: "Vanguard_ISA_Mar2026.csv", type: "broker_statement", status: "approved", date: "2026-03-30" },
  { id: "3", name: "Payslip_March_2026.pdf", type: "payslip", status: "pending", date: "2026-04-01" },
  { id: "4", name: "Nationwide_Mortgage_Statement.pdf", type: "mortgage", status: "pending", date: "2026-03-20" },
];

const statusStyles = {
  pending: "bg-warning/10 text-warning",
  approved: "bg-success/10 text-success",
};

export default function DocumentsPage() {
  const pending = mockDocs.filter(d => d.status === "pending");
  const approved = mockDocs.filter(d => d.status === "approved");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload and classify financial documents</p>
        </div>
        <Button size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border-2 border-dashed border-border bg-card/50 p-10 text-center"
      >
        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium text-card-foreground">Drop files here or click to upload</p>
        <p className="text-xs text-muted-foreground mt-1">PDF, CSV — pension statements, payslips, broker reports</p>
      </motion.div>

      {pending.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-warning" />
            <h2 className="text-sm font-semibold text-foreground">Pending Review ({pending.length})</h2>
          </div>
          <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
            {pending.map(doc => (
              <div key={doc.id} className="flex items-center justify-between px-5 py-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.type.replace("_", " ")} · {doc.date}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyles.pending}`}>
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="h-4 w-4 text-success" />
          <h2 className="text-sm font-semibold text-foreground">Approved ({approved.length})</h2>
        </div>
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {approved.map(doc => (
            <div key={doc.id} className="flex items-center justify-between px-5 py-4 hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-card-foreground">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{doc.type.replace("_", " ")} · {doc.date}</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyles.approved}`}>
                Approved
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
