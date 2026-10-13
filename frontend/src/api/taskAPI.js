import axiosInstance from './axiosInstance';

export const getMyTasks    = ()          => axiosInstance.get('/tasks/my').then(r => r.data);
export const getAllTasks    = (params)    => axiosInstance.get('/tasks', { params }).then(r => r.data);
export const getTaskDetail = (id)        => axiosInstance.get(`/tasks/${id}`).then(r => r.data);
export const getTaskStats  = ()          => axiosInstance.get('/tasks/stats').then(r => r.data);
export const updateStatus  = (id, status) => axiosInstance.patch(`/tasks/${id}/status`, { status }).then(r => r.data);
export const submitTask    = (id, data)  => axiosInstance.post(`/tasks/${id}/submit`, data).then(r => r.data);
export const reviewTask    = (id, data)  => axiosInstance.post(`/tasks/${id}/review`, data).then(r => r.data);
export const createTask    = (data)      => axiosInstance.post('/tasks', data).then(r => r.data);