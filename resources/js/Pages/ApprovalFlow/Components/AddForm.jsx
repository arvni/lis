import {
    TextField,
    FormControlLabel,
    Checkbox,
    Paper,
    Box,
    Tooltip,
    Alert,
    Stack,
    Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlined';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

import SelectSearch from '@/Components/SelectSearch';
import { FormProvider, useFormState } from '@/Components/FormTemplate.jsx';

const emptyStep = () => ({
    name: '',
    role: null,
    user: null,
    allow_self_approval: false,
});

const AddForm = ({ open, onClose, defaultValue }) => {
    const url = defaultValue?.id
        ? route('approvalFlows.update', defaultValue.id)
        : route('approvalFlows.store');
    const defaultData = {
        name: '',
        description: '',
        active: true,
        steps: [emptyStep()],
        ...defaultValue,
    };

    return (
        <FormProvider
            open={open}
            onClose={onClose}
            defaultValue={defaultData}
            generalTitle="Approval Flow"
            url={url}
            maxWidth="md"
        >
            <FormContent />
        </FormProvider>
    );
};

const FormContent = () => {
    const { data, setData, errors } = useFormState();
    const handleChange = (e) =>
        setData((prevState) => ({ ...prevState, [e.target.name]: e.target.value }));

    const handleStepChange = (index, field, value) => {
        const updatedSteps = [...data.steps];
        updatedSteps[index] = {
            ...updatedSteps[index],
            [field]: value,
        };
        setData((prevState) => ({ ...prevState, steps: updatedSteps }));
    };

    const addStep = () => {
        setData((prevState) => ({ ...prevState, steps: [...prevState.steps, emptyStep()] }));
    };

    const removeStep = (index) => {
        const updatedSteps = [...data.steps];
        updatedSteps.splice(index, 1);
        setData((prevState) => ({ ...prevState, steps: updatedSteps }));
    };

    const moveStep = (index, direction) => {
        const updatedSteps = [...data.steps];
        const target = index + direction;
        if (target < 0 || target >= updatedSteps.length) return;
        [updatedSteps[index], updatedSteps[target]] = [updatedSteps[target], updatedSteps[index]];
        setData((prevState) => ({ ...prevState, steps: updatedSteps }));
    };

    return (
        <Stack spacing={3} sx={{ width: '100%' }}>
            {/* Basic Information Section */}
            <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0' }}>
                <Typography variant="h6" gutterBottom color="primary">
                    Basic Information
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 8 }}>
                        <TextField
                            fullWidth
                            label="Flow Name"
                            name="name"
                            onChange={handleChange}
                            value={data?.name || ''}
                            error={Boolean(errors?.name)}
                            helperText={errors?.name}
                            required
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex', alignItems: 'center' }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={Boolean(data?.active)}
                                    onChange={(e) =>
                                        setData((prevState) => ({
                                            ...prevState,
                                            active: e.target.checked,
                                        }))
                                    }
                                />
                            }
                            label="Active"
                        />
                    </Grid>
                    <Grid size={12}>
                        <TextField
                            fullWidth
                            multiline
                            minRows={2}
                            label="Description"
                            name="description"
                            onChange={handleChange}
                            value={data?.description || ''}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Steps Section */}
            <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0' }}>
                <Box
                    display="flex"
                    mb={1}
                    sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                >
                    <Typography variant="h6" color="primary">
                        Approval Steps
                    </Typography>
                    <Tooltip title="Reports are approved step by step, top to bottom. Bind a step to a role or a specific user; leave both empty to allow anyone with the Approve Report permission.">
                        <IconButton size="small">
                            <HelpOutlineIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Alert severity="info" sx={{ mb: 3 }}>
                    The last step is the final sign-off: its approver uploads the published PDF and
                    is recorded as the report&apos;s approver.
                </Alert>

                {data?.steps?.map((step, index) => (
                    <Paper
                        key={index}
                        elevation={0}
                        sx={{
                            p: 2,
                            mb: 2,
                            border: '1px solid #e0e0e0',
                            borderLeft: '4px solid',
                            borderLeftColor:
                                index === data.steps.length - 1 ? 'primary.main' : 'grey.300',
                            borderRadius: 1,
                        }}
                    >
                        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                            <Grid size={12} container>
                                <Grid size={{ xs: 12, sm: 8 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Step #{index + 1}
                                        {index === data.steps.length - 1 && (
                                            <Chip
                                                label="Final sign-off"
                                                size="small"
                                                color="primary"
                                                sx={{ ml: 1 }}
                                            />
                                        )}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }} sx={{ textAlign: 'right' }}>
                                    <Tooltip title="Move up" placement="top">
                                        <span>
                                            <IconButton
                                                size="small"
                                                disabled={index === 0}
                                                onClick={() => moveStep(index, -1)}
                                            >
                                                <ArrowUpwardIcon fontSize="small" />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Tooltip title="Move down" placement="top">
                                        <span>
                                            <IconButton
                                                size="small"
                                                disabled={index === data.steps.length - 1}
                                                onClick={() => moveStep(index, 1)}
                                            >
                                                <ArrowDownwardIcon fontSize="small" />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Tooltip
                                        title={
                                            data.steps.length <= 1
                                                ? 'At least one step is required'
                                                : 'Remove step'
                                        }
                                        placement="top"
                                    >
                                        <span>
                                            <IconButton
                                                color="error"
                                                onClick={() => removeStep(index)}
                                                disabled={data.steps.length <= 1}
                                                size="small"
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </Grid>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Step Name"
                                    value={step.name || ''}
                                    onChange={(e) =>
                                        handleStepChange(index, 'name', e.target.value)
                                    }
                                    placeholder="e.g., Technical Review"
                                    error={Boolean(errors?.[`steps.${index}.name`])}
                                    helperText={errors?.[`steps.${index}.name`]}
                                    required
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={Boolean(step.allow_self_approval)}
                                            onChange={(e) =>
                                                handleStepChange(
                                                    index,
                                                    'allow_self_approval',
                                                    e.target.checked,
                                                )
                                            }
                                        />
                                    }
                                    label="Allow reporter to approve own report"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <SelectSearch
                                    onChange={(e) =>
                                        handleStepChange(index, 'role', e.target.value)
                                    }
                                    name={`steps.${index}.role`}
                                    label="Restrict to Role (optional)"
                                    value={step.role}
                                    url={route('api.roles.list')}
                                    fullWidth
                                    disabled={Boolean(step.user)}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <SelectSearch
                                    onChange={(e) =>
                                        handleStepChange(index, 'user', e.target.value)
                                    }
                                    name={`steps.${index}.user`}
                                    label="Restrict to User (optional)"
                                    value={step.user}
                                    url={route('api.users.list')}
                                    fullWidth
                                    disabled={Boolean(step.role)}
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                ))}

                <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={addStep}
                        sx={{ px: 3 }}
                    >
                        Add New Step
                    </Button>
                </Box>
            </Paper>
        </Stack>
    );
};

export default AddForm;
