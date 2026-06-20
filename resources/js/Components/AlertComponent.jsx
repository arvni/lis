import React, { useEffect } from 'react';
import { useSnackbar } from 'notistack';
import PropTypes from 'prop-types';

const AlertComponent = ({ success, status, errors }) => {
    const { enqueueSnackbar } = useSnackbar();
    useEffect(() => {
        if (success && status) {
            enqueueSnackbar(status, { variant: 'success' });
        } else if (success != null && status) enqueueSnackbar(status, { variant: 'error' });
        if (errors)
            for (let item in errors) {
                const msg = Array.isArray(errors[item]) ? errors[item][0] : errors[item];
                if (msg) enqueueSnackbar(msg, { variant: 'warning' });
            }
    }, [success, status, errors, enqueueSnackbar]);
    return <React.Fragment />;
};

AlertComponent.propTypes = {
    success: PropTypes.bool,
    status: PropTypes.string,
    errors: PropTypes.object,
};

export default AlertComponent;
