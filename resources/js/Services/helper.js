

export function makeId(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

export const sum = (arr = [], field, func = (value) => value) => {

    return arr.map(item => getDotedValue(item, field) * 1).reduce((sum, a) => sum + func(a), 0);
}
export const getDotedValue = (field, doted) => {
    let dotedItems = doted.split(".");
    if (dotedItems.length > 1) {
        let key = dotedItems.splice(0, 1);
        return getDotedValue(field[key], dotedItems.join("."))
    } else
        return field[doted];
}

export const calculateBusinessDays = (date,days) => {
    let currentDate = new Date(date);
    let remainingDays = days;

    while (remainingDays > 0) {
        // Move to the next day
        currentDate.setDate(currentDate.getDate() + 1);

        // Skip weekends (0 = Sunday, 6 = Saturday)
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            remainingDays--;
        }
    }

    return currentDate;
};


// Format date
export const formatDate = (date) => {
    if (!date) return "N/A";
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZoneName: undefined
    }).format(new Date(date));
};
