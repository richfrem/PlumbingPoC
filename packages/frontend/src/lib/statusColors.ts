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
    new: 'info',          // Blue - new request
    viewed: 'primary',    // Purple - being reviewed
    quoted: 'primary',    // Purple - quote sent
    accepted: 'success',  // Green - customer accepted
    scheduled: 'success', // Green - job scheduled
    in_progress: 'warning', // Orange - work in progress
    completed: 'info',    // Teal - job done, ready for invoicing
    invoiced: 'info',     // Teal - invoice sent
    paid: 'success',      // Green - payment received
    overdue: 'error',     // Red - overdue invoice
    disputed: 'error',    // Red - disputed invoice
    cancelled: 'default', // Grey - cancelled
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
    change_order: 'warning',
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
