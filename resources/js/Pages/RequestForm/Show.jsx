import { Head } from '@inertiajs/react';
import {
    Box,
    Button,
    Checkbox,
    Divider,
    FormControlLabel,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';

// A blank line for the respondent to write on when printed.
const BlankLine = ({ height = 28 }) => (
    <Box
        sx={{
            borderBottom: '1px solid',
            borderColor: 'text.primary',
            height,
            mt: 0.5,
            width: '100%',
        }}
    />
);

const FieldBlock = ({ field }) => {
    // "description" fields are section headings/labels, not inputs.
    if (field.type === 'description') {
        return (
            <Box sx={{ mt: 3, mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                    {field.label}
                </Typography>
                <Divider sx={{ mt: 0.5 }} />
            </Box>
        );
    }

    const isSelect =
        field.type === 'select' && Array.isArray(field.options) && field.options.length > 0;

    return (
        <Box sx={{ mb: 2.5, breakInside: 'avoid' }}>
            <Typography variant="body2" fontWeight={600}>
                {field.label}
                {field.required ? ' *' : ''}
            </Typography>

            {field.type === 'checkbox' && (
                <FormControlLabel
                    control={<Checkbox disabled />}
                    label={field.placeholder || field.label}
                    sx={{ '& .MuiFormControlLabel-label.Mui-disabled': { color: 'text.primary' } }}
                />
            )}

            {isSelect && (
                <Stack sx={{ mt: 0.5 }}>
                    {field.options.map((option, i) => (
                        <FormControlLabel
                            key={`${option}-${i}`}
                            control={<Checkbox disabled />}
                            label={option}
                            sx={{
                                '& .MuiFormControlLabel-label.Mui-disabled': {
                                    color: 'text.primary',
                                },
                            }}
                        />
                    ))}
                </Stack>
            )}

            {!isSelect && field.type !== 'checkbox' && <BlankLine />}
        </Box>
    );
};

export default function RequestFormShow({ requestForm }) {
    const fields = Array.isArray(requestForm?.form_data) ? requestForm.form_data : [];
    const tests = Array.isArray(requestForm?.tests) ? requestForm.tests : [];
    const testNames = tests.map((t) => t?.name ?? t?.fullName ?? t?.full_name).filter(Boolean);

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
            <Head title={`${requestForm?.name ?? 'Request Form'} — Print`} />

            <Box sx={{ maxWidth: 800, mx: 'auto', px: 2 }}>
                <Stack
                    direction="row"
                    justifyContent="flex-end"
                    sx={{ mb: 2, '@media print': { display: 'none' } }}
                >
                    <Button
                        variant="contained"
                        startIcon={<PrintIcon />}
                        onClick={() => window.print()}
                    >
                        Print
                    </Button>
                </Stack>

                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        border: '1px solid',
                        borderColor: 'divider',
                        '@media print': { border: 'none', p: 0 },
                    }}
                >
                    <Typography variant="h5" align="center" fontWeight={700} gutterBottom>
                        {requestForm?.name}
                    </Typography>

                    {testNames.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" fontWeight={600}>
                                Requested Tests
                            </Typography>
                            <Typography variant="body2">{testNames.join(', ')}</Typography>
                        </Box>
                    )}

                    <Divider sx={{ mb: 3 }} />

                    {fields.length > 0 ? (
                        fields.map((field, i) => <FieldBlock key={field?.id ?? i} field={field} />)
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            This form has no fields.
                        </Typography>
                    )}
                </Paper>
            </Box>
        </Box>
    );
}
