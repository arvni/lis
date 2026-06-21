import countries from '@/Data/Countries';
import SelectSearch from '@/Components/SelectSearch';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import Autocomplete from '@mui/material/Autocomplete';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import MappingIcon from '@mui/icons-material/Transform';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const headerCellSx = {
    fontWeight: 'bold',
    backgroundColor: 'primary.main',
    color: 'white',
};

const ColumnMappingStep = ({
    previewData,
    columnMapping,
    defaultValues,
    patientFields,
    errors,
    onMappingChange,
    onDefaultValueChange,
    onBack,
    onNext,
}) => (
    <>
        <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
                <MappingIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Map Excel Columns to Patient Fields
            </Typography>
            <Typography variant="body2" color="textSecondary">
                Total rows: {previewData.totalRows}
            </Typography>
        </Box>

        <TableContainer sx={{ maxHeight: 500 }}>
            <Table stickyHeader>
                <TableHead>
                    <TableRow>
                        <TableCell sx={headerCellSx}>Excel Column</TableCell>
                        <TableCell sx={headerCellSx}>Sample Data</TableCell>
                        <TableCell sx={headerCellSx}>Maps To Patient Field</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {previewData.columns.map((column, index) => (
                        <TableRow key={index} hover>
                            <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                    {column}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Box>
                                    {previewData.preview.slice(0, 3).map((row, rowIndex) => (
                                        <Typography
                                            key={rowIndex}
                                            variant="caption"
                                            display="block"
                                            sx={{
                                                color: 'text.secondary',
                                                fontStyle: 'italic',
                                            }}
                                        >
                                            {row[index] || '-'}
                                        </Typography>
                                    ))}
                                </Box>
                            </TableCell>
                            <TableCell>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Select Field</InputLabel>
                                    <Select
                                        value={columnMapping[index] || ''}
                                        onChange={(e) => onMappingChange(index, e.target.value)}
                                        label="Select Field"
                                    >
                                        <MenuItem value="">
                                            <em>Skip this column</em>
                                        </MenuItem>
                                        {patientFields.map((field) => (
                                            <MenuItem key={field.value} value={field.value}>
                                                {field.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>

        {errors.column_mapping && (
            <Alert severity="error" sx={{ mt: 2 }}>
                {errors.column_mapping}
            </Alert>
        )}

        {/* Default Values Section */}
        <Card sx={{ mt: 4 }}>
            <CardContent>
                <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: 'flex', alignItems: 'center' }}
                >
                    <SettingsIcon sx={{ mr: 1 }} />
                    Set Default Values for All Records
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    These values will be applied to all imported records
                </Typography>

                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={defaultValues?.research || false}
                                    onChange={(e) =>
                                        onDefaultValueChange('research', e.target.checked)
                                    }
                                    color="primary"
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="body1">Research Patient</Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        Mark all patients as research participants
                                    </Typography>
                                </Box>
                            }
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Autocomplete
                            fullWidth
                            size="small"
                            options={countries}
                            value={defaultValues?.nationality || null}
                            onChange={(e, newValue) => onDefaultValueChange('nationality', newValue)}
                            autoHighlight
                            getOptionLabel={(option) => option?.label || ''}
                            renderOption={(props, option) => (
                                <Box
                                    component="li"
                                    sx={{ '& > img': { mr: 2, flexShrink: 0 } }}
                                    {...props}
                                >
                                    <img
                                        loading="lazy"
                                        width="20"
                                        src={`https://flagcdn.com/w20/${option.code.toLowerCase()}.png`}
                                        srcSet={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png 2x`}
                                        alt=""
                                    />
                                    {option.label} ({option.code})
                                </Box>
                            )}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Default Nationality"
                                    placeholder="Select nationality"
                                    helperText="Leave empty if nationality is in Excel or not needed"
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Default Gender</InputLabel>
                            <Select
                                value={defaultValues?.gender || ''}
                                onChange={(e) => onDefaultValueChange('gender', e.target.value)}
                                label="Default Gender"
                            >
                                <MenuItem value="">
                                    <em>No Default</em>
                                </MenuItem>
                                <MenuItem value="male">Male</MenuItem>
                                <MenuItem value="female">Female</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                            fullWidth
                            label="Default Tribe"
                            value={defaultValues?.tribe || ''}
                            onChange={(e) => onDefaultValueChange('tribe', e.target.value)}
                            size="small"
                            helperText="Leave empty if not applicable"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                            fullWidth
                            label="Default Wilayat"
                            value={defaultValues?.wilayat || ''}
                            onChange={(e) => onDefaultValueChange('wilayat', e.target.value)}
                            size="small"
                            helperText="Leave empty if not applicable"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                            fullWidth
                            label="Default Village"
                            value={defaultValues?.village || ''}
                            onChange={(e) => onDefaultValueChange('village', e.target.value)}
                            size="small"
                            helperText="Leave empty if not applicable"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <SelectSearch
                            name="referrer"
                            value={defaultValues?.referrer || null}
                            label="Default Referrer"
                            fullWidth
                            size="small"
                            url={route('api.referrers.list')}
                            onChange={(e) => onDefaultValueChange('referrer', e.target.value)}
                            helperText="Select default referring facility/doctor for all patients"
                        />
                    </Grid>
                </Grid>

                <Alert severity="info" sx={{ mt: 3 }}>
                    <Typography variant="body2">
                        <strong>Note:</strong> Default values will only be used when the Excel file
                        doesn&apos;t contain data for these fields. If you map an Excel column to a
                        field, the Excel data will take priority.
                    </Typography>
                </Alert>
            </CardContent>
        </Card>

        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
                variant="outlined"
                onClick={onBack}
                sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                }}
            >
                Back
            </Button>
            <Button
                variant="contained"
                onClick={onNext}
                startIcon={<ArrowForwardIcon />}
                sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                }}
            >
                Next: Select Tests
            </Button>
        </Box>
    </>
);

export default ColumnMappingStep;
