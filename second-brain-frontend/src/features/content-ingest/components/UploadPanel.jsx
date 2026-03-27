import React from 'react';
import { ArrowRight, FileImage, FileText, Upload } from 'lucide-react';
import GlassCard from '../../../components/ui/GlassCard';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

// File upload entry panel shown next to the link panel in the dashboard header.
// Input: selected file state, optional title, loading state, and upload form handlers.
// Output: compact upload panel for PDFs and images.
const UploadPanel = ({
  selectedFile,
  title,
  onTitleChange,
  onFileChange,
  onSubmit,
  loading,
  fileInputRef,
}) => {
  const isPdf = isPdfFile(selectedFile);
  const fileMeta = selectedFile
    ? `${isPdf ? 'PDF' : 'Image'} | ${formatFileSize(selectedFile.size)}`
    : 'PDF or image with AI tags and preview';

  return (
    <GlassCard interactive className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(120,200,255,0.12)] text-[#7dc3ff]">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#fff1d5] sm:text-lg">Upload Document</h2>
            <p className="mt-1 text-sm text-obsidian-500">{fileMeta}</p>
          </div>
        </div>

        <ArrowRight className="mt-1 h-4 w-4 text-obsidian-500" />
      </div>

      <form onSubmit={onSubmit} className="mt-5 space-y-3">
        <label className="block cursor-pointer rounded-[22px] border border-dashed border-[rgba(255,204,102,0.1)] bg-[rgba(255,255,255,0.03)] p-4 transition-colors hover:border-[rgba(255,191,64,0.18)] hover:bg-[rgba(255,255,255,0.04)]">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/*"
            onChange={onFileChange}
            className="sr-only"
          />

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.04)] text-obsidian-400">
              {isPdf ? <FileText className="h-4 w-4" /> : <FileImage className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#fff1d5]">
                {selectedFile ? selectedFile.name : 'Select a file to upload'}
              </p>
              <p className="text-xs text-obsidian-500">
                {selectedFile ? fileMeta : 'Choose a PDF or image and let the backend extract, tag, and store it.'}
              </p>
            </div>
          </div>
        </label>

        <div className="flex flex-col gap-3 lg:flex-row">
          <Input
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="Title Is needed for Ai "
            icon={isPdf ? FileText : FileImage}
            className="flex-1"
            required
          />
          <Button type="submit" variant="surface" loading={loading} className="rounded-2xl px-5 py-3">
            Upload File
          </Button>
        </div>
      </form>
    </GlassCard>
  );
};

function isPdfFile(file) {
  const normalizedType = String(file?.type || '').toLowerCase();
  const normalizedName = String(file?.name || '').toLowerCase();

  return normalizedType === 'application/pdf' || normalizedName.endsWith('.pdf');
}

function formatFileSize(size) {
  if (!Number.isFinite(size) || size <= 0) {
    return 'Unknown size';
  }

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default UploadPanel;
