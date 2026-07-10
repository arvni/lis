import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Chip,
    Stack,
    Typography,
} from '@mui/material';
import { Add, ExpandMore, Science } from '@mui/icons-material';
import SampleRow from '../SampleRow';

/**
 * The per-test sample-configuration accordion: one item's samples with
 * add/remove controls, error-highlighted when its fields failed validation.
 */
const TestSampleAccordion = ({
    item,
    itemIndex,
    errors,
    patient,
    expanded,
    onToggle,
    onSampleChange,
    onAddSample,
    onRemoveSample,
}) => {
    const sampleTypes = item.method_test?.method?.test?.sample_types || [];
    const patientCount = item.method_test?.method?.no_patient || 1;
    const maxS = item.method_test?.method?.no_sample || 1;
    const itemSamples = item.samples || [];
    const hasErr = Object.keys(errors).some((k) => k.startsWith(`item${itemIndex}`));

    return (
        <Accordion
            expanded={expanded}
            onChange={onToggle}
            elevation={1}
            sx={{
                mb: 0.5,
                borderRadius: '8px !important',
                '&:before': { display: 'none' },
                border: hasErr ? '1px solid' : 'none',
                borderColor: 'error.main',
            }}
        >
            <AccordionSummary
                expandIcon={<ExpandMore />}
                sx={{ bgcolor: hasErr ? 'error.50' : 'grey.50' }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Science fontSize="small" color={hasErr ? 'error' : 'action'} />
                    <Typography variant="body2" fontWeight="medium">
                        {item.method_test?.method?.test?.name}
                    </Typography>
                    <Chip label={item.method_test?.method?.name} size="small" variant="outlined" />
                    {itemSamples.length > 0 && (
                        <Chip
                            label={`${itemSamples.length}/${maxS} samples`}
                            size="small"
                            color="primary"
                        />
                    )}
                </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 1 }}>
                <Stack spacing={1.5}>
                    {itemSamples.map((sample, si) => (
                        <SampleRow
                            key={si}
                            sample={sample}
                            sampleIndex={si}
                            sampleTypes={sampleTypes}
                            patientCount={patientCount}
                            errors={Object.fromEntries(
                                Object.entries(errors)
                                    .filter(([k]) => k.startsWith(`item${itemIndex}.s${si}`))
                                    .map(([k, v]) => [k.replace(`item${itemIndex}.`, ''), v]),
                            )}
                            patient={patient}
                            onChange={(si2, field, value, pi) =>
                                onSampleChange(item.id, si2, field, value, pi)
                            }
                            onRemove={(si2) => onRemoveSample(item.id, si2)}
                            canRemove={itemSamples.length > 1}
                        />
                    ))}
                    {itemSamples.length < maxS && (
                        <Button
                            size="small"
                            startIcon={<Add />}
                            onClick={() => onAddSample(item.id)}
                            variant="outlined"
                            sx={{ alignSelf: 'flex-start' }}
                        >
                            Add Sample
                        </Button>
                    )}
                    {itemSamples.length === 0 && (
                        <Button
                            size="small"
                            startIcon={<Add />}
                            onClick={() => onAddSample(item.id)}
                            variant="contained"
                            sx={{ alignSelf: 'flex-start' }}
                        >
                            Configure Sample
                        </Button>
                    )}
                </Stack>
            </AccordionDetails>
        </Accordion>
    );
};

export default TestSampleAccordion;
