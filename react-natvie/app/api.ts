import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { DocumentPickerAsset } from 'expo-document-picker';

const API_BASE_URL = 'http://192.168.1.102:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export interface UploadResponse {
  message: string;
  task_id: string;
}

export interface StatusResponse {
  status?: 'processing' | 'completed' | 'error';
  download_url?: string;
  error?: string;
  message?: string;
}

export const fileConverterApi = {
  // Upload file for conversion
  uploadFile: async (file: DocumentPickerAsset, outputFormat: string): Promise<UploadResponse> => {
    const formData = new FormData();
    // For React Native, file must be appended as { uri, name, type }
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || 'application/octet-stream',
    } as any);
    formData.append('output_format', outputFormat);

    const response = await api.post<UploadResponse>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Check conversion status
  checkStatus: async (taskId: string): Promise<StatusResponse> => {
    const response = await api.get<StatusResponse>(`/status/${taskId}`);
    return response.data;
  },
};

export default api; 