import { Alert } from '@mui/material';
import Grid from '@mui/material/Grid';
import { FormProvider, useFormState } from '@/Components/FormTemplate.jsx';
import React, { useState, useEffect } from 'react';
import { emptyTube } from './AddForm/constants';
import SampleTypeSection from './AddForm/SampleTypeSection';
import TubeDetailsSection from './AddForm/TubeDetailsSection';

const AddForm = ({ open, onClose, defaultValue }) => {
    const url = defaultValue?.id
        ? route('materials.update', defaultValue.id)
        : route('materials.store');

    const defaultData = {
        sample_type: null,
        number_of_tubes: 1,
        tubes: [emptyTube()],
        ...defaultValue,
    };

    return (
        <FormProvider
            onClose={onClose}
            defaultValue={defaultData}
            open={open}
            url={url}
            maxWidth="md"
            generalTitle={defaultValue?.id ? 'Edit Material' : ' Materials'}
        >
            <FormContent />
        </FormProvider>
    );
};

const FormContent = () => {
    const { data, setData, errors } = useFormState();
    const [tubesList, setTubesList] = useState(data.tubes || [emptyTube()]);

    useEffect(() => {
        // Update tubes list when number changes
        const currentCount = tubesList.length;
        const newCount = parseInt(data.number_of_tubes) || 1;

        if (newCount > currentCount) {
            // Add new empty tubes
            const newTubes = [...tubesList];
            for (let i = currentCount; i < newCount; i++) {
                newTubes.push(emptyTube());
            }
            setTubesList(newTubes);
            setData((prev) => ({ ...prev, tubes: newTubes }));
        } else if (newCount < currentCount) {
            // Remove excess tubes
            const newTubes = tubesList.slice(0, newCount);
            setTubesList(newTubes);
            setData((prev) => ({ ...prev, tubes: newTubes }));
        }
    }, [data.number_of_tubes, tubesList, setData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData((prevState) => ({ ...prevState, [name]: value }));
    };

    const handleTubeChange = (index, field, value) => {
        const newTubes = [...tubesList];
        newTubes[index] = {
            ...newTubes[index],
            [field]: value,
        };
        setTubesList(newTubes);
        setData((prev) => ({ ...prev, tubes: newTubes }));
    };

    const handleDeleteTube = (index) => {
        const newTubes = tubesList.filter((_, i) => i !== index);
        setTubesList(newTubes);
        setData((prev) => ({
            ...prev,
            tubes: newTubes,
            number_of_tubes: newTubes.length,
        }));
    };

    const incrementTubes = () => {
        const newValue = Math.min(parseInt(data.number_of_tubes || 1) + 1, 100);
        setData((prev) => ({ ...prev, number_of_tubes: newValue }));
    };

    const decrementTubes = () => {
        const newValue = Math.max(parseInt(data.number_of_tubes || 1) - 1, 1);
        setData((prev) => ({ ...prev, number_of_tubes: newValue }));
    };

    const applyFirstTubeDatesToAll = () => {
        const firstTube = tubesList[0];
        if (!firstTube) return;

        const newTubes = tubesList.map((tube) => ({
            ...tube,
            manufactured_date: firstTube.manufactured_date,
            expire_date: firstTube.expire_date,
        }));
        setTubesList(newTubes);
        setData((prev) => ({ ...prev, tubes: newTubes }));
    };

    return (
        <Grid size={12}>
            <SampleTypeSection
                data={data}
                errors={errors}
                onChange={handleChange}
                onIncrement={incrementTubes}
                onDecrement={decrementTubes}
            />

            {data.sample_type && (
                <TubeDetailsSection
                    tubesList={tubesList}
                    errors={errors}
                    onTubeChange={handleTubeChange}
                    onDeleteTube={handleDeleteTube}
                    onApplyDatesToAll={applyFirstTubeDatesToAll}
                />
            )}

            {/* Info Alert */}
            {!data.sample_type && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    Please select a sample type first to enter tube details.
                </Alert>
            )}
        </Grid>
    );
};

export default AddForm;
