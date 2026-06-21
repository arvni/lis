import { useForm } from '@inertiajs/react';
import { Box, Button, Card, CardContent, CardHeader, TextField, Typography } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlined';

const DiscussionPanel = ({ comments, prId }) => {
    const commentForm = useForm({ body: '' });
    const submit = () =>
        commentForm.post(route('inventory.purchase-requests.comments.store', prId), {
            onSuccess: () => commentForm.reset(),
        });
    return (
        <Card sx={{ mb: 3 }}>
            <CardHeader
                title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ChatBubbleOutlineIcon fontSize="small" color="action" />
                        <Typography variant="h6">Discussion</Typography>
                    </Box>
                }
            />
            <CardContent sx={{ pt: 0 }}>
                {comments.length === 0 ? (
                    <Typography variant="caption" color="text.secondary">
                        No comments yet.
                    </Typography>
                ) : (
                    <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {comments.map((c) => (
                            <Box
                                key={c.id}
                                sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}
                            >
                                <Box
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        bgcolor: 'primary.main',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <Typography variant="caption" color="white" fontWeight={700}>
                                        {c.user?.name?.[0]?.toUpperCase()}
                                    </Typography>
                                </Box>
                                <Box sx={{ flex: 1, bgcolor: 'grey.50', borderRadius: 1, p: 1 }}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            mb: 0.5,
                                        }}
                                    >
                                        <Typography variant="caption" fontWeight={600}>
                                            {c.user?.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.disabled">
                                            {c.created_at?.substring(0, 16)}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2">{c.body}</Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Leave a comment…"
                        value={commentForm.data.body}
                        onChange={(e) => commentForm.setData('body', e.target.value)}
                        onKeyDown={(e) =>
                            e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), submit())
                        }
                        error={!!commentForm.errors.body}
                    />
                    <Button
                        variant="contained"
                        size="small"
                        onClick={submit}
                        disabled={commentForm.processing || !commentForm.data.body}
                    >
                        Post
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};

export default DiscussionPanel;
