import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileSpreadsheet, Upload } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { excelSerialToDate } from "@/lib/utils";

interface ImportTasksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (tasks: any[]) => void;
}

const ImportTasksModal = ({ open, onOpenChange, onSubmit }: ImportTasksModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls') || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        parseExcelFile(selectedFile);
      } else {
        toast.error("Please upload an Excel or CSV file");
      }
    }
  };

  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          toast.error("The file is empty or has no valid data");
          return;
        }
        
        const extractedHeaders = Object.keys(jsonData[0] as object);
        setHeaders(extractedHeaders);
        setPreviewData(jsonData);
        toast.success(`Successfully loaded ${jsonData.length} tasks`);
      } catch (error) {
        toast.error("Failed to parse the file. Please check the format.");
        console.error("Parse error:", error);
      }
    };
    
    reader.onerror = () => {
      toast.error("Failed to read the file");
    };
    
    reader.readAsBinaryString(file);
  };

  const handleSubmit = () => {
    if (previewData.length > 0) {
      // Map the preview data to task format - preserve all Excel columns and convert dates
      const tasks = previewData.map(row => ({
        sn: row["S/N"],
        deliverables: row["Deliverables"],
        assignedTo: row["Assigned To"],
        assignedBy: row["Assigned By"],
        description: row["Description"],
        dateAssigned: excelSerialToDate(row["DateAssigned"]),
        dueDate: excelSerialToDate(row["Due Date"]),
        timelines: row["Timelines"],
        priority: row["Priority"],
        status: row["Status"],
        comments: row["Comments"]
      }));
      onSubmit(tasks);
      handleClose();
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData([]);
    setHeaders([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Tasks from Excel</DialogTitle>
          <DialogDescription>
            Upload an Excel file with columns: S/N, Deliverables, Assigned To, Assigned By, Description, DateAssigned, Due Date, Timelines, Priority, Status, and Comments
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!file ? (
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground">Excel (.xlsx, .xls) or CSV files</p>
                </div>
              </Label>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">{file.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setPreviewData([]);
                    setHeaders([]);
                  }}
                >
                  Remove
                </Button>
              </div>

               {previewData.length > 0 && (
                <div className="space-y-2">
                  <Label>Preview ({previewData.length} tasks found)</Label>
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {headers.map((header) => (
                            <TableHead key={header} className="min-w-[120px]">{header}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.slice(0, 5).map((row, index) => (
                          <TableRow key={index}>
                            {headers.map((header) => (
                              <TableCell key={header} className="text-sm">
                                {row[header] || "-"}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {previewData.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Showing first 5 rows. {previewData.length - 5} more will be imported.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!file || previewData.length === 0}>
              <Upload className="w-4 h-4 mr-2" />
              Import {previewData.length} Task(s)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportTasksModal;
