import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}

export function FileUpload({ onUpload, isUploading }: FileUploadProps) {
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      
      if (!file.name.endsWith(".csv")) {
        setUploadStatus("error");
        setErrorMessage("Please upload a CSV file");
        return;
      }

      setUploadStatus("idle");
      setErrorMessage("");

      try {
        await onUpload(file);
        setUploadStatus("success");
        setTimeout(() => setUploadStatus("idle"), 3000);
      } catch (error) {
        setUploadStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Upload failed");
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <Card className="border-2 border-dashed transition-colors duration-200">
      <CardContent className="p-0">
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center p-5 sm:p-6 md:p-8 min-h-[180px] sm:min-h-[200px] cursor-pointer transition-all duration-200 rounded-md",
            isDragActive && !isDragReject && "bg-primary/5",
            isDragReject && "bg-destructive/5",
            isUploading && "opacity-50 cursor-not-allowed"
          )}
          data-testid="dropzone-upload"
        >
          <input {...getInputProps()} data-testid="input-file-upload" />

          <div
            className={cn(
              "w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-3 sm:mb-4 transition-colors shrink-0",
              isDragActive && !isDragReject
                ? "bg-primary/10 text-primary"
                : isDragReject
                ? "bg-destructive/10 text-destructive"
                : uploadStatus === "success"
                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                : uploadStatus === "error"
                ? "bg-destructive/10 text-destructive"
                : "bg-muted text-muted-foreground"
            )}
          >
            {isUploading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : uploadStatus === "success" ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : uploadStatus === "error" ? (
              <AlertCircle className="w-8 h-8" />
            ) : isDragActive ? (
              <FileSpreadsheet className="w-8 h-8" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>

          <div className="text-center space-y-1 sm:space-y-2">
            {isUploading ? (
              <p className="text-base sm:text-lg font-medium" data-testid="text-upload-processing">Processing CSV file...</p>
            ) : uploadStatus === "success" ? (
              <p className="text-base sm:text-lg font-medium text-green-600 dark:text-green-400" data-testid="text-upload-success">
                File uploaded successfully!
              </p>
            ) : uploadStatus === "error" ? (
              <>
                <p className="text-base sm:text-lg font-medium text-destructive" data-testid="text-upload-error">Upload failed</p>
                <p className="text-xs sm:text-sm text-muted-foreground break-words px-2" data-testid="text-error-message">{errorMessage}</p>
              </>
            ) : isDragActive ? (
              <p className="text-base sm:text-lg font-medium text-primary" data-testid="text-drop-here">Drop CSV file here</p>
            ) : (
              <>
                <p className="text-base sm:text-lg font-medium px-1" data-testid="text-drag-drop">
                  Drag & drop your CSV file here
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  or tap to browse files
                </p>
              </>
            )}
          </div>

          {!isUploading && uploadStatus === "idle" && !isDragActive && (
            <Button variant="outline" className="mt-3 sm:mt-4 min-h-[44px] sm:min-h-9" data-testid="button-browse-files">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Browse Files
            </Button>
          )}

          <p className="text-xs text-muted-foreground mt-3 sm:mt-4 px-2 text-center max-w-sm" data-testid="text-format-info">
            CSV: Equipment Name, Type, Flowrate, Pressure, Temperature
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
