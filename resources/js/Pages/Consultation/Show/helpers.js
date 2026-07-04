// Format date for better display
export const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';

    try {
        const date = new Date(dateString);
        return date.toLocaleString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (e) {
        return dateString;
    }
};
