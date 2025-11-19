import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, RefreshCw, Clock, File, Download } from "lucide-react";
import { toast } from "sonner";

interface Submission {
  id: string;
  submission_text: string;
  file_urls: string[];
  file_names: string[];
  status: string;
  admin_feedback: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewer_name: string | null;
}

interface ViewSubmissionFeedbackProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  onRefresh?: () => void;
}

const ViewSubmissionFeedback = ({ isOpen, onClose, taskId, taskTitle, onRefresh }: ViewSubmissionFeedbackProps) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && taskId) {
      fetchSubmissions();
    }
  }, [isOpen, taskId]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3000/api/tasks/${taskId}/submissions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setSubmissions(result.data || []);
      } else {
        toast.error(result.error || "Failed to load submissions");
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case "revision-requested":
        return <Badge className="bg-yellow-500"><RefreshCw className="w-3 h-3 mr-1" />Revision Requested</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
    }
  };

  const downloadFile = (fileUrl: string, fileName: string) => {
    window.open(`http://localhost:3000${fileUrl}`, "_blank");
  };

  const latestSubmission = submissions.length > 0 ? submissions[0] : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submission Details & Feedback</DialogTitle>
          <DialogDescription>
            View your submission and admin feedback for task: <strong>{taskTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-muted-foreground">Loading submission details...</p>
          </div>
        ) : !latestSubmission ? (
          <div className="text-center py-8">
            <File className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No submission found for this task.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Latest Submission */}
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Your Submission</h3>
                    {getStatusBadge(latestSubmission.status)}
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Submitted: {new Date(latestSubmission.submitted_at).toLocaleString()}
                    </p>
                    {latestSubmission.reviewed_at && (
                      <p className="text-sm text-muted-foreground">
                        Reviewed: {new Date(latestSubmission.reviewed_at).toLocaleString()}
                        {latestSubmission.reviewer_name && ` by ${latestSubmission.reviewer_name}`}
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Description:</h4>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm whitespace-pre-wrap">{latestSubmission.submission_text}</p>
                    </div>
                  </div>

                  {latestSubmission.file_urls && latestSubmission.file_urls.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Attached Files:</h4>
                      <div className="space-y-2">
                        {latestSubmission.file_urls.map((url, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-muted rounded-md"
                          >
                            <div className="flex items-center gap-2">
                              <File className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{latestSubmission.file_names[index] || `File ${index + 1}`}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadFile(url, latestSubmission.file_names[index] || `file-${index + 1}`)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {latestSubmission.admin_feedback && (
                    <div>
                      <h4 className="font-semibold mb-2">Admin Feedback:</h4>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm whitespace-pre-wrap">{latestSubmission.admin_feedback}</p>
                      </div>
                    </div>
                  )}

                  {latestSubmission.status === 'pending' && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        ⏳ Your submission is pending review. You will be notified once the admin reviews it.
                      </p>
                    </div>
                  )}

                  {latestSubmission.status === 'revision-requested' && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                      <p className="text-sm text-orange-800">
                        🔄 Revision requested. Please review the feedback and submit an updated version.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submission History */}
            {submissions.length > 1 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Submission History</h3>
                <div className="space-y-3">
                  {submissions.slice(1).map((submission) => (
                    <Card key={submission.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">
                            {new Date(submission.submitted_at).toLocaleString()}
                          </span>
                          {getStatusBadge(submission.status)}
                        </div>
                        <p className="text-sm line-clamp-2">{submission.submission_text}</p>
                        {submission.admin_feedback && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Feedback: {submission.admin_feedback.substring(0, 100)}...
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => {
            if (onRefresh) {
              onRefresh();
            }
            onClose();
          }}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewSubmissionFeedback;

