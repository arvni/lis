import React from 'react';
import { Slide } from '@mui/material';
import {
    CheckBox,
    TextFields,
    Numbers,
    List as ListIcon,
    CalendarMonth,
    Title,
} from '@mui/icons-material';

export const SlideTransition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export const getFieldTypeIcon = (type) => {
    switch (type) {
        case 'text':
            return <TextFields color="primary" />;
        case 'checkbox':
            return <CheckBox color="secondary" />;
        case 'number':
            return <Numbers color="warning" />;
        case 'select':
            return <ListIcon color="success" />;
        case 'date':
            return <CalendarMonth color="info" />;
        case 'description':
            return <Title color="error" />;
        default:
            return <TextFields color="primary" />;
    }
};

export const getTypeDescription = (type) => {
    switch (type) {
        case 'text':
            return 'Single line text input field';
        case 'checkbox':
            return 'Yes/No field that can be checked';
        case 'number':
            return 'Numeric input field with validation';
        case 'select':
            return 'Dropdown with selectable options';
        case 'date':
            return 'Date picker field';
        case 'description':
            return 'Section title or label (not an input field)';
        default:
            return '';
    }
};
