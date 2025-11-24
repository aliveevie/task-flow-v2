import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, X, File, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  onSuccess: () => void;
}

const SubmissionModal = ({ isOpen, onClose, taskId, taskTitle, onSuccess }: SubmissionModalProps) => {
  const [submissionText, setSubmissionText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSubmissionText("");
      setFiles([]);
    }
  }, [isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      
      // Check file sizes (1MB limit)
      const oversizedFiles = selectedFiles.filter(file => file.size > 1024 * 1024);
      if (oversizedFiles.length > 0) {
        toast.error("Some files exceed 1MB limit. Please select smaller files.");
        return;
      }

      // Limit to 5 files
      const newFiles = [...files, ...selectedFiles].slice(0, 5);
      setFiles(newFiles);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleSubmit = async () => {
    if (!submissionText.trim()) {
      toast.error("Please provide a description of your work");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("submission_text", submissionText);
      
      files.forEach((file) => {
        formData.append("files", file);
      });

      const token = localStorage.getItem("token");
      const response = await fetch(`https://api.galaxyitt.com.ng/api/tasks/${taskId}/submit`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Proof of work submitted successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || "Failed to submit proof of work");
      }
    } catch (error: any) {
      console.error("Error submitting work:", error);
      toast.error("Failed to submit proof of work");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Proof of Work</DialogTitle>
          <DialogDescription>
            Submit your completed work for task: <strong>{taskTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="submission-text">Description of Work *</Label>
            <Textarea
              id="submission-text"
              placeholder="Describe what you've completed, include any important details, screenshots, or notes..."
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              rows={6}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="files">Attach Files (Optional, max 1MB each, up to 5 files)</Label>
            <div className="mt-2">
              <input
                type="file"
                id="files"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
              />
              <label htmlFor="files">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full cursor-pointer"
                  asChild
                >
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Files
                  </span>
                </Button>
              </label>
            </div>

            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded-md"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        ({formatFileSize(file.size)})
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Work"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubmissionModal;

