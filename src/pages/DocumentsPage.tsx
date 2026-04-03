import { motion } from "framer-motion";
import { FileText, Upload, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockDocs = [
  { id: "1", name: "Aviva_Annual_Statement_2025.pdf", type: "pension_statement", status: "approved", date: "2026-03-15" },
  { id: "2", name: "Vanguard_ISA_Mar2026.csv", type: "broker_statement", status: "approved", date: "2026-03-30" },
  { id: "3", name: "Payslip_March_2026.pdf", type: "payslip", status: "pending", date: "2026-04-01" },
  { id: "4", name: "Nationwide_Mortgage_Statement.pdf", type: "mortgage", status: "pending", date: "2026-03-20" },
];

const stagger = {
  container: { transition: { staggerChildren: 0.06 } },
  item: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  },
};

export default function DocumentsPage() {
  const pending = mockDocs.filter(d => d.status === "pending");
  const approved = mockDocs.filter(d => d.status === "approved");

  return (
    <motion.div className="space-y-5" variants={stagger.container} initial="initial" animate="animate">
      <motion.div variants={stagger.item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Documents</h1>
          <p className="label-subtle mt-1">Upload and classify financial documents</p>
        </div>
        <Button size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </motion.div>

      <motion.div
        variants={stagger.item}
        className="rounded-xl border-2 border-dashed border-border bg-card/30 p-10 text-center hover:border-primary/30 transition-colors cursor-pointer"
      >
        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium text-card-foreground">Drop files here or click to upload</p>
        <p className="text-[11px] text-muted-foreground mt-1">PDF, CSV — pension statements, payslips, broker reports</p>
      </motion.div>

      {pending.length > 0 && (
        <motion.div variants={stagger.item}>
          <div className="flex items-center gap-2 mb-2.5">
            <Clock className="h-4 w-4 text-warning" />
            <p className="label-muted text-warning">Pending Review ({pending.length})</p>
          </div>
          <div className="card-surface divide-y divide-border overflow-hidden">
            {pending.map(doc => (
              <div key={doc.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-secondary/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{doc.name}</p>
                    <p className="text-[11px] text-muted-foreground">{doc.type.replace("_", " ")} · {doc.date}</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-warning bg-warning/10 px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div variants={stagger.item}>
        <div className="flex items-center gap-2 mb-2.5">
          <CheckCircle className="h-4 w-4 text-success" />
          <p className="label-muted">Approved ({approved.length})</p>
        </div>
        <div className="card-surface divide-y divide-border overflow-hidden">
          {approved.map(doc => (
            <div key={doc.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-secondary/30 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-card-foreground">{doc.name}</p>
                  <p className="text-[11px] text-muted-foreground">{doc.type.replace("_", " ")} · {doc.date}</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full uppercase tracking-wide">
                Approved
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
