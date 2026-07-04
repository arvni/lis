export const PARAM_TYPES = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'time', label: 'Time' },
    { value: 'options', label: 'Options' },
    { value: 'file', label: 'File' },
];

export const TYPE_COLOR = {
    text: 'default',
    number: 'primary',
    date: 'info',
    time: 'secondary',
    options: 'warning',
    file: 'success',
};

export const EMPTY_PARAM = { name: '', type: '', index: null, required: true };
