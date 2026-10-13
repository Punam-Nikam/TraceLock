import axiosInstance from './axiosInstance';

export const getNotifications = () => axiosInstance.get('/notifications').then(r => r.data);
export const markAllRead      = () => axiosInstance.patch('/notifications/read-all').then(r => r.data);
export const markOneRead      = (id) => axiosInstance.patch(`/notifications/${id}/read`).then(r => r.data);