import api from "./http";

export const listUsers = () => api.get("/admin/users");

export const listAllProblems = () => api.get("/admin/problems");

export const getStatusSummary = () => api.get("/admin/summary/status");
export const getSectorSummary = () => api.get("/admin/summary/sector");
export const deleteUser = (userId) => api.delete(`/admin/users/${userId}`);
