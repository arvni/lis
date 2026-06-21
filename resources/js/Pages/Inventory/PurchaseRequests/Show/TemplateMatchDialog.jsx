import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
} from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

const RESULT_LABELS = {
    match: 'Matched',
    no_match: 'No match',
    skip: 'Skipped',
    default_fallback: 'Default fallback',
};

const TemplateMatchDialog = ({ open, onClose, loading, result, pr }) => (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountTreeIcon fontSize="small" color="info" />
            Template Match Check
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
            {loading ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                    <CircularProgress />
                </Box>
            ) : result ? (
                <>
                    <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            gutterBottom
                        >
                            PR attributes used for matching
                        </Typography>
                        <Typography variant="body2">
                            <b>Urgency:</b> {result.pr.urgency}
                        </Typography>
                        <Typography variant="body2">
                            <b>Est. Total:</b> {result.pr.estimated_total}
                        </Typography>
                        <Typography variant="body2">
                            <b>Requester roles:</b> {result.pr.requester_roles.join(', ') || '—'}
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            mb: 2,
                            p: 1.5,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: result.matched_template ? 'success.main' : 'warning.main',
                            bgcolor: result.matched_template ? 'success.50' : 'warning.50',
                        }}
                    >
                        {result.matched_template ? (
                            <>
                                <Typography variant="body2" color="success.main" fontWeight={700}>
                                    ✓ Matched: {result.matched_template.name}
                                </Typography>
                                {pr.workflow_template_id !== result.matched_template.id && (
                                    <Typography
                                        variant="caption"
                                        color="warning.main"
                                        display="block"
                                        sx={{ mt: 0.5 }}
                                    >
                                        ⚠ Current assigned template differs — re-submit to update.
                                    </Typography>
                                )}
                            </>
                        ) : (
                            <Typography variant="body2" color="warning.main" fontWeight={700}>
                                ✗ No matching template — PR will skip workflow approval
                            </Typography>
                        )}
                    </Box>

                    <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        gutterBottom
                        sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
                    >
                        All templates evaluated
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {result.evaluated.map((t) => {
                            const color =
                                t.result === 'match' || t.result === 'default_fallback'
                                    ? 'success'
                                    : t.result === 'skip'
                                      ? 'default'
                                      : 'error';
                            const label = RESULT_LABELS[t.result] ?? t.result;
                            return (
                                <Box
                                    key={t.id}
                                    sx={{
                                        p: 1,
                                        borderRadius: 1,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        opacity: t.is_active ? 1 : 0.5,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 1,
                                        }}
                                    >
                                        <Typography variant="body2" fontWeight={600}>
                                            {t.name}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                                            {!t.is_active && (
                                                <Chip
                                                    label="Inactive"
                                                    size="small"
                                                    color="default"
                                                    variant="outlined"
                                                />
                                            )}
                                            <Chip
                                                label={label}
                                                size="small"
                                                color={color}
                                                variant={
                                                    t.result === 'match' ||
                                                    t.result === 'default_fallback'
                                                        ? 'filled'
                                                        : 'outlined'
                                                }
                                            />
                                        </Box>
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Priority: {t.priority} · {t.steps} step(s)
                                        {t.is_default ? ' · Default/fallback' : ''}
                                    </Typography>
                                    {t.reasons.length > 0 && (
                                        <Box sx={{ mt: 0.5 }}>
                                            {t.reasons.map((r, i) => (
                                                <Typography
                                                    key={i}
                                                    variant="caption"
                                                    color="error.main"
                                                    display="block"
                                                >
                                                    ✗ {r}
                                                </Typography>
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                </>
            ) : null}
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Close</Button>
        </DialogActions>
    </Dialog>
);

export default TemplateMatchDialog;
