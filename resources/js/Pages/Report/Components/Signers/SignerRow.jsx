import { useState } from 'react';
import {
    Box,
    Chip,
    IconButton,
    Stack,
    TableCell,
    TableRow,
    TextField,
    Tooltip,
    Typography,
    useTheme,
} from '@mui/material';
import { ArrowDownward, ArrowUpward, Close, EditOutlined } from '@mui/icons-material';

/** One image cell: signature or stamp thumbnail with an italic fallback. */
const SignerImage = ({ src, alt, fallback }) => {
    const theme = useTheme();
    return src ? (
        <Box
            component="img"
            src={src}
            alt={alt}
            sx={{
                maxWidth: '100px',
                maxHeight: '50px',
                objectFit: 'contain',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                p: 1,
            }}
        />
    ) : (
        <Typography variant="body2" color="text.secondary" fontStyle="italic">
            {fallback}
        </Typography>
    );
};

/** One signer table row: order controls, name, editable title, images, delete. */
const SignerRow = ({
    signer,
    signerCount,
    editable,
    showActions,
    onUp,
    onDown,
    onDelete,
    onTitleChange,
}) => {
    const theme = useTheme();
    const [hover, setHover] = useState(false);

    return (
        <TableRow
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            sx={{
                backgroundColor: hover ? theme.palette.action.hover : 'inherit',
                transition: 'background-color 0.2s ease',
            }}
        >
            <TableCell>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    {showActions && editable && (
                        <Stack direction="column" spacing={0.5}>
                            <Tooltip title="Move Up" placement="left">
                                <span>
                                    <IconButton
                                        onClick={onUp}
                                        disabled={signer.row < 2 || !editable}
                                        size="small"
                                        color="primary"
                                    >
                                        <ArrowUpward fontSize="small" />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Tooltip title="Move Down" placement="left">
                                <span>
                                    <IconButton
                                        onClick={onDown}
                                        size="small"
                                        color="primary"
                                        disabled={signer.row >= signerCount || !editable}
                                    >
                                        <ArrowDownward fontSize="small" />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Stack>
                    )}
                    <Chip
                        label={signer.row}
                        color="default"
                        size="small"
                        sx={{
                            fontWeight: 'bold',
                            minWidth: '30px',
                        }}
                    />
                </Stack>
            </TableCell>
            <TableCell>
                <Typography variant="body2">{signer.name || 'Not specified'}</Typography>
            </TableCell>
            <TableCell>
                <TextField
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={signer.title || ''}
                    name="title"
                    onChange={onTitleChange}
                    disabled={!editable}
                    placeholder="Enter title"
                    slotProps={{
                        Input: {
                            endAdornment: editable && (
                                <EditOutlined
                                    fontSize="small"
                                    color="action"
                                    sx={{ opacity: 0.5 }}
                                />
                            ),
                        },
                    }}
                />
            </TableCell>
            <TableCell>
                <SignerImage
                    src={signer.signature}
                    alt={`${signer.name}'s signature`}
                    fallback="No signature"
                />
            </TableCell>
            <TableCell>
                <SignerImage
                    src={signer.stamp}
                    alt={`${signer.name}'s stamp`}
                    fallback="No stamp"
                />
            </TableCell>
            {showActions && (
                <TableCell align="center">
                    <Tooltip title="Remove Signer" placement="left">
                        <span>
                            <IconButton
                                onClick={onDelete}
                                color="error"
                                disabled={!editable}
                                size="small"
                            >
                                <Close fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                </TableCell>
            )}
        </TableRow>
    );
};

export default SignerRow;
