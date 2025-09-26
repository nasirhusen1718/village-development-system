import api from "./http";

export const sectorProblems = (sector, params = {}) =>
  api.get(`/officer/sector/${sector}`, { params });

export const updateStatus = (id, { status, officer_remarks, assign_to_self = true }) =>
  api.patch(`/officer/problems/${id}/status`, { status, officer_remarks, assign_to_self });

export const escalateProblem = (id, remarks) =>
  api.post(`/officer/problems/${id}/escalate`, { remarks });

export const getProblemHistory = (id) =>
  api.get(`/officer/problems/${id}/history`);
