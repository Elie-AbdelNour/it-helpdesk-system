import { useRef, useState } from 'react';
import { DEFAULT_EXTENSIONS, validateFile } from '../lib/fileValidation';

export default function FileUpload({
  accept,
  allowedExtensions = DEFAULT_EXTENSIONS,
  maxSizeMB = 10,
  onUpload,
  buttonLabel = 'Upload',
}) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  function handleFileChange(e) {
    const selected = e.target.files?.[0] ?? null;
    setError(null);
    setFile(null);

    if (!selected) return;

    const validationError = validateFile(selected, { maxSizeMB, allowedExtensions });
    if (validationError) {
      setError(validationError);
      e.target.value = '';
      return;
    }

    setFile(selected);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await onUpload(file);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      setError(err.response?.data?.message ?? 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-3">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="min-w-0 flex-1 text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700 file:shadow-sm hover:file:bg-blue-50 hover:file:text-blue-700"
      />
      {file && (
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className="btn-primary min-h-0 py-2"
        >
          {uploading ? 'Uploading...' : buttonLabel}
        </button>
      )}
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </div>
  );
}
