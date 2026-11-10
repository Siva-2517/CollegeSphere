/**
 * Format ISO date string to readable DD/MM/YYYY
 * @param {string|Date} dateString
 * @returns {string} Formatted date or 'N/A'
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (err) {
    return 'N/A';
  }
};

/**
 * Format ISO date string into a structured object for collegiate calendar badges
 * @param {string|Date} dateString
 * @returns {{ month: string, day: string, year: number, weekday: string }}
 */
export const formatCalendarDate = (dateString) => {
  if (!dateString) return { month: 'TBD', day: '--', year: '', weekday: '' };
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return { month: 'TBD', day: '--', year: '', weekday: '' };
    return {
      month: date.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
      day: String(date.getDate()).padStart(2, '0'),
      year: date.getFullYear(),
      weekday: date.toLocaleString('en-US', { weekday: 'short' })
    };
  } catch (err) {
    return { month: 'TBD', day: '--', year: '', weekday: '' };
  }
};

export default formatDate;
