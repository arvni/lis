import React, {useEffect, useRef, useState} from "react";
import axios from "axios";
import Button from "@mui/material/Button";
import CircularProgress from '@mui/material/CircularProgress';
import styled from "@emotion/styled";
import Stack from "@mui/material/Stack";
import {FormHelperText} from "@mui/material";
import Typography from "@mui/material/Typography";
import PropTypes from 'prop-types';

const FileInput = styled.input`
    display: none;
    position: absolute;
`

const AvatarUploader = ({
                            value,
                            onChange,
                            name,
                            uploadUrl,
                            label = "Upload",
                            disabled = false,
                            error = false,
                            helperText = null,
                            tag = null,
                            ownerClass = null,
                            ownerId = null,
                        }) => {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const Input = useRef(null);
    const inputClicked = () => {
        if (!disabled) Input.current.click();
    };
    const onFileSelected = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        setUploadError(null);

        const fr = new FileReader();
        fr.onloadend = event => {
            setUrl(event.target.result);
        };
        fr.readAsDataURL(file);

        const formData = new FormData();
        formData.append("file", file);
        if (tag)
            formData.append("tag", tag);
        if (ownerClass)
            formData.append("ownerClass", ownerClass);
        if (ownerId)
            formData.append("ownerId", ownerId);

        axios.post(uploadUrl, formData)
            .then((res) => {
                onChange(res.data);
                setLoading(false);
            })
            .catch((err) => {
                const msg = err.response?.data?.errors?.file?.[0]
                    || err.response?.data?.message
                    || "Upload failed";
                setUploadError(msg);
                setUrl("");
                setLoading(false);
                // Reset the input so the same file can be re-selected
                if (Input.current) Input.current.value = "";
            });
    };
    useEffect(() => {
        if (typeof value === "string") {
            setUrl(value);
        } else if (value?.id) {
            setUrl(route('documents.download', value.id));
        }
    }, [value]);
    return (
        <Stack direction="column" sx={{justifyItems: "center"}}>
            <FileInput
                type="file"
                ref={Input}
                onChange={onFileSelected}
                name={name}
                accept=".jpg,.png,.jpeg,.webp"
                disabled={disabled}
            />
            <Button
                onClick={inputClicked}
                disabled={disabled}
                color={error || uploadError ? "error" : "inherit"}
                sx={{p: 0, m: "auto", width: "20em", height: "20em", borderRadius: "1em", overflow: "hidden"}}
                variant="outlined"
            >
                {!!url && !loading && <img src={url} style={{width: "100%", maxHeight: "100%"}}/>}
                {loading && <CircularProgress disableShrink/>}
                {!loading && !url && label}
            </Button>
            {(helperText || uploadError) && (
                <FormHelperText sx={{textAlign: "center"}} error>
                    {uploadError || helperText}
                </FormHelperText>
            )}
        </Stack>
    );
}

AvatarUploader.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    onChange: PropTypes.func.isRequired,
    name: PropTypes.string,
    uploadUrl: PropTypes.string.isRequired,
    label: PropTypes.string,
    disabled: PropTypes.bool,
    error: PropTypes.bool,
    helperText: PropTypes.string,
    tag: PropTypes.string,
    ownerClass: PropTypes.string,
    ownerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default AvatarUploader;
