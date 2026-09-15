import React from 'react';
import { useForm } from '@inertiajs/react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormHelperText,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

export const LAYOUTS = [
    { layout: 'One column', headings: 'Employee ID · Date and Time' },
    { layout: 'Two columns', headings: 'Employee ID · Date · Time' },
    {
        layout: 'All three',
        headings: 'Employee ID · Access Date and Time · Access Date · Access Time',
    },
];

const ImportForm = ({ open, onClose }) => {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        file: null,
    });

    const handleClose = () => {
        if (processing) return;
        reset();
        clearErrors();
        onClose();
    };

    const handleFileChange = (e) => {
        setData('file', e.target.files?.[0] ?? null);
        clearErrors('file');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('attendance.transactions.import'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>Import Punches</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Adds door punches from an Excel or CSV export, e.g. for days HikCentral
                        could not reach the LIS. The first sheet is read; report title rows above
                        the headings and extra columns are fine.
                    </Typography>

                    <Table size="small" sx={{ mb: 2 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Layout</TableCell>
                                <TableCell>Headings, e.g.</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {LAYOUTS.map(({ layout, headings }) => (
                                <TableRow key={layout}>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{layout}</TableCell>
                                    <TableCell>{headings}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <Alert severity="info" sx={{ mb: 2 }}>
                        Dates can be Excel dates or text written year-first (2026-09-14 08:11) or
                        day-first (14/09/2026 8:11 AM). Punches already stored are skipped, so
                        importing the same file twice is safe. Attendance for those days is
                        recalculated afterwards.
                    </Alert>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            component="label"
                            variant="outlined"
                            startIcon={<UploadFileIcon />}
                            disabled={processing}
                        >
                            Choose file
                            <input
                                type="file"
                                hidden
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileChange}
                                data-testid="punches-file"
                            />
                        </Button>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                            {data.file ? data.file.name : '.xlsx, .xls or .csv, up to 5 MB'}
                        </Typography>
                    </Box>
                    {errors.file && <FormHelperText error>{errors.file}</FormHelperText>}
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleClose} disabled={processing}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={!data.file || processing}
                        startIcon={processing && <CircularProgress size={20} color="inherit" />}
                    >
                        {processing ? 'Importing…' : 'Import'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default ImportForm;
