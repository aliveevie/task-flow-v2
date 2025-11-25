import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, RefreshCw, File, Download, Loader2, Eye, X } from "lucide-react";
import { toast } from "sonner";
import { getBaseUrl } from "@/config/api";

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
  const [viewingFile, setViewingFile] = useState<{ url: string; name: string; type: string } | null>(null);

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
      const response = await fetch(`https://api.galaxyitt.com.ng/api/submissions/${submission.id}/review`, {
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

  const normalizeFileUrl = (fileUrl: string): string => {
    let normalizedUrl = fileUrl.trim();
    
    const uploadsMatch = normalizedUrl.match(/\/uploads\/[^\/]+.*$/);
    if (uploadsMatch) {
      normalizedUrl = uploadsMatch[0];
    } else if (!normalizedUrl.startsWith('/uploads')) {
      const filenameMatch = normalizedUrl.match(/([^\/]+\.(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|txt|csv))$/i);
      if (filenameMatch) {
        normalizedUrl = `/uploads/${filenameMatch[1]}`;
      } else {
        normalizedUrl = normalizedUrl.startsWith('/') ? `/uploads${normalizedUrl}` : `/uploads/${normalizedUrl}`;
      }
    }
    
    return normalizedUrl;
  };

  const getFileType = (fileName: string): string => {
    const ext = fileName.toLowerCase().split('.').pop() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (['pdf'].includes(ext)) return 'pdf';
    return 'other';
  };

  const viewFile = async (fileUrl: string, fileName: string) => {
    try {
      const normalizedUrl = normalizeFileUrl(fileUrl);
      const baseUrl = getBaseUrl();
      const fullUrl = `${baseUrl}${normalizedUrl}`;
      const fileType = getFileType(fileName);
      
      setViewingFile({ url: fullUrl, name: fileName, type: fileType });
    } catch (error) {
      toast.error("Failed to load file");
    }
  };

  const downloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const normalizedUrl = normalizeFileUrl(fileUrl);
      const baseUrl = getBaseUrl();
      const fullUrl = `${baseUrl}${normalizedUrl}`;
      
      const token = localStorage.getItem("token");
      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Failed to download file");
    }
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

      {/* File Viewer Modal */}
      {viewingFile && (
        <Dialog open={!!viewingFile} onOpenChange={() => setViewingFile(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{viewingFile.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewingFile(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {viewingFile.type === 'image' ? (
                <div className="flex items-center justify-center bg-muted rounded-lg p-4">
                  <img
                    src={viewingFile.url}
                    alt={viewingFile.name}
                    className="max-w-full max-h-[70vh] object-contain rounded"
                    onError={() => {
                      toast.error("Failed to load image");
                      setViewingFile(null);
                    }}
                  />
                </div>
              ) : viewingFile.type === 'pdf' ? (
                <div className="w-full h-[70vh] border rounded-lg">
                  <iframe
                    src={viewingFile.url}
                    className="w-full h-full rounded-lg"
                    title={viewingFile.name}
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <File className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Preview not available for this file type</p>
                  <Button onClick={() => downloadFile(viewingFile.url.replace(getBaseUrl(), ''), viewingFile.name)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download to View
                  </Button>
                </div>
              )}
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => downloadFile(viewingFile.url.replace(getBaseUrl(), ''), viewingFile.name)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" onClick={() => setViewingFile(null)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};

export default ReviewSubmissionModal;

