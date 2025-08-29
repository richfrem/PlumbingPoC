// vite-app/src/lib/statusColors.ts

export const getRequestStatusChipColor = (status: string): 'primary' | 'info' | 'warning' | 'success' | 'default' => {
  const colorMap: { [key: string]: 'primary' | 'info' | 'warning' | 'success' | 'default' } = {
    new: 'primary',
    viewed: 'info',
    quoted: 'warning',
    accepted: 'success',
    scheduled: 'success',
    completed: 'default'
  };
  return colorMap[status] || 'default';
};

export const getQuoteStatusChipColor = (status: string): 'success' | 'error' | 'default' => {
  const colorMap: { [key: string]: 'success' | 'error' | 'default' } = {
    accepted: 'success',
    rejected: 'error',
    sent: 'default',
  };
  return colorMap[status] || 'default';
};
