import DescriptionIcon from "@mui/icons-material/Description";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import React from "react";

/**
 * Get appropriate icon based on file extension
 * @param {string} filename - Original filename
 * @returns {JSX.Element} - Icon component
 */
export const getFileIcon = (filename) => {
    if (!filename) return <InsertDriveFileIcon color="action" />;

    const extension = filename.split('.').pop()?.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
        return <ImageIcon color="primary" />;
    } else if (extension === 'pdf') {
        return <PictureAsPdfIcon color="error" />;
    } else if (['doc', 'docx'].includes(extension)) {
        return <DescriptionIcon color="primary" />;
    } else {
        return <InsertDriveFileIcon color="action" />;
    }
};

/**
 * Format file size to human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
    if (!bytes) return "";

    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
