import { Alert, Avatar, Button, Grid, Paper, Typography } from '@mui/material';
import { Download, FileCopy } from '@mui/icons-material';

const DocumentsTab = ({ documents }) =>
    documents && documents.length > 0 ? (
        <Grid container spacing={2}>
            {documents.map((item, index) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                    <Paper
                        elevation={2}
                        sx={{
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2,
                            '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' },
                            transition: 'all 0.3s ease',
                        }}
                    >
                        <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                            <FileCopy fontSize="large" />
                        </Avatar>
                        <Typography variant="h6" align="center">
                            Document #{index + 1}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" align="center">
                            {item.hash.substring(0, 16)}...
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<Download />}
                            component="a"
                            href={route('documents.download', item.hash)}
                            target="_blank"
                            fullWidth
                        >
                            Download
                        </Button>
                    </Paper>
                </Grid>
            ))}
        </Grid>
    ) : (
        <Alert severity="info">No documents attached to this order.</Alert>
    );

export default DocumentsTab;
