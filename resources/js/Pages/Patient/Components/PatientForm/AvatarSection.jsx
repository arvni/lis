import { useState } from 'react';
import {
    Box,
    Card,
    Collapse,
    FormControlLabel,
    FormGroup,
    Switch,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from '@mui/material';
import AvatarUpload from '@/Components/AvatarUpload';

const AvatarSection = ({ data, editable, errors, hasError, onAvatarChange, onSwitchChange }) => {
    const [unknownAvatar, setUnknownAvatar] = useState(null);

    const handleUnknownAvatarChange = (e, v) => {
        setUnknownAvatar(v);
        // onAvatarChange mirrors the AvatarUpload response shape ({ data }); send the
        // chosen placeholder as a relative path so it persists like an uploaded avatar.
        onAvatarChange({ data: v ? `/images/${v}.png` : null });
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 4,
                position: 'relative',
            }}
        >
            <Typography
                variant="h5"
                component="h1"
                gutterBottom
                color="primary"
                sx={{ fontWeight: 'bold', mb: 3 }}
            >
                Patient Registration
            </Typography>

            <AvatarUpload
                value={data.avatar}
                name="avatar"
                tag="AVATAR"
                label="Choose Avatar"
                onChange={onAvatarChange}
                error={hasError('avatar')}
                helperText={errors?.avatar}
                uploadUrl={route('documents.store')}
                disabled={!editable}
                sx={{
                    width: 150,
                    height: 150,
                    '& .MuiAvatar-root': {
                        width: 150,
                        height: 150,
                        fontSize: '3.5rem',
                        border: '4px solid #f5f5f5',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    },
                }}
            />

            {editable && (
                <Box sx={{ width: '100%', maxWidth: 500, mt: 3 }}>
                    <FormGroup
                        sx={{
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <FormControlLabel
                            control={<Switch color="primary" checked={!data.idCardInstAvailable} />}
                            label={
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    ID Card Not Available
                                </Typography>
                            }
                            name="idCardInstAvailable"
                            onChange={onSwitchChange}
                        />
                    </FormGroup>

                    <Collapse in={!data.idCardInstAvailable}>
                        <Card
                            variant="outlined"
                            sx={{
                                p: 2,
                                bgcolor: 'background.paper',
                                borderRadius: 2,
                                transition: 'all 0.3s ease',
                            }}
                        >
                            <Typography
                                variant="subtitle1"
                                gutterBottom
                                color="primary"
                                sx={{ fontWeight: 'medium', textAlign: 'center' }}
                            >
                                Select Avatar Type
                            </Typography>
                            <ToggleButtonGroup
                                exclusive
                                onChange={handleUnknownAvatarChange}
                                value={unknownAvatar}
                                aria-label="avatar selection"
                                sx={{
                                    width: '100%',
                                    justifyContent: 'center',
                                    '& .MuiToggleButton-root': {
                                        borderRadius: 2,
                                        m: 0.5,
                                        transition: 'transform 0.2s ease',
                                        '&:hover': {
                                            transform: 'scale(1.05)',
                                        },
                                    },
                                    '& .Mui-selected': {
                                        border: '2px solid',
                                        borderColor: 'primary.main',
                                    },
                                }}
                            >
                                <Tooltip title="Female">
                                    <ToggleButton value="female" sx={{ p: 1 }}>
                                        <img
                                            src="/images/female.png"
                                            height={70}
                                            width={70}
                                            alt="Female avatar"
                                        />
                                    </ToggleButton>
                                </Tooltip>
                                <Tooltip title="Male">
                                    <ToggleButton value="male" sx={{ p: 1 }}>
                                        <img
                                            src="/images/male.png"
                                            height={70}
                                            width={70}
                                            alt="Male avatar"
                                        />
                                    </ToggleButton>
                                </Tooltip>
                                <Tooltip title="Child">
                                    <ToggleButton value="baby" sx={{ p: 1 }}>
                                        <img
                                            src="/images/baby.png"
                                            height={70}
                                            width={70}
                                            alt="Baby avatar"
                                        />
                                    </ToggleButton>
                                </Tooltip>
                            </ToggleButtonGroup>
                        </Card>
                    </Collapse>
                </Box>
            )}
        </Box>
    );
};

export default AvatarSection;
