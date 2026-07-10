import React, { useState } from 'react';
import { Button, Divider, ListItem, Paper, Stack, Typography, useTheme } from '@mui/material';
import List from '@mui/material/List';
import { Info as InfoIcon } from '@mui/icons-material';
import Document from '@/Pages/Document.jsx';
import { parseParameters } from './helpers';

/** A file parameter renders a view/download button with a document viewer. */
const ParameterValue = ({ parameter }) => {
    const [selectedDoc, setSelectedDoc] = useState(null);

    if (parameter.type === 'file' && parameter.value) {
        return (
            <>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<InfoIcon />}
                    onClick={(e) => {
                        e.preventDefault();
                        setSelectedDoc(parameter.value);
                    }}
                    href={route('documents.download', parameter.value.id || parameter.value.hash)}
                    target="_blank"
                    sx={{ mt: 0.5, borderRadius: 1 }}
                    title={parameter.value.originalName}
                >
                    View File
                </Button>
                <Document document={selectedDoc} onClose={() => setSelectedDoc(null)} />
            </>
        );
    }

    return <Typography variant="body2">{parameter.value || '-'}</Typography>;
};

/** The recorded workflow parameters of a finished/rejected section. */
const ParametersList = ({ parameters }) => {
    const theme = useTheme();

    return (
        <>
            <Typography
                variant="subtitle2"
                fontWeight="bold"
                sx={{
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                }}
            >
                <InfoIcon fontSize="small" color="primary" />
                Parameters
            </Typography>

            <Paper
                variant="outlined"
                sx={{
                    borderRadius: 1,
                    mb: 2,
                    overflow: 'hidden',
                }}
            >
                <List dense disablePadding>
                    {parseParameters(parameters).map((parameter, paramIndex) => (
                        <React.Fragment key={paramIndex}>
                            {paramIndex > 0 && <Divider />}
                            <ListItem
                                sx={{
                                    py: 1,
                                    px: 2,
                                    backgroundColor:
                                        paramIndex % 2 === 0
                                            ? 'transparent'
                                            : theme.palette.action.hover,
                                }}
                            >
                                <Stack
                                    direction={{
                                        xs: 'column',
                                        sm: 'row',
                                    }}
                                    spacing={1}
                                    sx={{
                                        justifyContent: 'space-between',
                                        alignItems: {
                                            xs: 'flex-start',
                                            sm: 'center',
                                        },
                                        width: '100%',
                                    }}
                                >
                                    <Typography
                                        variant="subtitle2"
                                        color="text.primary"
                                        fontWeight="medium"
                                    >
                                        {parameter.name}:
                                    </Typography>
                                    <ParameterValue parameter={parameter} />
                                </Stack>
                            </ListItem>
                        </React.Fragment>
                    ))}
                </List>
            </Paper>
        </>
    );
};

export default ParametersList;
