import { attachmentDownloadUrl, deleteAttachment } from '../api/attachments';
import { IMAGE_EXTENSIONS } from '../lib/fileValidation';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentList({ ticketId, attachments = [], currentUserId, canManage, onChanged }) {
  if (attachments.length === 0) return null;

  async function handleDelete(attachmentId) {
    if (!window.confirm('Delete this attachment?')) return;
    await deleteAttachment(ticketId, attachmentId);
    onChanged?.();
  }

  return (
    <div className="flex flex-wrap gap-3">
      {attachments.map((attachment) => {
        const isImage = IMAGE_EXTENSIONS.includes(attachment.filetype);
        const url = attachmentDownloadUrl(ticketId, attachment.id);
        const canDelete = canManage || attachment.uploadedby === currentUserId;

        return (
          <div
            key={attachment.id}
            className="group flex flex-col items-start gap-1.5 rounded-xl border border-slate-200 bg-white p-2.5 text-xs shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <a href={url} target="_blank" rel="noreferrer" className="block">
              {isImage ? (
                <img src={url} alt={attachment.filename} className="h-20 w-20 rounded-lg object-cover" />
              ) : (
                <span className="flex h-20 w-20 items-center justify-center rounded-lg bg-slate-100 text-center font-semibold text-slate-500">
                  {attachment.filetype?.toUpperCase()}
                </span>
              )}
            </a>
            <span className="max-w-[5rem] truncate text-slate-600 dark:text-slate-300" title={attachment.filename}>
              {attachment.filename}
            </span>
            <span className="text-slate-400">{formatSize(attachment.filesize)}</span>
            {canDelete && (
              <button
                type="button"
                onClick={() => handleDelete(attachment.id)}
                className="text-red-600 hover:underline"
              >
                Delete
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
