import { useEffect, useState } from 'react';
import {
    alpha,
    Box,
    Button,
    FormHelperText,
    Grid,
    IconButton,
    Paper,
    Typography,
    useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import SelectSearch from '@/Components/SelectSearch';
import { EMPTY_PARAM } from './SectionForm/constants.js';
import StepLabel from './SectionForm/StepLabel.jsx';
import ParameterRow from './SectionForm/ParameterRow.jsx';
import ParameterEditor from './SectionForm/ParameterEditor.jsx';

const SectionForm = ({ sectionWorkflow, setSectionWorkflow, onSubmit, onClose }) => {
    const theme = useTheme();
    const [parameter, setParameter] = useState(EMPTY_PARAM);
    const [sectionErrors, setSectionErrors] = useState({});
    const [parameterErrors, setParameterErrors] = useState({});

    useEffect(() => {
        setParameter(EMPTY_PARAM);
        setSectionErrors({});
        setParameterErrors({});
    }, [sectionWorkflow.id]);

    /* ── Section handlers ── */
    const sectionGroupChange = (e) =>
        setSectionWorkflow((prev) => ({
            ...prev,
            section: { sectionGroup: e.target.value, name: '', id: '' },
        }));

    const sectionChange = (e) =>
        setSectionWorkflow((prev) => ({
            ...prev,
            section: { ...prev.section, ...e.target.value },
        }));

    /* ── Parameter handlers ── */
    const changeParam = (e) =>
        setParameter((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    const setParamType = (type) => setParameter((prev) => ({ ...prev, type, options: '' }));
    const toggleRequired = () => setParameter((prev) => ({ ...prev, required: !prev.required }));

    const checkParameter = () => {
        const err = {};
        if (!parameter.type) err.type = 'Select a type';
        if (!parameter.name) err.name = 'Enter a title';
        else if (
            sectionWorkflow.parameters.some(
                (p, i) => p.name === parameter.name && i !== parameter.index,
            )
        )
            err.name = 'Title must be unique';
        if (parameter.type === 'options') {
            const opts =
                parameter.options
                    ?.split(';')
                    .map((s) => s.trim())
                    .filter(Boolean) ?? [];
            if (new Set(opts).size < 2) err.options = 'Enter at least 2 different options';
        }
        setParameterErrors(err);
        return !Object.keys(err).length;
    };

    const saveParameter = () => {
        if (!checkParameter()) return;
        const { index, ...paramData } = parameter;
        const params = [...sectionWorkflow.parameters];
        if (index != null) params[index] = paramData;
        else params.push(paramData);
        setSectionWorkflow((prev) => ({ ...prev, parameters: params }));
        setParameter(EMPTY_PARAM);
        setSectionErrors({});
    };

    const deleteParameter = (i) => {
        const params = [...sectionWorkflow.parameters];
        params.splice(i, 1);
        setSectionWorkflow((prev) => ({ ...prev, parameters: params }));
        if (parameter.index === i) setParameter(EMPTY_PARAM);
    };

    const editParameter = (i) => {
        setParameter(
            parameter.index === i ? EMPTY_PARAM : { ...sectionWorkflow.parameters[i], index: i },
        );
    };

    const cancelEditParam = () => setParameter(EMPTY_PARAM);

    /* ── Form submit ── */
    const handleSubmit = () => {
        const err = {};
        if (!sectionWorkflow.section?.id) err.section = 'Please select a section';
        if (!sectionWorkflow.parameters.length) err.parameters = 'Add at least one parameter';
        setSectionErrors(err);
        if (!Object.keys(err).length) onSubmit();
    };

    const isEditMode = !!sectionWorkflow.section?.id && sectionWorkflow.parameters.length > 0;
    const isEditingParam = parameter.index != null;

    return (
        <Paper
            variant="outlined"
            sx={{
                mb: 2,
                borderRadius: 2,
                overflow: 'hidden',
                borderColor: 'primary.main',
                borderLeft: `4px solid ${theme.palette.primary.main}`,
            }}
        >
            {/* ── Header ── */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 2.5,
                    py: 1.5,
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    borderBottom: `1px solid ${theme.palette.divider}`,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HubOutlinedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                    <Typography variant="subtitle2" fontWeight={700}>
                        {isEditMode ? 'Edit Section' : 'Add Section to Pipeline'}
                    </Typography>
                </Box>
                <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            <Box sx={{ p: 2.5 }}>
                {/* ── Step 1: Section ── */}
                <StepLabel number={1}>Select Section</StepLabel>
                <Grid container spacing={2} sx={{ mb: 0.5 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <SelectSearch
                            value={sectionWorkflow?.section?.sectionGroup}
                            onChange={sectionGroupChange}
                            label="Section Group"
                            fullWidth
                            error={!!sectionErrors.section}
                            name="sectionGroup"
                            url={route('api.sectionGroups.list')}
                        />
                    </Grid>
                    {(sectionWorkflow?.section?.sectionGroup || sectionWorkflow?.section?.id) && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <SelectSearch
                                value={sectionWorkflow.section}
                                onChange={sectionChange}
                                fullWidth
                                label="Section"
                                defaultData={
                                    sectionWorkflow?.section?.sectionGroup?.id
                                        ? {
                                              section_group_id:
                                                  sectionWorkflow.section.sectionGroup.id,
                                          }
                                        : undefined
                                }
                                error={!!sectionErrors.section}
                                name="section"
                                url={route('api.sections.list')}
                            />
                        </Grid>
                    )}
                </Grid>
                {sectionErrors.section && (
                    <FormHelperText error sx={{ mb: 1.5 }}>
                        {sectionErrors.section}
                    </FormHelperText>
                )}

                {/* ── Divider ── */}
                <Box sx={{ my: 2.5, borderTop: `1px dashed ${theme.palette.divider}` }} />

                {/* ── Step 2: Parameters ── */}
                <StepLabel number={2}>Define Parameters</StepLabel>

                {/* Parameter list */}
                {sectionWorkflow.parameters.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2 }}>
                        {sectionWorkflow.parameters.map((p, i) => (
                            <ParameterRow
                                key={i}
                                param={p}
                                index={i}
                                isEditing={parameter.index === i}
                                onEdit={editParameter}
                                onDelete={deleteParameter}
                            />
                        ))}
                    </Box>
                ) : (
                    <Box
                        sx={{
                            mb: 2,
                            py: 2,
                            textAlign: 'center',
                            border: `1px dashed ${theme.palette.divider}`,
                            borderRadius: 1,
                            bgcolor: alpha(theme.palette.action.hover, 0.3),
                        }}
                    >
                        <TuneIcon
                            sx={{
                                fontSize: 28,
                                color: alpha(theme.palette.text.secondary, 0.3),
                                mb: 0.5,
                            }}
                        />
                        <Typography variant="caption" color="text.disabled" display="block">
                            No parameters yet — add one below
                        </Typography>
                    </Box>
                )}
                {sectionErrors.parameters && (
                    <FormHelperText error sx={{ mb: 1.5, mt: -1 }}>
                        {sectionErrors.parameters}
                    </FormHelperText>
                )}

                {/* ── Parameter editor ── */}
                <ParameterEditor
                    parameter={parameter}
                    parameterErrors={parameterErrors}
                    isEditingParam={isEditingParam}
                    editingName={sectionWorkflow.parameters[parameter.index]?.name}
                    onChangeParam={changeParam}
                    onSetParamType={setParamType}
                    onToggleRequired={toggleRequired}
                    onSave={saveParameter}
                    onCancelEdit={cancelEditParam}
                />

                {/* ── Footer ── */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2.5 }}>
                    <Button variant="text" onClick={onClose} color="inherit">
                        Cancel
                    </Button>
                    <Button variant="contained" disableElevation onClick={handleSubmit}>
                        {isEditMode ? 'Update Section' : 'Add to Pipeline'}
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
};

export default SectionForm;
