/**
 * Handles receipt file upload using Cloudinary Unsigned Upload with fallback to local server endpoint.
 * No Cloudinary API Secret is ever exposed on the client.
 */

export interface UploadResult {
  url: string;
  publicId?: string;
  fileName: string;
  fileSize: number;
  provider: 'cloudinary' | 'local';
}

export async function uploadReceipt(
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  const metaEnv = (import.meta as any).env || {};
  const cloudName = metaEnv.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = metaEnv.VITE_CLOUDINARY_UPLOAD_PRESET;

  // 1. If Cloudinary environment variables are configured, try direct unsigned upload
  if (cloudName && uploadPreset) {
    try {
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
      const resourceType = isPdf ? 'raw' : 'image';
      const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', 'free-fire-store/receipts');

      const result = await new Promise<UploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', endpoint, true);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) {
            const pct = Math.round((e.loaded / e.total) * 100);
            onProgress(pct);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              resolve({
                url: res.secure_url || res.url,
                publicId: res.public_id,
                fileName: file.name,
                fileSize: file.size,
                provider: 'cloudinary',
              });
            } catch (err) {
              reject(err);
            }
          } else {
            reject(new Error(`Cloudinary upload failed with status ${xhr.status}: ${xhr.responseText}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error occurred during Cloudinary upload'));
        xhr.send(formData);
      });

      return result;
    } catch (cloudinaryError) {
      console.warn('Cloudinary upload fallback to server endpoint:', cloudinaryError);
    }
  }

  // 2. Server API fallback
  const formData = new FormData();
  formData.append('receipt', file);

  if (onProgress) onProgress(30);

  const response = await fetch('/api/upload-receipt', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to upload receipt to server');
  }

  if (onProgress) onProgress(100);

  const data = await response.json();
  return {
    url: data.url,
    publicId: data.fileName,
    fileName: file.name,
    fileSize: file.size,
    provider: 'local',
  };
}
