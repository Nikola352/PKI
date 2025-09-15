import { CheckCircle, Upload, X } from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";

const errorClasses: string = "text-red-500 text-sm mt-1";
interface FormErrors {
  [key: string]: string;
}
const FileUpload = ({
  uploadedFile,
  setUploadedFile,
  error,
  setValidationError,
}: {
  uploadedFile?: File | null;
  setUploadedFile: Dispatch<SetStateAction<File | null>>;
  error: string;
  setValidationError: Dispatch<SetStateAction<FormErrors>>;
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);

  const handleFileUpload = (file: File) => {
    if (file && file.name.endsWith(".pem")) {
      setUploadedFile(file);
      setValidationError({});
    } else {
      alert("Please select a valid .pem file");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = [...e.dataTransfer.files];
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const removeFile = () => {
    setUploadedFile(null);
  };
  return (
    <>
      <div className="mt-6 space-y-4 ">
        {/* PEM File Upload */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-50">
            Upload Certificate/Key File
          </label>

          {!uploadedFile ? (
            <div
              className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 cursor-pointer hover:bg-slate-500 ${
                dragActive ? "border-blue-500 bg-slate-600" : "border-slate-300"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById("file-upload")!.click()}
            >
              <input
                id="file-upload"
                type="file"
                accept=".pem"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0] != null) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />

              <div className="text-center">
                <Upload
                  className={`mx-auto h-12 w-12 mb-3 transition-colors ${
                    dragActive ? "text-blue-500" : "text-slate-400"
                  }`}
                />
                <p className="text-sm font-medium text-slate-50 mb-1">
                  {dragActive
                    ? "Drop your .pem file here"
                    : "Click to upload or drag and drop"}
                </p>
                <p className="text-xs text-slate-100">PEM files only (.pem)</p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-emerald-800">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-emerald-600">
                      {(uploadedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="p-1 hover:bg-emerald-100 rounded-full transition-colors"
                >
                  <X className="h-4 w-4 text-emerald-600" />
                </button>
              </div>
            </div>
          )}
          {error && <p className={errorClasses}>{error}</p>}
        </div>
      </div>
    </>
  );
};

export default FileUpload;
