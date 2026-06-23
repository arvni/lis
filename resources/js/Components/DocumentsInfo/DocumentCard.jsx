import { Box, Chip, IconButton, Paper, Tooltip, Typography, alpha, useTheme } from '@mui/material';
import { Download as DownloadIcon, RemoveRedEye } from '@mui/icons-material';
import { getFileIcon } from './getFileIcon';

const DocumentCard = ({ doc, tags, onView }) => {
    const theme = useTheme();

    return (
        <Paper
            elevation={1}
            sx={{
                p: 2,
                borderRadius: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s',
                '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)',
                },
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                <Box
                    sx={{
                        p: 1.5,
                        borderRadius: 1,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        mr: 2,
                    }}
                >
                    {getFileIcon(doc.ext)}
                </Box>
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    <Typography
                        variant="subtitle2"
                        noWrap
                        title={doc.originalName || doc.name}
                        sx={{ maxWidth: '100%' }}
                    >
                        {doc.originalName || doc.name}
                    </Typography>
                    {doc.tag && (
                        <>
                            <Chip
                                label={tags.find((item) => item.value === doc.tag)?.label}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ mt: 0.5, mb: 0.5, textTransform: 'capitalize' }}
                            />
                            <br />
                        </>
                    )}
                    <Typography variant="caption" color="text.secondary">
                        Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                    </Typography>
                </Box>
            </Box>
            <Box
                sx={{
                    mt: 'auto',
                    pt: 1,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 1,
                }}
            >
                <Tooltip title="Download">
                    <IconButton
                        size="small"
                        component="a"
                        href={route('documents.download', doc.id || doc.hash)}
                        download
                        target="_blank"
                        sx={{
                            color: theme.palette.success.main,
                            backgroundColor: alpha(theme.palette.success.main, 0.1),
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.success.main, 0.2),
                            },
                        }}
                    >
                        <DownloadIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="View">
                    <IconButton
                        size="small"
                        onClick={onView}
                        sx={{
                            color: theme.palette.info.main,
                            backgroundColor: alpha(theme.palette.info.main, 0.1),
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.info.main, 0.2),
                            },
                        }}
                    >
                        <RemoveRedEye fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
        </Paper>
    );
};

export default DocumentCard;
