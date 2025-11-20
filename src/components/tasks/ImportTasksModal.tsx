import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface ImportTasksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  onSuccess: () => void;
}

interface ParsedTask {
  title: string;
  description?: string;
  assigned_to?: string;
  assigned_by?: string;
  date_assigned?: string;
  due_date?: string;
  priority?: string;
  status?: string;
  comments?: string;
  // User invitation fields
  email: string;
  name: string;
  role?: string;
}

const ImportTasksModal = ({ open, onOpenChange, projectId, onSuccess }: ImportTasksModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedTask[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    invitations: number;
    errors: string[];
  } | null>(null);

  const requiredTaskHeaders = ['title'];
  const optionalTaskHeaders = ['description', 'assigned_to', 'assigned_by', 'date_assigned', 'due_date', 'priority', 'status', 'comments', 'role', 'name', 'email'];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      
      if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
        toast.error("Please select a CSV or Excel file");
        return;
      }
      
      setFile(selectedFile);
      setParsedData([]);
      setValidationErrors([]);
      setImportResults(null);
    }
  };

  const parseFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setValidationErrors([]);
    setParsedData([]);

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let data: any[] = [];

      if (fileExtension === 'csv') {
        const text = await file.text();
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_')
        });
        data = result.data;
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          raw: false
        });
        // Normalize headers
        data = data.map((row: any) => {
          const normalized: any = {};
          Object.keys(row).forEach(key => {
            const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
            normalized[normalizedKey] = row[key];
          });
          return normalized;
        });
      } else if (fileExtension === 'pdf') {
        // PDF parsing requires server-side processing
        // For now, we'll show a message to use CSV or Excel
        toast.warning("PDF parsing is not supported in the browser. Please convert to CSV or Excel format.");
        setValidationErrors(["PDF files are not supported. Please use CSV or Excel format."]);
        setIsProcessing(false);
        return;
      }

      // Validate headers
      if (data.length === 0) {
        setValidationErrors(["File is empty or could not be parsed"]);
        setIsProcessing(false);
        return;
      }

      const headers = Object.keys(data[0]);
      // Only title is required, email/name are optional
      const missingTitle = !headers.includes('title');
      
      if (missingTitle) {
        setValidationErrors([
          `Missing required header: title`,
          `Required: title`,
          `Optional: name, email (for invitations)`,
          `Found headers: ${headers.join(', ')}`
        ]);
        setIsProcessing(false);
        return;
      }

      // Helper function to parse date from various formats
      const parseDate = (dateStr: string): string | null => {
        if (!dateStr) return null;
        
        let str = String(dateStr).trim();
        
        // Skip if it's not a date (contains text like "Continuous", "Quarterly", etc.)
        if (/[a-zA-Z]{3,}/.test(str) && !str.match(/\d{4}/)) {
          return null; // Not a valid date format
        }
        
        // Extract date from ranges like "07/08/2025 – 07/09/2025" (take first date)
        const rangeMatch = str.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
        if (rangeMatch) {
          str = rangeMatch[1];
        }
        
        // Extract date from formats like "Start: 07/08/2025 → Quarterly"
        const startMatch = str.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
        if (startMatch) {
          str = startMatch[1];
        }
        
        // Try to parse the date
        try {
          // Handle DD/MM/YYYY or MM/DD/YYYY
          const parts = str.split(/[\/\-]/);
          if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1; // JS months are 0-indexed
            const year = parseInt(parts[2].length === 2 ? `20${parts[2]}` : parts[2]);
            
            // Check if it's a valid date
            const date = new Date(year, month, day);
            if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
              // Format as YYYY-MM-DD for PostgreSQL
              return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
          }
          
          // Try ISO format or standard Date parsing
          const parsed = new Date(str);
          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split('T')[0];
          }
        } catch (e) {
          // Invalid date, return null
        }
        
        return null;
      };

      // Parse and validate data
      const parsed: ParsedTask[] = [];
      const errors: string[] = [];

      data.forEach((row: any, index: number) => {
        const rowNum = index + 2; // +2 because index is 0-based and we skip header
        
        // Title is required, but email/name are optional (will send invitation if email provided)
        if (!row.title) {
          errors.push(`Row ${rowNum}: Missing required field (title)`);
          return;
        }

        // Validate email format if provided
        let email = null;
        if (row.email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const emailStr = String(row.email).trim().toLowerCase();
          if (emailRegex.test(emailStr)) {
            email = emailStr;
          } else {
            errors.push(`Row ${rowNum}: Invalid email format: ${row.email} (will skip invitation)`);
          }
        }

        // Parse dates
        const dateAssigned = row.date_assigned ? parseDate(String(row.date_assigned)) : null;
        const dueDate = row.due_date ? parseDate(String(row.due_date)) : null;

        parsed.push({
          title: String(row.title).trim(),
          description: row.description ? String(row.description).trim() : undefined,
          assigned_to: row.assigned_to ? String(row.assigned_to).trim() : undefined,
          assigned_by: row.assigned_by ? String(row.assigned_by).trim() : undefined,
          date_assigned: dateAssigned,
          due_date: dueDate,
          priority: row.priority ? String(row.priority).trim().toLowerCase() : 'medium',
          status: row.status ? String(row.status).trim().toLowerCase().replace(/\s+/g, '-') : 'pending',
          comments: row.comments ? String(row.comments).trim() : undefined,
          email: email || '',
          name: row.name ? String(row.name).trim() : row.assigned_to || 'User',
          role: row.role ? String(row.role).trim() : undefined
        });
      });

      if (errors.length > 0) {
        setValidationErrors(errors);
      }

      setParsedData(parsed);
      toast.success(`Parsed ${parsed.length} tasks successfully`);
    } catch (error: any) {
      console.error("Error parsing file:", error);
      toast.error(`Failed to parse file: ${error.message}`);
      setValidationErrors([error.message]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast.error("Please parse the file first");
      return;
    }

    if (!projectId) {
      toast.error("Project ID is required");
      return;
    }

    setIsProcessing(true);
    setImportResults(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://10.1.1.205:3000/api/projects/${projectId}/tasks/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tasks: parsedData
        })
      });

      const result = await response.json();

      if (result.success) {
        setImportResults({
          success: result.data.created || 0,
          failed: result.data.failed || 0,
          invitations: result.data.invitations_sent || 0,
          errors: result.data.errors || []
        });
        toast.success(`Import completed! ${result.data.created} tasks created, ${result.data.invitations_sent} invitations sent`);
        onSuccess();
        setTimeout(() => {
          onOpenChange(false);
          setFile(null);
          setParsedData([]);
          setImportResults(null);
        }, 3000);
      } else {
        toast.error(result.error || "Failed to import tasks");
        setImportResults({
          success: 0,
          failed: parsedData.length,
          invitations: 0,
          errors: [result.error || "Import failed"]
        });
      }
    } catch (error: any) {
      console.error("Error importing tasks:", error);
      toast.error("Failed to import tasks");
      setImportResults({
        success: 0,
        failed: parsedData.length,
        invitations: 0,
        errors: [error.message]
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Tasks from File</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file with task data. Required: title. Optional: name, email (for invitations)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <Label htmlFor="file-upload">Select File (CSV or Excel)</Label>
            <div className="mt-2">
              <input
                type="file"
                id="file-upload"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label htmlFor="file-upload">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full cursor-pointer"
                  asChild
                >
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    {file ? file.name : "Choose File"}
                  </span>
                </Button>
              </label>
            </div>
            {file && (
              <p className="text-xs text-muted-foreground mt-1">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Required Headers Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm font-semibold mb-2">Required Headers:</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Required:</strong> title</p>
              <p><strong>Optional (for invitations):</strong> name, email</p>
              <p><strong>Optional:</strong> description, assigned_to, assigned_by, date_assigned, due_date, priority, status, comments, role</p>
              <p className="text-yellow-600 mt-2"><strong>Note:</strong> Tasks will only be visible to users who accept invitations. If email is provided, invitations will be sent automatically.</p>
            </div>
          </div>

          {/* Parse Button */}
          {file && parsedData.length === 0 && (
            <Button
              onClick={parseFile}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Parse File
                </>
              )}
            </Button>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm font-semibold text-red-800 mb-2">Validation Errors:</p>
              <ul className="text-xs text-red-700 space-y-1 max-h-40 overflow-y-auto">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Parsed Data Preview */}
          {parsedData.length > 0 && (
            <div className="space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm font-semibold text-green-800">
                  ✓ Successfully parsed {parsedData.length} tasks
                </p>
              </div>

              <div className="max-h-60 overflow-y-auto border rounded-md">
                <table className="w-full text-xs">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="p-2 text-left">Title</th>
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2 text-left">Email</th>
                      <th className="p-2 text-left">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 10).map((task, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{task.title}</td>
                        <td className="p-2">{task.name}</td>
                        <td className="p-2">{task.email}</td>
                        <td className="p-2">{task.due_date || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 10 && (
                  <p className="text-xs text-muted-foreground p-2">
                    ... and {parsedData.length - 10} more tasks
                  </p>
                )}
              </div>

              <Button
                onClick={handleImport}
                disabled={isProcessing || !projectId}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Import {parsedData.length} Tasks
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Import Results */}
          {importResults && (
            <div className="p-4 bg-muted rounded-md space-y-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-semibold">{importResults.success} Tasks Created</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-semibold">{importResults.failed} Failed</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-semibold">{importResults.invitations} Invitations Sent</span>
                </div>
              </div>
              {importResults.errors.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <p className="font-semibold">Errors:</p>
                  <ul className="list-disc list-inside">
                    {importResults.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportTasksModal;

