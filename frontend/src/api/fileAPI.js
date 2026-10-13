import axiosInstance from './axiosInstance';

export const uploadFile  = (formData, onProgress) =>
  axiosInstance.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded * 100) / e.total))
  }).then(r => r.data);

export const getMyFiles  = ()       => axiosInstance.get('/files').then(r => r.data);
export const getAllFiles  = ()       => axiosInstance.get('/files/all').then(r => r.data);
export const getFileLogs = (fileId) => axiosInstance.get(`/files/${fileId}/logs`).then(r => r.data);

export const downloadFile = async (fileId, fileName) => {
  const res  = await axiosInstance.get(`/files/${fileId}/download`, { responseType: 'blob' });
  const url  = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href  = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const detectLeak = (formData) =>
  axiosInstance.post('/files/detect-leak', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data);