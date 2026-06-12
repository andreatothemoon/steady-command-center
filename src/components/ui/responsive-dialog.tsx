import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function ResponsiveDialog({ open, onOpenChange, children }: ResponsiveDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {children}
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
}

interface ResponsiveDialogContentProps {
  children: React.ReactNode;
  className?: string;
}

function ResponsiveDialogContent({ children, className }: ResponsiveDialogContentProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <DrawerContent className={cn("rounded-t-[28px] border-border bg-card/98 px-4 pb-6 shadow-[0_-18px_44px_-30px_rgba(0,4,17,0.4)]", className)}>
        <div className="overflow-y-auto max-h-[85vh] py-2">
          {children}
        </div>
      </DrawerContent>
    );
  }

  return (
    <DialogContent className={cn("max-h-[85vh] overflow-y-auto border-border bg-card sm:max-w-lg", className)}>
      {children}
    </DialogContent>
  );
}

function ResponsiveDialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  const isMobile = useIsMobile();
  const Comp = isMobile ? DrawerHeader : DialogHeader;
  return <Comp className={className}>{children}</Comp>;
}

function ResponsiveDialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  const isMobile = useIsMobile();
  const Comp = isMobile ? DrawerTitle : DialogTitle;
  return <Comp className={className}>{children}</Comp>;
}

function ResponsiveDialogDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  const isMobile = useIsMobile();
  const Comp = isMobile ? DrawerDescription : DialogDescription;
  return <Comp className={className}>{children}</Comp>;
}

export {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
};
