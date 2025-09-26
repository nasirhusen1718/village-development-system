import api from "./http";

export const predictHealth = async (sample) => {
  const { data } = await api.post("/health/predict", sample);
  return data;
};

export const batchPredictHealth = async (samples) => {
  const { data } = await api.post("/health/batch", { samples });
  return data;
};
