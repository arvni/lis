import React, {useEffect} from "react";
import {useSnackbar} from "notistack";

const AlertComponent = ({success, status, errors}) => {
    const {enqueueSnackbar} = useSnackbar();
    useEffect(()=>{
        if(success && status){
            enqueueSnackbar(status, {variant :"success"});
        }else if(success!=null && status)
            enqueueSnackbar(status, {variant :"error"});
        if(errors && errors!={})
            for(let item in errors){
                const msg = Array.isArray(errors[item]) ? errors[item][0] : errors[item];
                if(msg) enqueueSnackbar(msg, {variant :"warning"});
            }
    },[success,status, errors]);
    return (
        <React.Fragment/>
    );
}

export default AlertComponent;
