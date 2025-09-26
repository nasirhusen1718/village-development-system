import api from './http';

export const getSectorDistribution = async () => {
  try {
    const response = await api.get('/dashboard/sector-distribution');
    return response.data;
  } catch (error) {
    console.error('Error fetching sector distribution:', error);
    throw error;
  }
};

export const getStatusSummary = async () => {
  try {
    const response = await api.get('/dashboard/status-summary');
    return response.data;
  } catch (error) {
    console.error('Error fetching status summary:', error);
    throw error;
  }
};

export const getDashboardData = async () => {
  try {
    const [sectorData, statusData] = await Promise.all([
      getSectorDistribution(),
      getStatusSummary(),
    ]);
    
    return {
      sector_distribution: sectorData.distribution || {},
      ...statusData,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};
