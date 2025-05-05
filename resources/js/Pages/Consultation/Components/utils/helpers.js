// src/utils/helpers.js

/**
 * Generates a timestamped filename for exports/saves
 *
 * @param {string} format - File extension (png, svg, json)
 * @returns {string} Formatted filename with timestamp
 */
export const getFilename = (format) => {
    const now = new Date();

    // Format date as YYYY-MM-DD_HH-MM-SS
    const timestamp = now
        .toISOString()
        .slice(0, 19)          // Get YYYY-MM-DDTHH:mm:ss
        .replace(/:/g, '-')    // Replace colons with hyphens
        .replace('T', '_');    // Replace T separator with underscore

    return `pedigree-chart-${timestamp}.${format}`;
};

/**
 * Helper to debounce function calls
 *
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300) => {
    let timeout;

    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

/**
 * Generates a unique ID with optional prefix
 *
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} Unique ID
 */
export const generateUniqueId = (prefix = '') => {
    return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Formats a value for display, handling undefined/null values
 *
 * @param {any} value - Value to format
 * @param {string} defaultValue - Default value if undefined/null
 * @returns {string} Formatted value
 */
export const formatValue = (value, defaultValue = 'N/A') => {
    if (value === undefined || value === null) {
        return defaultValue;
    }
    return String(value);
};
