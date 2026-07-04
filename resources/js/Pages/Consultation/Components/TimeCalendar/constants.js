export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

// Format date as ISO string (YYYY-MM-DD)
export const formatDateISO = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const isSameDay = (a, b) => {
    if (!a || !b) return false;
    return (
        a.getDate() === b.getDate() &&
        a.getMonth() === b.getMonth() &&
        a.getFullYear() === b.getFullYear()
    );
};

export const isToday = (date) => isSameDay(date, new Date());

export const formatDate = (date) => {
    if (!date) return '';
    const day = date.getDate();
    const month = MONTH_NAMES[date.getMonth()];
    const year = date.getFullYear();
    const weekday = DAYS_OF_WEEK[(date.getDay() + 6) % 7]; // Convert to our Saturday-first system
    return `${weekday}, ${month} ${day}, ${year}`;
};

// Build the month grid: leading blanks + each day of the month
export const buildCalendarDays = (currentDate) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Day of week for the first day, converted to our Saturday-first system
    let firstDayOfMonth = new Date(year, month, 1).getDay();
    firstDayOfMonth = (firstDayOfMonth + 6) % 7;

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push({ day: null, date: null });
    }
    for (let day = 1; day <= daysInMonth; day++) {
        days.push({ day, date: new Date(year, month, day) });
    }
    return days;
};
