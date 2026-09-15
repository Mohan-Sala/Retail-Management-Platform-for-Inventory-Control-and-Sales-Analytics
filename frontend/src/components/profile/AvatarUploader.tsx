import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";

interface AvatarUploaderProps {
  onUpload: (base64: string) => void;
}

/**
 * @desc Drag and drop image uploader supporting file validations
 */
export function AvatarUploader({ onUpload }: AvatarUploaderProps) {
  const [dragActive, setDragActive] = useState(false);

  const processFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onUpload(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <Card
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-xs text-muted-foreground gap-3 cursor-pointer min-h-[140px] max-w-sm transition-colors ${
        dragActive ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/40"
      }`}
    >
      <UploadCloud className="h-8 w-8 text-primary/60" />
      <div className="text-center">
        <span className="font-semibold text-foreground">Drag and drop avatar image</span>
        <span className="text-[10px] block mt-0.5">PNG, JPG, WEBP formats up to 2 MB supported</span>
      </div>
      <input type="file" accept="image/*" onChange={handleChange} className="hidden" id="avatar-input" />
      <Button variant="outline" size="sm" onClick={() => document.getElementById("avatar-input")?.click()}>
        Choose File
      </Button>
    </Card>
  );
}
export default AvatarUploader;
