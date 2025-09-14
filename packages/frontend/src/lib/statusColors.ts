// packages/frontend/src/lib/statusColors.ts

import statusColors from './statusColors.json';

// A type-safe helper for Material UI Chip component colors
type ChipColor = 'primary' | 'info' | 'warning' | 'success' | 'default' | 'error';

/**
 * Returns a Material UI Chip color that is SEMANTICALLY CONSISTENT
 * with our new color palette in statusColors.json.
 */
export const getRequestStatusChipColor = (status: string): ChipColor => {
  const colorMap: { [key: string]: ChipColor } = {
    new: 'info',      // MUI 'info' is a nice Blue, matching our "#0288D1"
    viewed: 'warning',  // MUI 'warning' is Amber, matching our "#FBC02D"
    quoted: 'primary',  // MUI 'primary' is often a strong color, great for "waiting on customer"
    accepted: 'success',// MUI 'success' is Green, matching our "#388E3C"
    scheduled: 'success',// We also use 'success' for scheduled, as it's a positive state.
    completed: 'default', // MUI 'default' is Grey, matching our "#546E7A"
  };
  return colorMap[status] || 'default';
};

/**
 * Returns a Material UI Chip color for individual quote statuses.
 */
export const getQuoteStatusChipColor = (status: string): ChipColor => {
  const colorMap: { [key: string]: ChipColor } = {
    accepted: 'success',
    rejected: 'error',
    sent: 'default',
  };
  return colorMap[status] || 'default';
};

/**
 * Returns a specific HEX color code directly from the JSON file.
 * This is used for the map pins, which require a direct color string.
 */
export const getRequestStatusPinColor = (status: string): string => {
  return statusColors[status as keyof typeof statusColors] || statusColors.default;
};
