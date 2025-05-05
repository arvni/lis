import React, {useEffect} from "react";
import {useSnackbar} from "notistack";

const AlertComponent = ({success, status, errors}) => {
    const {enqueueSnackbar} = useSnackbar();
    useEffect(()=>{
        if(success){
            enqueueSnackbar(status, {variant :"success"});
        }else if(success!=null && status)
            enqueueSnackbar(status, {variant :"error"});
        if(errors && errors!={})
            for(let item in errors){
                enqueueSnackbar(errors[item], {variant :"warning"});
            }
    },[success,status, errors]);
    return (
        <React.Fragment/>
    );
}

export default AlertComponent;
