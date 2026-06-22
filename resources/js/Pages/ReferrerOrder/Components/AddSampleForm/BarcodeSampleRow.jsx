import {
    Box,
    Stack,
    Typography,
    Chip,
    Select,
    MenuItem,
    TableCell,
    TableRow,
    TextField,
} from '@mui/material';
import PoolingItemSelector from './PoolingItemSelector';
import { getAvailableSampleTypes, getFilteredSamples } from './helpers';

const BarcodeSampleRow = ({
    barcode,
    index,
    isPooling,
    expanded,
    allAcceptanceItems,
    samples,
    now,
    onToggleExpand,
    onItemSelectionChange,
    onSampleTypeChange,
    onSampleChange,
    onReceivedDateChange,
}) => {
    const filteredSamples = getFilteredSamples(samples, barcode.sampleType);

    return (
        <TableRow>
            <TableCell
                rowSpan={barcode?.items?.length || 1}
                sx={{ verticalAlign: 'top', bgcolor: 'primary.50', fontWeight: 'medium' }}
            >
                <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                    {barcode.barcodeGroup.name}
                </Typography>
            </TableCell>

            {isPooling && (
                <TableCell sx={{ verticalAlign: 'top' }}>
                    <PoolingItemSelector
                        barcode={barcode}
                        index={index}
                        expanded={expanded}
                        allAcceptanceItems={allAcceptanceItems}
                        onToggleExpand={onToggleExpand}
                        onItemSelectionChange={onItemSelectionChange}
                    />
                </TableCell>
            )}

            <TableCell sx={{ verticalAlign: 'top' }}>
                <Stack spacing={1}>
                    {barcode.items?.map((item) => (
                        <Box key={`test-${item.id || item.method?.id}`}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {item.method?.test?.name || item.test?.name || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Method: {item.method?.name || 'N/A'}
                            </Typography>
                        </Box>
                    ))}
                </Stack>
            </TableCell>

            <TableCell sx={{ verticalAlign: 'top' }}>
                <Stack spacing={1}>
                    {barcode.items.map((item) => (
                        <Box key={`sample-types-${item.method.id}`}>
                            {item.method.test.sample_types.map((sampleType) => (
                                <Chip
                                    key={sampleType.id}
                                    label={`${sampleType.name}${sampleType.pivot.description ? ` (${sampleType.pivot.description})` : ''}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ mr: 0.5, mb: 0.5 }}
                                />
                            ))}
                        </Box>
                    ))}
                </Stack>
            </TableCell>

            <TableCell sx={{ verticalAlign: 'top' }}>
                <Select
                    fullWidth
                    size="small"
                    onChange={onSampleTypeChange(index)}
                    value={barcode.sampleType || ''}
                    displayEmpty
                    error={!barcode.sampleType}
                >
                    <MenuItem value="">
                        <em>Select sample type</em>
                    </MenuItem>
                    {getAvailableSampleTypes(barcode).map((sampleType) => (
                        <MenuItem key={`sample-type-${sampleType.id}`} value={sampleType.id}>
                            {sampleType.name}
                        </MenuItem>
                    ))}
                </Select>
            </TableCell>

            <TableCell sx={{ verticalAlign: 'top' }}>
                <Select
                    fullWidth
                    size="small"
                    onChange={onSampleChange(index)}
                    value={barcode?.sample?.id || ''}
                    displayEmpty
                    disabled={!barcode.sampleType}
                    error={!barcode.sample}
                >
                    <MenuItem value="">
                        <em>Select sample</em>
                    </MenuItem>
                    {filteredSamples?.map((sample) => (
                        <MenuItem key={`sample-${sample.id}`} value={sample.id}>
                            <Box>
                                <Typography variant="body2">
                                    {sample.sample_type?.name}
                                    {sample.sampleId && ` | ${sample.sampleId}`}
                                </Typography>
                                {sample.collection_date && (
                                    <Typography variant="caption" color="text.secondary">
                                        Collected:{' '}
                                        {new Date(sample.collection_date).toLocaleDateString()}
                                    </Typography>
                                )}
                            </Box>
                        </MenuItem>
                    ))}
                </Select>
                {barcode.sampleType && !filteredSamples?.length && (
                    <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                        No samples available for this type
                    </Typography>
                )}
            </TableCell>

            <TableCell sx={{ verticalAlign: 'top' }}>
                {barcode.sample && (
                    <Box sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Stack spacing={0.5}>
                            <Box display="flex" sx={{ alignItems: 'center' }}>
                                <Typography
                                    variant="caption"
                                    sx={{ fontWeight: 'medium', minWidth: 80 }}
                                >
                                    Type:
                                </Typography>
                                <Typography variant="caption">
                                    {barcode.sample.sample_type?.name}
                                </Typography>
                            </Box>
                            {barcode.collectionDate && (
                                <Box display="flex" sx={{ alignItems: 'center' }}>
                                    <Typography
                                        variant="caption"
                                        sx={{ fontWeight: 'medium', minWidth: 80 }}
                                    >
                                        Collected:
                                    </Typography>
                                    <Typography variant="caption">
                                        {new Date(barcode.collectionDate).toLocaleString()}
                                    </Typography>
                                </Box>
                            )}
                            {barcode.sample.sampleId && (
                                <Box display="flex" sx={{ alignItems: 'center' }}>
                                    <Typography
                                        variant="caption"
                                        sx={{ fontWeight: 'medium', minWidth: 80 }}
                                    >
                                        Barcode:
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                                        {barcode.sample.sampleId}
                                    </Typography>
                                </Box>
                            )}
                        </Stack>
                    </Box>
                )}
            </TableCell>

            <TableCell sx={{ verticalAlign: 'top' }}>
                <TextField
                    fullWidth
                    size="small"
                    type="datetime-local"
                    label="Received Date & Time"
                    value={barcode.received_at || ''}
                    onChange={onReceivedDateChange(index)}
                    slotProps={{
                        htmlInput: {
                            max: now,
                            min: barcode.collectionDate
                                ? new Date(barcode.collectionDate).toISOString().slice(0, 16)
                                : undefined,
                        },
                        inputLabel: { shrink: true },
                    }}
                    error={
                        !barcode.received_at ||
                        (barcode.collectionDate &&
                            new Date(barcode.collectionDate) > new Date(barcode.received_at))
                    }
                    helperText={
                        !barcode.received_at
                            ? 'Required field'
                            : barcode.collectionDate &&
                                new Date(barcode.collectionDate) > new Date(barcode.received_at)
                              ? 'Must be after collection date'
                              : ''
                    }
                />
            </TableCell>
        </TableRow>
    );
};

export default BarcodeSampleRow;
