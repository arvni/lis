import { Box, Button, Grid as Grid, Typography } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';

const BulkActionBar = ({
    selectedIds,
    notifications,
    onSelectAll,
    onMarkAsRead,
    onMarkAsUnread,
    onDelete,
}) => (
    <Box
        sx={{
            p: 2,
            bgcolor: 'action.selected',
            borderBottom: 1,
            borderColor: 'divider',
        }}
    >
        <Grid container spacing={1} sx={{ alignItems: 'center' }}>
            <Grid>
                <Typography variant="body2">{selectedIds.length} selected</Typography>
            </Grid>
            <Grid sx={{ flexGrow: 1 }} />
            <Grid>
                <Button size="small" variant="outlined" onClick={onSelectAll}>
                    {selectedIds.length === notifications.length ? 'Deselect All' : 'Select All'}
                </Button>
            </Grid>
            <Grid>
                <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={() => onMarkAsRead(selectedIds)}
                >
                    Mark as Read
                </Button>
            </Grid>
            <Grid>
                <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={() => onMarkAsUnread(selectedIds)}
                >
                    Mark as Unread
                </Button>
            </Grid>
            <Grid>
                <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => onDelete(selectedIds)}
                    startIcon={<DeleteOutlineIcon />}
                >
                    Delete
                </Button>
            </Grid>
        </Grid>
    </Box>
);

export default BulkActionBar;
