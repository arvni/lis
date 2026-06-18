import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import {
    Box,
    Card,
    Typography,
    Stack,
    Button,
    IconButton,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Tooltip,
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    LocalOffer as TagIcon,
    ColorLens as ColorIcon,
} from '@mui/icons-material';
import TableLayout from '@/Layouts/TableLayout';

const Index = ({ auth, tags }) => {
    const [openEdit, setOpenEdit] = useState(false);
    const [selectedTag, setSelectedTag] = useState(null);
    const canEdit = auth.permissions.includes('Advance Settings.Tags.Edit Tag');
    const canDelete = auth.permissions.includes('Advance Settings.Tags.Delete Tag');
    const {
        data,
        setData,
        put,
        delete: destroy,
        processing,
        reset,
        errors,
    } = useForm({
        name: '',
        color: '#7c4dff',
    });

    const handleEdit = (tag) => {
        setSelectedTag(tag);
        setData({
            name: tag.name,
            color: tag.color || '#7c4dff',
        });
        setOpenEdit(true);
    };

    const handleClose = () => {
        setOpenEdit(false);
        setSelectedTag(null);
        reset();
    };

    const submit = (e) => {
        e.preventDefault();
        put(route('tags.update', selectedTag.id), {
            onSuccess: () => handleClose(),
        });
    };

    const handleDelete = (id) => {
        if (
            confirm(
                'Are you sure you want to delete this tag? This will remove it from all associated items.',
            )
        ) {
            destroy(route('tags.destroy', id));
        }
    };

    const columns = [
        {
            field: 'name',
            headerName: 'Tag Name',
            flex: 1,
            renderCell: (params) => (
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <TagIcon sx={{ color: params.row.color || 'action.active' }} />
                    <Typography variant="body2" fontWeight="medium">
                        {params.value}
                    </Typography>
                </Stack>
            ),
        },
        {
            field: 'color',
            headerName: 'Color',
            flex: 0.5,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                        sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            bgcolor: params.value || '#7c4dff',
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    />
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {params.value || '#7c4dff'}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'preview',
            headerName: 'Preview',
            flex: 0.5,
            renderCell: (params) => (
                <Chip
                    label={params.row.name}
                    size="small"
                    sx={{
                        bgcolor: params.row.color ? `${params.row.color}15` : 'grey.100',
                        color: params.row.color || 'text.primary',
                        borderColor: params.row.color || 'divider',
                        border: '1px solid',
                        fontWeight: 'bold',
                    }}
                />
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            flex: 0.3,
            sortable: false,
            renderCell: (params) => (
                <Stack direction="row" spacing={0.5}>
                    {canEdit && (
                        <Tooltip title="Edit Tag">
                            <IconButton
                                size="small"
                                onClick={() => handleEdit(params.row)}
                                color="primary"
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    {canDelete && (
                        <Tooltip title="Delete Tag">
                            <IconButton
                                size="small"
                                onClick={() => handleDelete(params.row.id)}
                                color="error"
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Stack>
            ),
        },
    ];

    return (
        <>
            <Head title="Manage Tags" />

            <Box sx={{ p: 3 }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Tags Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage all system tags and customize their appearances with colors.
                    </Typography>
                </Box>

                <Card
                    elevation={0}
                    sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
                >
                    <TableLayout columns={columns} data={tags} loading={processing} />
                </Card>
            </Box>

            <Dialog open={openEdit} onClose={handleClose} maxWidth="xs" fullWidth>
                <form onSubmit={submit}>
                    <DialogTitle>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <ColorIcon color="primary" />
                            <Typography variant="h6">Edit Tag: {selectedTag?.name}</Typography>
                        </Stack>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={3} sx={{ mt: 1 }}>
                            <TextField
                                label="Tag Name"
                                fullWidth
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                error={!!errors.name}
                                helperText={errors.name}
                                required
                            />

                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Pick a Color
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                    <input
                                        type="color"
                                        value={data.color}
                                        onChange={(e) => setData('color', e.target.value)}
                                        style={{
                                            width: 50,
                                            height: 50,
                                            padding: 0,
                                            border: 'none',
                                            borderRadius: 4,
                                            cursor: 'pointer',
                                        }}
                                    />
                                    <TextField
                                        size="small"
                                        value={data.color}
                                        onChange={(e) => setData('color', e.target.value)}
                                        sx={{ width: 120 }}
                                        inputProps={{ style: { fontFamily: 'monospace' } }}
                                    />
                                </Stack>
                            </Box>

                            <Box
                                sx={{
                                    p: 2,
                                    bgcolor: 'grey.50',
                                    borderRadius: 2,
                                    textAlign: 'center',
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    display="block"
                                    sx={{ mb: 1 }}
                                >
                                    Live Preview
                                </Typography>
                                <Chip
                                    label={data.name || 'Tag Preview'}
                                    sx={{
                                        bgcolor: `${data.color}15`,
                                        color: data.color,
                                        borderColor: data.color,
                                        border: '1px solid',
                                        fontWeight: 'bold',
                                        px: 1,
                                    }}
                                />
                            </Box>
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, gap: 1 }}>
                        <Button onClick={handleClose} variant="outlined" color="inherit">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={processing}
                            startIcon={<TagIcon />}
                        >
                            Save Changes
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </>
    );
};

const breadCrumbs = [
    {
        title: 'Advance Settings',
        link: null,
    },
    {
        title: 'Tags',
        link: null,
    },
];

Index.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadCrumbs} title="Manage Tags">
        {page}
    </AuthenticatedLayout>
);

export default Index;
