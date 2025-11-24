import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, FileCheck, Clock, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import ReviewSubmissionModal from "./ReviewSubmissionModal";
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
  task_id: string;
}

interface TaskSubmissionsViewProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  onReviewSuccess: () => void;
}

const TaskSubmissionsView = ({ isOpen, onClose, taskId, taskTitle, onReviewSuccess }: TaskSubmissionsViewProps) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && taskId) {
      fetchSubmissions();
    }
  }, [isOpen, taskId]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`https://api.galaxyitt.com.ng/api/tasks/${taskId}/submissions`, {
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
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const handleReview = (submission: Submission) => {
    setSelectedSubmission(submission);
    setIsReviewModalOpen(true);
  };

  const handleReviewSuccess = () => {
    fetchSubmissions();
    onReviewSuccess();
  };

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const reviewedSubmissions = submissions.filter(s => s.status !== 'pending');

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Task Submissions</DialogTitle>
            <DialogDescription>
              View and review all submissions for task: <strong>{taskTitle}</strong>
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-muted-foreground">Loading submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8">
              <FileCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No submissions yet for this task.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingSubmissions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    Pending Review ({pendingSubmissions.length})
                  </h3>
                  <div className="space-y-3">
                    {pendingSubmissions.map((submission) => (
                      <Card key={submission.id} className="border-yellow-200 bg-yellow-50/50">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold">{submission.user_name}</span>
                                {getStatusBadge(submission.status)}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Submitted: {new Date(submission.submitted_at).toLocaleString()}
                              </p>
                              <p className="text-sm line-clamp-2">{submission.submission_text}</p>
                              {submission.file_urls && submission.file_urls.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  {submission.file_urls.length} file(s) attached
                                </p>
                              )}
                            </div>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleReview(submission)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Review
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {reviewedSubmissions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Reviewed Submissions</h3>
                  <div className="space-y-3">
                    {reviewedSubmissions.map((submission) => (
                      <Card key={submission.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold">{submission.user_name}</span>
                                {getStatusBadge(submission.status)}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Submitted: {new Date(submission.submitted_at).toLocaleString()}
                                {submission.reviewed_at && (
                                  <> • Reviewed: {new Date(submission.reviewed_at).toLocaleString()}</>
                                )}
                                {submission.reviewer_name && (
                                  <> by {submission.reviewer_name}</>
                                )}
                              </p>
                              <p className="text-sm line-clamp-2">{submission.submission_text}</p>
                              {submission.admin_feedback && (
                                <div className="mt-2 p-2 bg-muted rounded text-sm">
                                  <strong>Feedback:</strong> {submission.admin_feedback}
                                </div>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReview(submission)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
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

      {selectedSubmission && (
        <ReviewSubmissionModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedSubmission(null);
          }}
          submission={selectedSubmission}
          onSuccess={handleReviewSuccess}
        />
      )}
    </>
  );
};

export default TaskSubmissionsView;

