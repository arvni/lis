import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import React, { useState } from 'react';
import FilterIcon from '@mui/icons-material/FilterAlt';
import Button from '@mui/material/Button';
import PropTypes from 'prop-types';

const SearchFilter = ({ defaultFilter, onFilter, label = 'Search title' }) => {
    const [filter, setFilter] = useState(defaultFilter);
    const handleChange = (e) => {
        setFilter((prevState) => ({ ...prevState, search: e.target.value }));
    };
    return (
        <Accordion>
            <AccordionSummary>
                <FilterIcon />
                Filter
            </AccordionSummary>
            <AccordionDetails>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 5 }}>
                        <TextField
                            sx={{ width: '100%' }}
                            name={'search'}
                            value={filter?.search}
                            onChange={handleChange}
                            label={label}
                        />
                    </Grid>
                    <Grid
                        size={{ xs: 12, sm: 2 }}
                        sx={{ display: 'flex' }}
                        justifyContent={'center'}
                    >
                        <Button variant={'outlined'} onClick={onFilter(filter)}>
                            Filter
                        </Button>
                    </Grid>
                </Grid>
            </AccordionDetails>
        </Accordion>
    );
};

SearchFilter.propTypes = {
    defaultFilter: PropTypes.object,
    onFilter: PropTypes.func.isRequired,
    label: PropTypes.string,
};

export default SearchFilter;
