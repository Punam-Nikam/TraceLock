// frontend/src/api/authAPI.js
import axiosInstance from './axiosInstance';

export const registerCompany  = (data) =>
  axiosInstance.post('/auth/register-company', data).then(r => r.data);

// This is called from JoinAsEmployee.jsx
// Sends: { fullName, email, password, companyEmail }
export const registerEmployee = (data) =>
  axiosInstance.post('/auth/register-employee', data).then(r => r.data);

export const loginUser = (email, password) =>
  axiosInstance.post('/auth/login', { email, password }).then(r => r.data);

export const getMe = () =>
  axiosInstance.get('/auth/me').then(r => r.data);