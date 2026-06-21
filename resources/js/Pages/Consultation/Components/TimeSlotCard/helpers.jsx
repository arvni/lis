import React from 'react';
import {
    AccessTime,
    CheckCircle,
    Schedule,
    Cancel,
} from '@mui/icons-material';

/**
 * Formats time from date string to HH:MM AM/PM format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted time
 */
export const formatTime = (dateString) => {
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    return `${hours}:${minutes} ${ampm}`;
};

/**
 * Gets duration between two time strings
 * @param {string} startTime - ISO date string for start time
 * @param {string} endTime - ISO date string for end time
 * @returns {string} Formatted duration
 */
export const getDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;

    if (hours > 0) {
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return `${minutes}m`;
};

/**
 * Gets configuration for status display
 * @param {string} status - Status string
 * @returns {Object} Status configuration with color and icon
 */
export const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
        case 'done':
            return { color: 'success', icon: <CheckCircle fontSize="small" /> };
        case 'pending':
            return { color: 'warning', icon: <Schedule fontSize="small" /> };
        case 'cancelled':
            return { color: 'error', icon: <Cancel fontSize="small" /> };
        default:
            return { color: 'default', icon: <AccessTime fontSize="small" /> };
    }
};
