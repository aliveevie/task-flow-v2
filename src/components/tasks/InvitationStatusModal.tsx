import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock, Mail, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Invitation {
  id: string;
  invitee_email: string;
  invitee_name?: string;
  status: string;
  created_at: string;
  accepted_at?: string;
  expires_at: string;
  project_title: string;
}

interface InvitationStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onRefresh?: () => void;
}

const InvitationStatusModal = ({ isOpen, onClose, projectId, onRefresh }: InvitationStatusModalProps) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && projectId) {
      fetchInvitations();
    }
  }, [isOpen, projectId]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`http://10.1.1.205:3000/api/projects/${projectId}/invitations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setInvitations(result.data || []);
      } else {
        toast.error(result.error || "Failed to load invitations");
      }
    } catch (error) {
      console.error("Error fetching invitations:", error);
      toast.error("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvitation = async (invitationId: string, email: string) => {
    try {
      setResending(invitationId);
      const token = localStorage.getItem("token");
      const response = await fetch(`http://10.1.1.205:3000/api/invitations/${invitationId}/resend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Invitation resent to ${email}`);
        fetchInvitations();
        if (onRefresh) {
          onRefresh();
        }
      } else {
        toast.error(result.error || "Failed to resend invitation");
      }
    } catch (error) {
      console.error("Error resending invitation:", error);
      toast.error("Failed to resend invitation");
    } finally {
      setResending(null);
    }
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date() > new Date(expiresAt);
    
    if (isExpired && status === 'pending') {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>;
    }
    
    switch (status) {
      case "accepted":
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Accepted</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingInvitations = invitations.filter(i => i.status === 'pending');
  const acceptedInvitations = invitations.filter(i => i.status === 'accepted');
  const otherInvitations = invitations.filter(i => i.status !== 'pending' && i.status !== 'accepted');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invitation Status</DialogTitle>
          <DialogDescription>
            View and manage invitations for this project
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-muted-foreground">Loading invitations...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No invitations found for this project.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending Invitations */}
            {pendingInvitations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  Pending Invitations ({pendingInvitations.length})
                </h3>
                <div className="space-y-3">
                  {pendingInvitations.map((invitation) => {
                    const isExpired = new Date() > new Date(invitation.expires_at);
                    return (
                      <Card key={invitation.id} className={isExpired ? "border-red-200 bg-red-50/50" : "border-yellow-200 bg-yellow-50/50"}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold">{invitation.invitee_name || invitation.invitee_email}</span>
                                {getStatusBadge(invitation.status, invitation.expires_at)}
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">
                                Email: {invitation.invitee_email}
                              </p>
                              <p className="text-sm text-muted-foreground mb-1">
                                Sent: {new Date(invitation.created_at).toLocaleString()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Expires: {new Date(invitation.expires_at).toLocaleString()}
                              </p>
                              {isExpired && (
                                <p className="text-xs text-red-600 mt-2">
                                  ⚠️ This invitation has expired
                                </p>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResendInvitation(invitation.id, invitation.invitee_email)}
                              disabled={resending === invitation.id}
                            >
                              {resending === invitation.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Resend
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Accepted Invitations */}
            {acceptedInvitations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Accepted Invitations ({acceptedInvitations.length})
                </h3>
                <div className="space-y-3">
                  {acceptedInvitations.map((invitation) => (
                    <Card key={invitation.id} className="border-green-200 bg-green-50/50">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">{invitation.invitee_name || invitation.invitee_email}</span>
                              {getStatusBadge(invitation.status, invitation.expires_at)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              Email: {invitation.invitee_email}
                            </p>
                            <p className="text-sm text-muted-foreground mb-1">
                              Accepted: {invitation.accepted_at ? new Date(invitation.accepted_at).toLocaleString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Other Status Invitations */}
            {otherInvitations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Other Invitations ({otherInvitations.length})</h3>
                <div className="space-y-3">
                  {otherInvitations.map((invitation) => (
                    <Card key={invitation.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">{invitation.invitee_name || invitation.invitee_email}</span>
                              {getStatusBadge(invitation.status, invitation.expires_at)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Email: {invitation.invitee_email}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvitationStatusModal;

