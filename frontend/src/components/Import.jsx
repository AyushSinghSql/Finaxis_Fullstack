import React, { useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "./config";

const Import = ({ onImportPlan, refreshPlans }) => {
  const fileInputRef = useRef(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

const handleImportPlan = async (event) => {
  const files = Array.from(event.target.files); 
  
  if (files.length === 0) {
    // Note: This only triggers if the file picker was closed without selecting anything
    toast.error("No files selected");
    return;
  }

  const validExtensions = [".xlsx", ".xls"];
  const formData = new FormData();
  let validFileCount = 0;

  files.forEach((file) => {
    const fileExtension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    
    if (validExtensions.includes(fileExtension)) {
      // IMPORTANT: Check your backend controller! 
      // If backend uses upload.single('file'), change "files" to "file"
      formData.append("files", file); 
      validFileCount++;
    } else {
      toast.error(`Invalid format: ${file.name}`);
    }
  });

  if (validFileCount === 0) return;

  try {
    setIsActionLoading(true);
    
    const response = await axios.post(
      `${backendUrl}/RefreshMaster`,
      formData,
      { 
        headers: { "Content-Type": "multipart/form-data" } 
      }
    );

    toast.success("Plans imported successfully!");
    if (refreshPlans) await refreshPlans();
    
  } catch (err) {
    // 400 Errors usually land here
    const errorMessage = err.response?.data?.message || "Check file format or backend keys.";
    toast.error(errorMessage);
    console.error("Backend Error:", err.response?.data);
  } finally {
    setIsActionLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }
};

  return (
    <div className="flex items-center">
      <button
        onClick={() => fileInputRef.current.click()}
        className={`btn1 btn-blue flex items-center gap-1 ${isActionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={isActionLoading}
        title="Import Plan"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3 w-3 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          />
        </svg>
        {isActionLoading ? "Importing..." : "Import"}
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportPlan}
        accept=".xlsx,.xls"
        // multiple // <--- This allows multiple file selection
        className="hidden"
      />
    </div>
  );
};

export default Import;