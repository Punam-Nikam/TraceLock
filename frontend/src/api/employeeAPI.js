import axiosInstance from './axiosInstance';

// All employees with pagination (admin table)
export const getEmployees = (params) =>
  axiosInstance.get('/employees', { params }).then(r => r.data);

// Active employees only — for dropdowns in task/file creation
export const getActiveEmployees = () =>
  axiosInstance.get('/employees/active').then(r => r.data);

// Create employee manually
export const createEmployee = (data) =>
  axiosInstance.post('/employees', data).then(r => r.data);

// Toggle active/inactive
export const toggleEmployee = (id, isActive) =>
  axiosInstance.patch(`/employees/${id}/toggle`, { isActive }).then(r => r.data);

// Departments
export const getDepartments = () =>
  axiosInstance.get('/employees/departments').then(r => r.data);

export const createDepartment = (name) =>
  axiosInstance.post('/employees/departments', { name }).then(r => r.data);