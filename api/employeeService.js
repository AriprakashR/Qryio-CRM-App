import axiosInstance from './axiosInstance';

export const getCompanyUsers = () =>
  axiosInstance.post('ctpl/user/company-users');
export const createCompanyUser = payload =>
  axiosInstance.post('ctpl/user/company-users/create', payload);
export const updateCompanyUser = payload =>
  axiosInstance.post('ctpl/user/company-users/update', payload);
export const deleteUser = payload =>
  axiosInstance.post('ctpl/user/delete', payload);
