import api from "./http";

export const createProblem = (payload) =>
  api.post("/farmer/problems", payload);

export const myProblems = () => api.get("/farmer/problems");
