import { Button, Chip, Stack, Tooltip, Typography } from '@mui/material';
import { Done as DoneIcon, Close as CloseIcon } from '@mui/icons-material';

const BulkActions = ({ selectionCount, isCompatible, onBulkDone, onBulkReject }) => {
    return (
        <Stack direction="row" spacing={2} alignItems="center">
            {selectionCount > 0 ? (
                <>
                    {!isCompatible && (
                        <Tooltip title="Selected items must have the same test and method for bulk actions">
                            <Chip
                                label="Incompatible Selection"
                                size="small"
                                color="error"
                                variant="outlined"
                                sx={{ fontWeight: 'bold' }}
                            />
                        </Tooltip>
                    )}
                    <Button
                        variant="contained"
                        startIcon={<DoneIcon />}
                        onClick={onBulkDone}
                        color="success"
                        size="small"
                        disabled={!isCompatible}
                        sx={{ borderRadius: 2, textTransform: 'none', px: 2 }}
                    >
                        Bulk Done ({selectionCount})
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<CloseIcon />}
                        onClick={onBulkReject}
                        color="error"
                        size="small"
                        disabled={!isCompatible}
                        sx={{ borderRadius: 2, textTransform: 'none', px: 2 }}
                    >
                        Bulk Reject ({selectionCount})
                    </Button>
                </>
            ) : (
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Select processing items for bulk actions
                </Typography>
            )}
        </Stack>
    );
};

export default BulkActions;
