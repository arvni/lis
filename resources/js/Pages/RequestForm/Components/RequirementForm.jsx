import React, { useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Paper,
    Stack,
    Tooltip,
    Typography,
    Avatar,
    ListItemIcon,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    DragIndicator,
    TextFields,
    CheckBox,
    List as ListIcon,
    Numbers,
    Warning,
} from '@mui/icons-material';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DeleteButton from '@/Components/DeleteButton';
import AddRequirementForm from './AddRequirementForm';
import { makeId } from '@/Services/helper.js';

const getFieldTypeIcon = (type) => {
    switch (type) {
        case 'text':
            return <TextFields fontSize="small" color="primary" />;
        case 'checkbox':
            return <CheckBox fontSize="small" color="secondary" />;
        case 'number':
            return <Numbers fontSize="small" color="warning" />;
        case 'select':
            return <ListIcon fontSize="small" color="success" />;
        default:
            return <TextFields fontSize="small" color="primary" />;
    }
};

const getTypeLabel = (type) => {
    switch (type) {
        case 'text':
            return 'Text Field';
        case 'checkbox':
            return 'Checkbox';
        case 'number':
            return 'Number Field';
        case 'select':
            return 'Dropdown';
        default:
            return type.charAt(0).toUpperCase() + type.slice(1);
    }
};

const SortableRequirementItem = ({ field, index, disabled, requirements, onEdit, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: field.id.toString(),
        disabled,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <ListItem
            ref={setNodeRef}
            style={style}
            divider={index < requirements.length - 1}
            sx={{
                bgcolor: isDragging ? 'rgba(25, 118, 210, 0.08)' : 'background.paper',
                '&:hover': {
                    bgcolor: 'rgba(25, 118, 210, 0.04)',
                },
                transition: 'background-color 0.2s',
            }}
        >
            {/* Drag handle */}
            <ListItemIcon
                {...attributes}
                {...listeners}
                sx={{
                    cursor: disabled ? 'default' : 'grab',
                    color: 'text.secondary',
                    '&:hover': {
                        color: disabled ? 'text.secondary' : 'primary.main',
                    },
                }}
            >
                <DragIndicator />
            </ListItemIcon>

            {/* Field number and type icon */}
            <ListItemAvatar>
                <Avatar
                    sx={{
                        bgcolor: field.required ? 'primary.main' : 'grey.200',
                        color: field.required ? 'primary.contrastText' : 'text.primary',
                    }}
                >
                    {index + 1}
                </Avatar>
            </ListItemAvatar>

            {/* Field information */}
            <ListItemText
                slotProps={{ primary: { component: 'div' }, secondary: { component: 'div' } }}
                primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2">{field.label}</Typography>
                        {field.required && (
                            <Chip label="Required" size="small" color="error" variant="outlined" />
                        )}
                    </Box>
                }
                secondary={
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={{ xs: 1, sm: 2 }}
                        sx={{ mt: 0.5 }}
                    >
                        <Chip
                            icon={getFieldTypeIcon(field.type)}
                            label={getTypeLabel(field.type)}
                            size="small"
                            variant="filled"
                            sx={{
                                height: 24,
                                '& .MuiChip-label': { px: 1 },
                                '& .MuiChip-icon': { fontSize: 16 },
                            }}
                        />

                        {field.placeholder && (
                            <Typography variant="caption" color="text.secondary">
                                Placeholder: "{field.placeholder}"
                            </Typography>
                        )}

                        {field.type === 'select' && field.options && field.options.length > 0 && (
                            <Typography variant="caption" color="text.secondary">
                                Options: {field.options.join(', ')}
                            </Typography>
                        )}
                    </Stack>
                }
            />

            {/* Action buttons */}
            <Stack direction="row" spacing={1}>
                <Tooltip title="Edit Field">
                    <IconButton color="primary" onClick={onEdit} size="small" disabled={disabled}>
                        <EditIcon fontSize="small" />
                    </IconButton>
                </Tooltip>

                <DeleteButton
                    onConfirm={onDelete}
                    size="small"
                    disabled={disabled}
                    IconProps={{ fontSize: 'small' }}
                />
            </Stack>
        </ListItem>
    );
};

const RequirementForm = ({ errors, requirements = [], onChange, disabled = false }) => {
    const [requirement, setRequirement] = useState({
        id: makeId(6),
        label: '',
        type: 'text',
        required: true,
        options: [],
        value: '',
        placeholder: '',
    });

    const [openAddRequirement, setOpenAddRequirement] = useState(false);

    const handleAddRequirement = () => {
        let newRequirements = [...requirements];
        let index = newRequirements.findIndex((item) => item.id === requirement.id);

        if (index === -1) {
            newRequirements.push(requirement);
        } else {
            newRequirements.splice(index, 1, requirement);
        }

        onChange(newRequirements);
        handleCloseRequirement();
    };

    const handleCloseRequirement = () => {
        setOpenAddRequirement(false);
        resetRequirement();
    };

    const handleRequirementChange = (key, value) => {
        setRequirement((prevState) => ({
            ...prevState,
            [key]: value,
        }));
    };

    const resetRequirement = () => {
        setRequirement({
            id: makeId(6),
            label: '',
            type: 'text',
            required: true,
            options: [],
            value: '',
            placeholder: '',
        });
    };

    const handleAddNewRequirement = () => {
        resetRequirement();
        setOpenAddRequirement(true);
    };

    const handleEditRequirement = (index) => () => {
        if (requirements && requirements[index]) {
            setRequirement({ ...requirements[index] });
        }
        setOpenAddRequirement(true);
    };

    const handleDeleteRequirement = (index) => () => {
        let newRequirements = [...requirements];
        newRequirements.splice(index, 1);
        onChange(newRequirements);
    };

    const handleDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id) return;
        const oldIndex = requirements.findIndex((r) => r.id.toString() === active.id);
        const newIndex = requirements.findIndex((r) => r.id.toString() === over.id);
        onChange(arrayMove(requirements, oldIndex, newIndex));
    };

    return (
        <>
            {/* Add field button and error message */}
            <Box sx={{ mb: 3, width: '100%' }}>
                <Stack
                    direction="row"
                    spacing={2}
                    sx={{ mb: 2, alignItems: 'center', justifyContent: 'space-between' }}
                >
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddNewRequirement}
                        color="primary"
                        disabled={disabled}
                    >
                        Add Field
                    </Button>

                    <Chip
                        label={`${requirements.length} ${requirements.length === 1 ? 'field' : 'fields'}`}
                        color="primary"
                        variant="outlined"
                        size="small"
                    />
                </Stack>

                {errors && errors['formData'] && (
                    <Alert severity="error" icon={<Warning />} sx={{ mb: 2 }}>
                        {errors['formData']}
                    </Alert>
                )}
            </Box>

            {requirements.length === 0 ? (
                <Paper
                    variant="outlined"
                    sx={{
                        p: 4,
                        textAlign: 'center',
                        borderStyle: 'dashed',
                        borderWidth: 1,
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        mb: 3,
                    }}
                >
                    <TextFields color="disabled" sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />

                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No Fields Added Yet
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 3, maxWidth: 450, mx: 'auto' }}
                    >
                        Add fields to create your form structure. You can include text fields,
                        checkboxes, number fields, and dropdown selects.
                    </Typography>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddNewRequirement}
                        disabled={disabled}
                    >
                        Add First Field
                    </Button>
                </Paper>
            ) : (
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext
                        items={requirements.map((f) => f.id.toString())}
                        strategy={verticalListSortingStrategy}
                    >
                        <Paper
                            variant="outlined"
                            sx={{
                                borderRadius: 1,
                                overflow: 'hidden',
                                mb: 3,
                            }}
                        >
                            <List disablePadding>
                                {requirements.map((field, index) => (
                                    <SortableRequirementItem
                                        key={field.id.toString()}
                                        field={field}
                                        index={index}
                                        disabled={disabled}
                                        requirements={requirements}
                                        onEdit={handleEditRequirement(index)}
                                        onDelete={handleDeleteRequirement(index)}
                                    />
                                ))}
                            </List>
                        </Paper>
                    </SortableContext>
                </DndContext>
            )}

            {/* Field dialog */}
            <AddRequirementForm
                data={requirement}
                setData={handleRequirementChange}
                open={openAddRequirement}
                onClose={handleCloseRequirement}
                onSubmit={handleAddRequirement}
                disabled={disabled}
            />
        </>
    );
};

export default RequirementForm;
