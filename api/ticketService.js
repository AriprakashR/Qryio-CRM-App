import axiosInstance from './axiosInstance';

export const getTicketsList = payload =>
  axiosInstance.post('ctpl/tickets/list', payload);
export const createTicket = payload =>
  axiosInstance.post('ctpl/tickets/create', payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const updateTicketStatus = payload =>
  axiosInstance.post('ctpl/tickets/update/status', payload);
export const viewTicket = payload =>
  axiosInstance.post('ctpl/tickets/view', payload);
export const getUserProjects = () =>
  axiosInstance.post('ctpl/tickets/user-projects');
export const getUserProjectsComponents = payload =>
  axiosInstance.post('ctpl/tickets/project-components', payload);
export const getClientsInfoList = () =>
  axiosInstance.post('ctpl/master/clients/info-list');
export const getProjectInfoList = (clientId = null) =>
  axiosInstance.post('ctpl/master/project/info-list', { clientId });
export const getComponentInfoList = (projectId = null) =>
  axiosInstance.post('ctpl/master/component/info-list', { projectId });
