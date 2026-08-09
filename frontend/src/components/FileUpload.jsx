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
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="text-sm text-slate-600 file:mr-3 file:rounded file:border-0 file:bg-slate-200 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-slate-300 dark:text-slate-300 dark:file:bg-slate-700 dark:hover:file:bg-slate-600"
      />
      {file && (
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : buttonLabel}
        </button>
      )}
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </div>
  );
}
