export const DEFAULT_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'zip', 'jpg', 'jpeg', 'png', 'gif', 'webp'];

export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

export function extensionOf(filename) {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

export function validateFile(file, { maxSizeMB = 10, allowedExtensions = DEFAULT_EXTENSIONS } = {}) {
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `File is too large. Max size is ${maxSizeMB}MB.`;
  }

  const ext = extensionOf(file.name);
  if (!allowedExtensions.includes(ext)) {
    return `File type .${ext} is not allowed.`;
  }

  return null;
}
