import Button from '@mui/material/Button';
import DialogTitle from '@mui/material/DialogTitle';
import { Stack, Typography, IconButton, Tooltip } from '@mui/material';
import { ThumbUpAlt, Close, FileDownloadOutlined, EditNote } from '@mui/icons-material';

const ApproveDialogHeader = ({
    title,
    isUpdateMode,
    clinicalCommentTemplateUrl,
    processing,
    onCancel,
}) => (
    <DialogTitle
        sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2.5,
            bgcolor: 'background.default',
        }}
    >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            {isUpdateMode ? <EditNote color="primary" /> : <ThumbUpAlt color="primary" />}
            <Typography variant="h6" component="span">
                {title}
            </Typography>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            {clinicalCommentTemplateUrl && (
                <Tooltip title="Download Template">
                    <Button
                        size="small"
                        startIcon={<FileDownloadOutlined />}
                        href={clinicalCommentTemplateUrl}
                        target="_blank"
                        variant="outlined"
                        color="primary"
                    >
                        Template
                    </Button>
                </Tooltip>
            )}

            <Tooltip title="Close">
                <IconButton
                    edge="end"
                    color="inherit"
                    onClick={onCancel}
                    disabled={processing}
                    aria-label="close"
                    size="small"
                >
                    <Close />
                </IconButton>
            </Tooltip>
        </Stack>
    </DialogTitle>
);

export default ApproveDialogHeader;
