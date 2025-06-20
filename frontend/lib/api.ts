import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
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
  uploadFile: async (file: File, outputFormat: string): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('output_format', outputFormat);

    const response = await api.post<UploadResponse>('/upload', formData);
    return response.data;
  },

  // Check conversion status
  checkStatus: async (taskId: string): Promise<StatusResponse> => {
    const response = await api.get<StatusResponse>(`/status/${taskId}`);
    return response.data;
  },
};

export default api; 