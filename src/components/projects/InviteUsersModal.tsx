import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InviteUsersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (emails: string[]) => void;
}

const InviteUsersModal = ({ open, onOpenChange, onSubmit }: InviteUsersModalProps) => {
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState<string[]>([]);

  const handleAddEmail = () => {
    const trimmedInput = emailInput.trim();
    if (!trimmedInput) return;

    // Split by comma and process each email
    const emailList = trimmedInput
      .split(",")
      .map(email => email.trim())
      .filter(email => email.length > 0);

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails = emailList.filter(email => emailRegex.test(email));
    
    // Add only new emails that aren't already in the list
    const newEmails = validEmails.filter(email => !emails.includes(email));
    
    if (newEmails.length > 0) {
      setEmails([...emails, ...newEmails]);
        setEmailInput("");
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter(email => email !== emailToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emails.length > 0) {
      onSubmit(emails);
      setEmails([]);
      setEmailInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEmail();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite Users to Project</DialogTitle>
          <DialogDescription>
            Enter email addresses (comma-separated) to invite users to collaborate on this project.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="user1@example.com, user2@example.com, ..."
              />
              <Button type="button" onClick={handleAddEmail} variant="outline">
                Add
              </Button>
            </div>
          </div>

          {emails.length > 0 && (
            <div className="space-y-2">
              <Label>Users to Invite ({emails.length})</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg max-h-32 overflow-y-auto">
                {emails.map((email) => (
                  <Badge key={email} variant="secondary" className="px-3 py-1">
                    {email}
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={emails.length === 0}>
              Send Invitations
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteUsersModal;
