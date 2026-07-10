import axiosInstance from './axiosInstance';

export const getProjects = () => axiosInstance.post('ctpl/master/projects');
export const createProjects = payload =>
  axiosInstance.post('ctpl/master/projects/create', payload);
export const updateProjects = payload =>
  axiosInstance.post('ctpl/master/projects/update', payload);
export const deleteProjects = payload =>
  axiosInstance.post('ctpl/master/projects/delete', payload);
export const getProjectComponents = payload =>
  axiosInstance.post('ctpl/master/projects/components', payload);
export const createProjectComponents = payload =>
  axiosInstance.post('ctpl/master/projects/components/create', payload);
export const updateProjectComponents = payload =>
  axiosInstance.post('ctpl/master/projects/components/update', payload);
export const deleteProjectComponents = payload =>
  axiosInstance.post('ctpl/master/projects/components/delete', payload);
export const getProjectAssignedClients = payload =>
  axiosInstance.post('ctpl/master/projects/assigned-clients', payload);
export const assignProjectClients = payload =>
  axiosInstance.post('ctpl/master/projects/assign', payload);
export const unassignProjectClients = payload =>
  axiosInstance.post('ctpl/master/projects/unassign', payload);
export const updateAssignedProjectClients = payload =>
  axiosInstance.post('ctpl/master/projects/assigned-clients-update', payload);
export const getProjectLeads = () =>
  axiosInstance.post('ctpl/master/projects/getactivedevelopers');
export const getProjectAssignedClientUsers = payload =>
  axiosInstance.post('ctpl/master/projects/assigned-users', payload);
export const assignProjectClientUsers = payload =>
  axiosInstance.post('ctpl/master/projects/assign-clientusers', payload);
export const getProjectClientusers = payload =>
  axiosInstance.post('ctpl/master/projects/getclientusers', payload);
export const deleteAssignedUsers = payload =>
  axiosInstance.post('ctpl/master/projects/delete/assigned-user', payload);
