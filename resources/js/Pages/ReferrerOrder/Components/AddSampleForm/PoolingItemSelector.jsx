import {
    Box,
    Stack,
    Typography,
    Checkbox,
    FormControlLabel,
    FormGroup,
    Collapse,
    IconButton,
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';

const PoolingItemSelector = ({
    barcode,
    index,
    expanded,
    allAcceptanceItems,
    onToggleExpand,
    onItemSelectionChange,
}) => (
    <Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
                {barcode.selectedItems?.length || 0} items selected
            </Typography>
            <IconButton size="small" onClick={() => onToggleExpand(index)}>
                {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
        </Stack>
        <Collapse in={expanded}>
            <FormGroup sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                {allAcceptanceItems.map((item) => (
                    <FormControlLabel
                        key={item.id}
                        control={
                            <Checkbox
                                size="small"
                                checked={barcode.selectedItems?.includes(item.id) || false}
                                onChange={() => onItemSelectionChange(index, item.id)}
                            />
                        }
                        label={
                            <Box>
                                <Typography variant="body2">
                                    {item.method?.test?.name || item.test?.name || 'Unknown Test'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Created:{' '}
                                    {item.created_at
                                        ? new Date(item.created_at).toLocaleDateString()
                                        : 'N/A'}
                                </Typography>
                            </Box>
                        }
                    />
                ))}
            </FormGroup>
        </Collapse>
        {(!barcode.selectedItems || barcode.selectedItems.length === 0) && (
            <Typography variant="caption" color="error">
                Please select at least one test
            </Typography>
        )}
    </Box>
);

export default PoolingItemSelector;
