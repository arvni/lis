import { Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { PictureAsPdf, Visibility } from '@mui/icons-material';
import { formatDocumentName, getDocumentViewUrl } from './helpers';

// The inner layout for a document option inside a Select's menu.
// Shared between the published-report and clinical-document selectors.
const DocumentSelectItem = ({ document, chipColor }) => (
    <Box
        sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            gap: 2,
        }}
    >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <PictureAsPdf fontSize="small" color="error" />
            <Box sx={{ flex: 1 }}>
                <Box>
                    <Typography variant="body2">{formatDocumentName(document)}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.25 }}>
                        <Typography variant="caption" color="text.secondary">
                            {new Date(document.created_at).toLocaleDateString()}
                        </Typography>
                        {document.tag && (
                            <Chip
                                label={document.tag}
                                size="small"
                                color={chipColor}
                                variant="outlined"
                            />
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>

        <Tooltip title="View PDF">
            <IconButton
                size="small"
                onClick={(e) => {
                    e.stopPropagation();
                    window.open(getDocumentViewUrl(document), '_blank');
                }}
                sx={{ ml: 1 }}
            >
                <Visibility fontSize="small" />
            </IconButton>
        </Tooltip>
    </Box>
);

// Compact representation of the currently selected document (Select renderValue).
export const SelectedDocumentValue = ({ document, chipColor }) =>
    document ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PictureAsPdf fontSize="small" color="error" />
            <Typography variant="body2">{formatDocumentName(document)}</Typography>
            <Chip label={document.tag || 'PDF'} size="small" color={chipColor} variant="outlined" />
        </Box>
    ) : (
        ''
    );

export default DocumentSelectItem;
