import {
    alpha,
    Box,
    Button,
    Chip,
    FormControlLabel,
    Grid,
    Switch,
    TextField,
    Typography,
    useTheme,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined';
import { PARAM_TYPES, TYPE_COLOR } from './constants.js';

const ParameterEditor = ({
    parameter,
    parameterErrors,
    isEditingParam,
    editingName,
    onChangeParam,
    onSetParamType,
    onToggleRequired,
    onSave,
    onCancelEdit,
}) => {
    const theme = useTheme();
    return (
        <Box
            sx={{
                p: 2,
                borderRadius: 1.5,
                bgcolor: isEditingParam
                    ? alpha(theme.palette.primary.main, 0.04)
                    : alpha(theme.palette.action.hover, 0.4),
                border: '1px solid',
                borderColor: isEditingParam ? 'primary.light' : 'divider',
                transition: 'all 0.2s ease',
            }}
        >
            <Typography
                variant="caption"
                fontWeight={600}
                color="text.secondary"
                display="block"
                sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
                {isEditingParam ? `Editing: ${editingName}` : 'New Parameter'}
            </Typography>

            <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                <Grid size={{ xs: 12, sm: 'auto' }} sx={{ flex: '1 1 180px' }}>
                    <TextField
                        label="Parameter name"
                        fullWidth
                        size="small"
                        name="name"
                        value={parameter.name}
                        onChange={onChangeParam}
                        error={!!parameterErrors.name}
                        helperText={parameterErrors.name}
                        placeholder="e.g. blood_pressure"
                    />
                </Grid>
                {parameter.type === 'options' && (
                    <Grid size={{ xs: 12, sm: 'auto' }} sx={{ flex: '1 1 200px' }}>
                        <TextField
                            label="Options"
                            fullWidth
                            size="small"
                            name="options"
                            value={parameter.options ?? ''}
                            onChange={onChangeParam}
                            error={!!parameterErrors.options}
                            helperText={parameterErrors.options ?? "separate with ';'"}
                            placeholder="Low;Normal;High"
                        />
                    </Grid>
                )}
            </Grid>

            {/* Type chips */}
            <Box sx={{ mb: 1.5 }}>
                <Typography
                    variant="caption"
                    color={parameterErrors.type ? 'error' : 'text.disabled'}
                    sx={{ display: 'block', mb: 0.75, fontWeight: 600 }}
                >
                    Type {parameterErrors.type ? `— ${parameterErrors.type}` : ''}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {PARAM_TYPES.map((t) => (
                        <Chip
                            key={t.value}
                            label={t.label}
                            size="small"
                            clickable
                            onClick={() => onSetParamType(t.value)}
                            color={parameter.type === t.value ? TYPE_COLOR[t.value] : 'default'}
                            variant={parameter.type === t.value ? 'filled' : 'outlined'}
                            sx={{
                                fontWeight: parameter.type === t.value ? 700 : 400,
                                transition: 'all 0.15s ease',
                            }}
                        />
                    ))}
                </Box>
            </Box>

            {/* Required + actions */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1,
                }}
            >
                <FormControlLabel
                    control={
                        <Switch
                            size="small"
                            checked={parameter.required}
                            onChange={onToggleRequired}
                        />
                    }
                    label={
                        <Typography variant="caption" fontWeight={500}>
                            Required
                        </Typography>
                    }
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {isEditingParam && (
                        <Button size="small" onClick={onCancelEdit} startIcon={<CloseIcon />}>
                            Cancel edit
                        </Button>
                    )}
                    <Button
                        size="small"
                        variant="contained"
                        disableElevation
                        onClick={onSave}
                        startIcon={isEditingParam ? <CheckIcon /> : <AddCircleOutlineIcon />}
                    >
                        {isEditingParam ? 'Update' : 'Add parameter'}
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default ParameterEditor;
