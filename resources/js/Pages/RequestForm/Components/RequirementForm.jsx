import React, { useState } from "react";
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
    ListItemIcon
} from "@mui/material";
import {
    Add as AddIcon,
    Edit as EditIcon,
    DragIndicator,
    TextFields,
    CheckBox,
    List as ListIcon,
    Numbers,
    Warning
} from "@mui/icons-material";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import DeleteButton from "@/Components/DeleteButton";
import AddRequirementForm from "./AddRequirementForm";
import {makeId} from "@/Services/helper.js";


/**
 * RequirementForm component
 * Allows adding and managing form fields
 *
 * @param {Object} props Component props
 * @param {Object} props.errors Validation errors
 * @param {Array} props.requirements Requirements list
 * @param {Function} props.onChange Update requirements handler
 * @param {boolean} props.disabled Whether component is disabled
 * @returns {JSX.Element} Rendered component
 */
const RequirementForm = ({ errors, requirements = [], onChange, disabled = false }) => {
    // Initialize form field state
    const [requirement, setRequirement] = useState({
        id: makeId(6),
        label: "",
        type: "text",
        required: true,
        options: [],
        value: "",
        placeholder: ""
    });

    // State for field dialog
    const [openAddRequirement, setOpenAddRequirement] = useState(false);

    /**
     * Add or update requirement
     */
    const handleAddRequirement = () => {
        let newRequirements = [...requirements];
        let index = newRequirements.findIndex((item) => item.id === requirement.id);

        if (index === -1) {
            // Add new requirement
            newRequirements.push(requirement);
        } else {
            // Update existing requirement
            newRequirements.splice(index, 1, requirement);
        }

        onChange(newRequirements);
        handleCloseRequirement();
    };

    /**
     * Close the add requirement dialog
     */
    const handleCloseRequirement = () => {
        setOpenAddRequirement(false);
        resetRequirement();
    };

    /**
     * Update requirement field
     *
     * @param {string} key Field key
     * @param {any} value Field value
     */
    const handleRequirementChange = (key, value) => {
        setRequirement((prevState) => ({
            ...prevState,
            [key]: value
        }));
    };

    /**
     * Reset requirement form
     */
    const resetRequirement = () => {
        setRequirement({
            id: makeId(6),
            label: "",
            type: "text",
            required: true,
            options: [],
            value: "",
            placeholder: ""
        });
    };

    /**
     * Open add requirement dialog
     */
    const handleAddNewRequirement = () => {
        resetRequirement();
        setOpenAddRequirement(true);
    };

    /**
     * Edit existing requirement
     *
     * @param {number} index Requirement index
     * @returns {Function} Click handler
     */
    const handleEditRequirement = (index) => () => {
        if (requirements && requirements[index]) {
            setRequirement({...requirements[index]});
        }
        setOpenAddRequirement(true);
    };

    /**
     * Delete requirement
     *
     * @param {number} index Requirement index
     * @returns {Function} Click handler
     */
    const handleDeleteRequirement = (index) => () => {
        let newRequirements = [...requirements];
        newRequirements.splice(index, 1);
        onChange(newRequirements);
    };

    /**
     * Handle drag and drop reordering
     *
     * @param {Object} result Drag result
     */
    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const reorderedItems = Array.from(requirements);
        const [removed] = reorderedItems.splice(result.source.index, 1);
        reorderedItems.splice(result.destination.index, 0, removed);

        onChange(reorderedItems);
    };

    /**
     * Get field type icon
     *
     * @param {string} type Field type
     * @returns {JSX.Element} Icon component
     */
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

    /**
     * Get field type label
     *
     * @param {string} type Field type
     * @returns {string} Type label
     */
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

    return (
        <>
            {/* Add field button and error message */}
            <Box sx={{ mb: 3,width:"100%"}}>
                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 2 }}
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
                    <Alert
                        severity="error"
                        icon={<Warning />}
                        sx={{ mb: 2 }}
                    >
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
                        mb: 3
                    }}
                >
                    <TextFields color="disabled" sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />

                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No Fields Added Yet
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 450, mx: 'auto' }}>
                        Add fields to create your form structure. You can include text fields, checkboxes, number fields, and dropdown selects.
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
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="fields-list">
                        {(provided) => (
                            <Paper
                                variant="outlined"
                                sx={{
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    mb: 3
                                }}
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                            >
                                <List disablePadding>
                                    {requirements.map((field, index) => (
                                        <Draggable
                                            key={field.id.toString()}
                                            draggableId={field.id.toString()}
                                            index={index}
                                            isDragDisabled={disabled}
                                        >
                                            {(provided, snapshot) => (
                                                <ListItem
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    divider={index < requirements.length - 1}
                                                    sx={{
                                                        bgcolor: snapshot.isDragging ? 'rgba(25, 118, 210, 0.08)' : 'background.paper',
                                                        '&:hover': {
                                                            bgcolor: 'rgba(25, 118, 210, 0.04)',
                                                        },
                                                        transition: 'background-color 0.2s'
                                                    }}
                                                >
                                                    {/* Drag handle */}
                                                    <ListItemIcon
                                                        {...provided.dragHandleProps}
                                                        sx={{
                                                            cursor: disabled ? 'default' : 'grab',
                                                            color: 'text.secondary',
                                                            '&:hover': {
                                                                color: disabled ? 'text.secondary' : 'primary.main'
                                                            }
                                                        }}
                                                    >
                                                        <DragIndicator />
                                                    </ListItemIcon>

                                                    {/* Field number and type icon */}
                                                    <ListItemAvatar>
                                                        <Avatar
                                                            sx={{
                                                                bgcolor: field.required ? 'primary.main' : 'grey.200',
                                                                color: field.required ? 'primary.contrastText' : 'text.primary'
                                                            }}
                                                        >
                                                            {index + 1}
                                                        </Avatar>
                                                    </ListItemAvatar>

                                                    {/* Field information */}
                                                    <ListItemText
                                                        primary={
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Typography variant="subtitle2">
                                                                    {field.label}
                                                                </Typography>
                                                                {field.required && (
                                                                    <Chip
                                                                        label="Required"
                                                                        size="small"
                                                                        color="error"
                                                                        variant="outlined"
                                                                    />
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
                                                                        '& .MuiChip-icon': { fontSize: 16 }
                                                                    }}
                                                                />

                                                                {field.placeholder && (
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        Placeholder: "{field.placeholder}"
                                                                    </Typography>
                                                                )}

                                                                {field.type === 'select' && field.options && field.options.length > 0 && (
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        Options: {field.options.join(", ")}
                                                                    </Typography>
                                                                )}
                                                            </Stack>
                                                        }
                                                    />

                                                    {/* Action buttons */}
                                                    <Stack direction="row" spacing={1}>
                                                        <Tooltip title="Edit Field">
                                                            <IconButton
                                                                color="primary"
                                                                onClick={handleEditRequirement(index)}
                                                                size="small"
                                                                disabled={disabled}
                                                            >
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>

                                                        <DeleteButton
                                                            onConfirm={handleDeleteRequirement(index)}
                                                            size="small"
                                                            disabled={disabled}
                                                            IconProps={{ fontSize: 'small' }}
                                                        />
                                                    </Stack>
                                                </ListItem>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </List>
                            </Paper>
                        )}
                    </Droppable>
                </DragDropContext>
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
