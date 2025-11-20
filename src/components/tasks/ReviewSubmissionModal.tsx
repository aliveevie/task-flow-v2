import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, RefreshCw, File, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Submission {
  id: string;
  submission_text: string;
  file_urls: string[];
  file_names: string[];
  status: string;
  admin_feedback: string | null;
  user_name: string;
  submitted_at: string;
  reviewed_at: string | null;
  reviewer_name: string | null;
}

interface ReviewSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission | null;
  onSuccess: () => void;
}

const ReviewSubmissionModal = ({ isOpen, onClose, submission, onSuccess }: ReviewSubmissionModalProps) => {
  const [status, setStatus] = useState<"approved" | "rejected" | "revision-requested">("approved");
  const [feedback, setFeedback] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    if (submission) {
      setFeedback(submission.admin_feedback || "");
      if (submission.status === "approved") {
        setStatus("approved");
      } else if (submission.status === "rejected") {
        setStatus("rejected");
      } else {
        setStatus("revision-requested");
      }
    }
  }, [submission]);

  const handleReview = async () => {
    if (!submission) return;

    setIsReviewing(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://10.1.1.205:3000/api/submissions/${submission.id}/review`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status,
          admin_feedback: feedback.trim() || null
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Submission ${status} successfully!`);
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || "Failed to review submission");
      }
    } catch (error: any) {
      console.error("Error reviewing submission:", error);
      toast.error("Failed to review submission");
    } finally {
      setIsReviewing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "revision-requested":
        return <Badge className="bg-yellow-500">Revision Requested</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const downloadFile = (fileUrl: string, fileName: string) => {
    window.open(`http://10.1.1.205:3000${fileUrl}`, "_blank");
  };

  if (!submission) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Submission</DialogTitle>
          <DialogDescription>
            Review proof of work submitted by <strong>{submission.user_name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Submission Details */}
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <div className="mt-1">{getStatusBadge(submission.status)}</div>
            </div>

            <div>
              <Label>Submitted At</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(submission.submitted_at).toLocaleString()}
              </p>
            </div>

            {submission.reviewed_at && (
              <div>
                <Label>Reviewed By</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {submission.reviewer_name || "Admin"} on {new Date(submission.reviewed_at).toLocaleString()}
                </p>
              </div>
            )}

            <div>
              <Label>Description of Work</Label>
              <div className="mt-1 p-3 bg-muted rounded-md">
                <p className="text-sm whitespace-pre-wrap">{submission.submission_text}</p>
              </div>
            </div>

            {submission.file_urls && submission.file_urls.length > 0 && (
              <div>
                <Label>Attached Files</Label>
                <div className="mt-2 space-y-2">
                  {submission.file_urls.map((url, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <File className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{submission.file_names[index] || `File ${index + 1}`}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadFile(url, submission.file_names[index] || `file-${index + 1}`)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {submission.admin_feedback && (
              <div>
                <Label>Previous Feedback</Label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{submission.admin_feedback}</p>
                </div>
              </div>
            )}
          </div>

          {/* Review Form */}
          <div className="space-y-4 border-t pt-4">
            <div>
              <Label>Review Decision *</Label>
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  variant={status === "approved" ? "default" : "outline"}
                  onClick={() => setStatus("approved")}
                  className="flex-1"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  type="button"
                  variant={status === "revision-requested" ? "default" : "outline"}
                  onClick={() => setStatus("revision-requested")}
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Request Revision
                </Button>
                <Button
                  type="button"
                  variant={status === "rejected" ? "destructive" : "outline"}
                  onClick={() => setStatus("rejected")}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="feedback">Feedback (Optional)</Label>
              <Textarea
                id="feedback"
                placeholder="Provide feedback to the user about their submission..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose} disabled={isReviewing}>
                Cancel
              </Button>
              <Button onClick={handleReview} disabled={isReviewing}>
                {isReviewing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Reviewing...
                  </>
                ) : (
                  "Submit Review"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewSubmissionModal;

