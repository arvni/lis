import React, {useCallback} from 'react';
import PropTypes from 'prop-types';
import Container from '@mui/material/Container';
import {Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button} from '@mui/material';
import {useForm} from '@inertiajs/react';
import {enqueueSnackbar} from 'notistack';
import Grid from "@mui/material/Grid2";

const ChangePassword = ({open, onClose, currentNeeded = true}) => {
    const {data, setData, setError, errors, reset, post} = useForm({
        current: '',
        password: '',
        password_confirmation: '',
        _method: 'put'
    });

    const handleChange = useCallback((e) => {
        const {name, value} = e.target;
        setData((prev) => ({...prev, [name]: value}));
    }, [setData]);

    const handleSubmit = useCallback(() => {
        post(route('password.update'), {
            onSuccess: () => {
                enqueueSnackbar('Password changed successfully', {variant: 'success'});
                reset();
                onClose();
            },
            onError: () => {
                enqueueSnackbar('Failed to change password', {variant: 'error'});
            }
        });
    }, [post, reset, onClose]);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Change Password</DialogTitle>
            <DialogContent>
                <Container>
                    <Grid container spacing={2} sx={{pt: 2}}>
                        {currentNeeded && (
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Current Password"
                                    name="current"
                                    type="password"
                                    value={data.current}
                                    onChange={handleChange}
                                    error={Boolean(errors.current)}
                                    helperText={errors.current || ''}
                                />
                            </Grid>
                        )}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="New Password"
                                name="password"
                                type="password"
                                value={data.password}
                                onChange={handleChange}
                                error={Boolean(errors.password)}
                                helperText={errors.password || ''}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Confirm Password"
                                name="password_confirmation"
                                type="password"
                                value={data.password_confirmation}
                                onChange={handleChange}
                                error={Boolean(errors.password_confirmation)}
                                helperText={errors.password_confirmation || ''}
                            />
                        </Grid>
                    </Grid>
                </Container>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="secondary">Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">Submit</Button>
            </DialogActions>
        </Dialog>
    );
};

ChangePassword.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    currentNeeded: PropTypes.bool
};

export default ChangePassword;
