import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../lib/firebase';

// File handler utility for saving uploaded files

export interface UploadedFile {
  file: File;
  preview: string;
  savedPath: string;
}

export async function saveToFolder(file: File, folderName: 'beneficiaries' | 'campaigns' | 'events' | 'profiles'): Promise<UploadedFile> {
  // Create a preview URL
  const preview = URL.createObjectURL(file);

  // Generate unique filename
  const timestamp = Date.now();
  const fileExtension = file.name.split('.').pop();
  const uniqueFileName = `${folderName}_${timestamp}.${fileExtension}`;

  const savedPath = `/uploads/${folderName}/${uniqueFileName}`;

  if (storage) {
    const storageRef = ref(storage, `${folderName}/${uniqueFileName}`);
    await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(storageRef);

    return {
      file,
      preview: downloadUrl,
      savedPath: downloadUrl,
    };
  }

  // Store in localStorage as base64 for demo purposes
  // In production, you'd send this to your backend
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;

      // Save to localStorage (simulating server storage)
      const existingFiles = JSON.parse(localStorage.getItem(`uploads_${folderName}`) || '{}');
      existingFiles[uniqueFileName] = {
        name: file.name,
        type: file.type,
        size: file.size,
        data: base64Data,
        uploadedAt: new Date().toISOString(),
      };
      localStorage.setItem(`uploads_${folderName}`, JSON.stringify(existingFiles));

      resolve({
        file,
        preview,
        savedPath,
      });
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getUploadedFile(folderName: string, fileName: string): string | null {
  const existingFiles = JSON.parse(localStorage.getItem(`uploads_${folderName}`) || '{}');
  return existingFiles[fileName]?.data || null;
}

export function getAllUploadedFiles(folderName: string): Record<string, any> {
  return JSON.parse(localStorage.getItem(`uploads_${folderName}`) || '{}');
}

export function deleteUploadedFile(folderName: string, fileName: string): void {
  const existingFiles = JSON.parse(localStorage.getItem(`uploads_${folderName}`) || '{}');
  delete existingFiles[fileName];
  localStorage.setItem(`uploads_${folderName}`, JSON.stringify(existingFiles));
}
