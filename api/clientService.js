import axiosInstance from './axiosInstance';

export const getClientsList = () =>
  axiosInstance.post('ctpl/master/clients/list');
export const createClients = payload =>
  axiosInstance.post('ctpl/master/clients/create', payload);
export const updateClients = payload =>
  axiosInstance.post('ctpl/master/clients/update', payload);
export const deleteClients = payload =>
  axiosInstance.post('ctpl/master/clients/delete', payload);
export const getClientUsers = payload =>
  axiosInstance.post('ctpl/user/client-users', payload);
export const createClientUser = payload =>
  axiosInstance.post('ctpl/user/client-users/create', payload);
export const updateClientUser = payload =>
  axiosInstance.post('ctpl/user/client-users/update', payload);
export const deleteClientUser = payload =>
  axiosInstance.post('ctpl/user/client-users/delete', payload);
export const getClientAssignedProjects = payload =>
  axiosInstance.post('ctpl/master/clients/assigned-projects', payload);
