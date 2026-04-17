import { useState } from "react";
import { Copy, Mail, Link as LinkIcon, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateInvitation, buildInviteUrl, type HouseholdInvitation } from "@/hooks/useHouseholdInvitations";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InviteMemberDialog({ open, onOpenChange }: Props) {
  const createInvite = useCreateInvitation();
  const [email, setEmail] = useState("");
  const [generatedInvite, setGeneratedInvite] = useState<HouseholdInvitation | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (withEmail: boolean) => {
    try {
      const inv = await createInvite.mutateAsync({ email: withEmail ? email.trim() : null });
      setGeneratedInvite(inv);
      if (withEmail) {
        // Copy link automatically since email send isn't wired yet
        await copyLink(inv.token);
        toast.success("Invitation created. Share the link with them.");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to create invitation");
    }
  };

  const copyLink = async (token: string) => {
    const url = buildInviteUrl(token);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Invite link copied");
  };

  const reset = () => {
    setEmail("");
    setGeneratedInvite(null);
    setCopied(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>Invite household member</DialogTitle>
          <DialogDescription>
            Invite another adult to share full access to your household — accounts, pensions, tax and plans. Invites expire after 7 days.
          </DialogDescription>
        </DialogHeader>

        {generatedInvite ? (
          <div className="space-y-3 mt-2">
            <Label>Share this link</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={buildInviteUrl(generatedInvite.token)}
                className="font-mono text-xs"
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyLink(generatedInvite.token)}
                className="gap-1.5 shrink-0"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Send this link via WhatsApp, iMessage, or any channel. They'll be guided through signup and joined automatically.
            </p>
            <Button variant="outline" className="w-full" onClick={reset}>
              Create another invite
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="link" className="mt-2">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="link" className="gap-1.5">
                <LinkIcon className="h-3.5 w-3.5" /> Shareable link
              </TabsTrigger>
              <TabsTrigger value="email" className="gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Email
              </TabsTrigger>
            </TabsList>

            <TabsContent value="link" className="space-y-3 mt-4">
              <p className="text-sm text-muted-foreground">
                Generate a one-time invite link to share manually.
              </p>
              <Button
                className="w-full"
                disabled={createInvite.isPending}
                onClick={() => handleGenerate(false)}
              >
                {createInvite.isPending ? "Generating…" : "Generate invite link"}
              </Button>
            </TabsContent>

            <TabsContent value="email" className="space-y-3 mt-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="partner@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  We'll generate a link tied to this email and copy it to your clipboard so you can send it.
                </p>
              </div>
              <Button
                className="w-full"
                disabled={createInvite.isPending || !email.trim()}
                onClick={() => handleGenerate(true)}
              >
                {createInvite.isPending ? "Creating…" : "Create invitation"}
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
