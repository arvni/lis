// DocumentPage.jsx
import React, {useEffect, useState} from 'react';
import {
    Dialog, DialogContent,
} from '@mui/material';
import SingleDocumentViewer from '@/Components/SingleDocumentViewer';

// Example document page that receives a document ID via route params
const Document = ({document, onClose}) => {
    const [open, setOpen] = useState(Boolean(document));
    useEffect(() => {
        if (document)
            setOpen(true)
        else
            setOpen(false);
    }, [document]);
    const handleClose = () => {
        setOpen(false);
        if (onClose)
            onClose();
        else
            window.close();
    }

    return (
        <Dialog open={open} sx={{p: 0}}>
            <DialogContent sx={{p: 0}}>
                <SingleDocumentViewer
                    document={document}
                    onClose={handleClose}
                />
            </DialogContent>
        </Dialog>
    );
};


export default Document;
