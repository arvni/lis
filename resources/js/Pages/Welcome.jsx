import React, {useEffect, useState} from 'react';
import Avatar from '@mui/material/Avatar';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {LoadingButton} from "@mui/lab";
import {useSnackbar} from "notistack";
import {Head, router} from "@inertiajs/react";
import {useForm} from "@inertiajs/react";
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import Alert from '@mui/material/Alert';
import Fade from '@mui/material/Fade';
import {Container} from "@mui/material";

function Copyright(props) {
    return (
        <Typography variant="body2" color="text.secondary" align="center" {...props}>
            {'Copyright © ARIZ '}
            {new Date().getFullYear()}
            {'.'}
        </Typography>
    );
}

// Create a custom theme with better colors and improved user experience
const theme = createTheme({
    palette: {
        primary: {
            main: '#2563eb', // A deeper blue for better contrast
        },
        secondary: {
            main: '#00cee6', // Indigo shade for secondary elements
        },
        background: {
            default: '#f9fafb',
        },
    },
    typography: {
        fontFamily: [
            'Inter',
            '-apple-system',
            'BlinkMacSystemFont',
            'Segoe UI',
            'Roboto',
            'Helvetica Neue',
            'Arial',
            'sans-serif',
        ].join(','),
        h4: {
            fontWeight: 700,
        },
        h5: {
            fontWeight: 600,
        },
        subtitle1: {
            fontWeight: 500,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: '8px',
                    padding: '10px 22px',
                    fontWeight: 500,
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                    },
                },
            },
        },
        MuiLoadingButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: '8px',
                    padding: '12px 22px',
                    fontWeight: 500,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
                },
            },
        },
    },
});

export default function Welcome(props) {
    const [showPassword, setShowPassword] = useState(false);
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [loginError, setLoginError] = useState(null);

    const {data, setData, post, processing, reset, setError, errors, clearErrors} = useForm({
        email: '',
        password: '',
        remember: true, // Set to true by default for better UX
    });

    const {enqueueSnackbar} = useSnackbar();

    useEffect(() => {
        if (props?.auth?.user)
            router.visit('/dashboard');

        // Display flash messages if they exist
        if (props.flash && props.flash.error) {
            setLoginError(props.flash.error);
            enqueueSnackbar(props.flash.error, {variant: "error"});
        }

        return () => {
            reset('password');
        };
    }, []);

    useEffect(() => {
        for (let key in errors) {
            enqueueSnackbar(errors[key], {variant: "error"});
        }
    }, [errors]);

    const onHandleChange = (event) => {
        setData(
            event.target.name,
            event.target.type === 'checkbox' ? event.target.checked : event.target.value
        );

        // Clear errors when user starts typing again
        if (formSubmitted && errors[event.target.name]) {
            clearErrors(event.target.name);
        }

        // Clear login error when user makes changes
        if (loginError) {
            setLoginError(null);
        }
    };

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    const validateForm = () => {
        let isValid = true;

        // Email or username validation
        if (!data.email || data.email.trim() === '') {
            setError("email", "Please enter your email or username");
            isValid = false;
        } else if (data.email.includes('@')) {
            // If input contains @, validate as email
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(data.email)) {
                setError("email", "Please enter a valid email address");
                isValid = false;
            }
        } else if (data.email.length < 3) {
            // If input is a username, ensure minimum length
            setError("email", "Username must be at least 3 characters");
            isValid = false;
        }

        // Password validation
        if (!data.password || data.password.length < 6) {
            setError("password", "Password must be at least 6 characters");
            isValid = false;
        }

        return isValid;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormSubmitted(true);

        if (validateForm()) {
            post(route('login'));
        }
    };

    return (
        <>
            <Head title="Login"/>
            <ThemeProvider theme={theme}>
                <Grid container
                      component="main" sx={{height: '100vh'}}>
                    <CssBaseline/>
                    <Grid
                        size={{
                            xs: false,
                            sm: 4,
                            md: 6
                        }}
                        sx={{
                            backgroundImage: 'url(https://biongenetic.com/wp-content/uploads/2024/09/1-2.png)',
                            backgroundRepeat: 'no-repeat',
                            backgroundColor: (t) =>
                                t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    />
                    <Grid size={{xs: 12, sm: 8, md: 6}} component={Paper} elevation={6} square>
                        <Box
                            sx={{
                                my: 8,
                                mx: 4,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: {xs: 2, sm: 4},
                            }}
                        >
                            <Avatar sx={{m: 1, bgcolor: 'secondary.main', width: 56, height: 80}}
                                    variant="square"
                                    src="/images/logo.png"/>
                            <Typography component="h1" variant="h4" gutterBottom>
                                Welcome Back
                            </Typography>
                            <Typography variant="subtitle1" color="text.secondary" align="center" gutterBottom>
                                Sign in to access your LIS account
                            </Typography>

                            {loginError && (
                                <Fade in={!!loginError}>
                                    <Alert
                                        severity="error"
                                        sx={{width: '100%', mt: 2, mb: 2}}
                                        onClose={() => setLoginError(null)}
                                    >
                                        {loginError}
                                    </Alert>
                                </Fade>
                            )}
                            <Container maxWidth="xs">
                                <Box component="form" noValidate onSubmit={handleSubmit} sx={{mt: 2, width: '100%'}}>
                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        id="email"
                                        label="Email or Username"
                                        name="email"
                                        autoComplete="email"
                                        autoFocus
                                        value={data.email}
                                        onChange={onHandleChange}
                                        error={!!errors.email}
                                        helperText={errors.email}
                                        slotProps={{
                                            input: {
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <EmailIcon color="action"/>
                                                    </InputAdornment>
                                                ),
                                            }
                                        }}
                                        placeholder="Email or username"
                                    />
                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        name="password"
                                        label="Password"
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        autoComplete="current-password"
                                        value={data.password}
                                        onChange={onHandleChange}
                                        error={!!errors.password}
                                        helperText={errors.password}
                                        slotProps={{
                                            input: {
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            aria-label="toggle password visibility"
                                                            onClick={handleClickShowPassword}
                                                            onMouseDown={handleMouseDownPassword}
                                                            edge="end"
                                                        >
                                                            {showPassword ? <VisibilityOff/> : <Visibility/>}
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            }
                                        }}
                                    />
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mt: 1
                                    }}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    color="primary"
                                                    name="remember"
                                                    checked={data.remember}
                                                    onChange={onHandleChange}
                                                />
                                            }
                                            label="Remember me"
                                        />
                                        <Link href={route('password.request')} variant="body2" underline="hover">
                                            Forgot password?
                                        </Link>
                                    </Box>
                                    <LoadingButton
                                        loading={processing}
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        sx={{mt: 3, mb: 2, py: 1.5}}
                                        size="large"
                                    >
                                        Sign In
                                    </LoadingButton>
                                </Box>
                            </Container>
                        </Box>
                        <Copyright sx={{mt: 4, mb: 4}}/>
                    </Grid>
                </Grid>
            </ThemeProvider>
        </>
    );
}
