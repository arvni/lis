import { Avatar, Box, Paper, Radio, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { avatarUrl } from './helpers';

const AvatarPicker = ({ comparison, choices, keepSide, onChoose }) => {
    const resultSide = choices.avatar ?? keepSide;
    return (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                Photo / ID image
            </Typography>
            <Grid container spacing={2} alignItems="center">
                {['first', 'second'].map((side) => {
                    const selected = (choices.avatar ?? keepSide) === side;
                    const p = comparison[side];
                    return (
                        <Grid size={{ xs: 6, sm: 3 }} key={side}>
                            <Paper
                                onClick={() => onChoose('avatar', side)}
                                elevation={selected ? 6 : 0}
                                variant={selected ? 'elevation' : 'outlined'}
                                sx={{
                                    p: 1,
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    borderColor: selected ? 'primary.main' : 'divider',
                                    outline: selected ? '2px solid' : 'none',
                                    outlineColor: 'primary.main',
                                }}
                            >
                                <Box
                                    component="img"
                                    src={avatarUrl(p.fields.avatar, p.fields.gender)}
                                    alt={p.fullName}
                                    sx={{
                                        width: '100%',
                                        height: 120,
                                        objectFit: 'cover',
                                        borderRadius: 1,
                                        mb: 1,
                                        backgroundColor: 'grey.100',
                                    }}
                                />
                                <Stack
                                    direction="row"
                                    spacing={0.5}
                                    justifyContent="center"
                                    alignItems="center"
                                >
                                    <Radio checked={selected} size="small" sx={{ p: 0 }} />
                                    <Typography variant="caption" noWrap>
                                        {p.fullName}
                                    </Typography>
                                </Stack>
                            </Paper>
                        </Grid>
                    );
                })}
                <Grid size={{ xs: 12, sm: 6 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                            Result
                        </Typography>
                        <Avatar
                            src={avatarUrl(
                                comparison[resultSide].fields.avatar,
                                comparison[resultSide].fields.gender,
                            )}
                            sx={{
                                width: 56,
                                height: 56,
                                border: '2px solid',
                                borderColor: 'primary.main',
                            }}
                        />
                    </Stack>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default AvatarPicker;
