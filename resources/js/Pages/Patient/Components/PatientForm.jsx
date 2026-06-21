import Box from '@mui/material/Box';
import { Card, CardContent, Chip } from '@mui/material';
import { Person, Flag, Info } from '@mui/icons-material';
import { useState } from 'react';
import { omanWilayats } from '@/Data/omanWilayats.js';
import { calculateAge, calculateDOB } from './PatientForm/helpers';
import CollapsibleSection from './PatientForm/CollapsibleSection';
import AvatarSection from './PatientForm/AvatarSection';
import PersonalInfoSection from './PatientForm/PersonalInfoSection';
import LocationSection from './PatientForm/LocationSection';
import RelationshipSection from './PatientForm/RelationshipSection';

const PatientForm = ({ onChange, data, errors, editable = true, withRelative = false }) => {
    const [expandedSection, setExpandedSection] = useState('personal');
    const [age, setAge] = useState(calculateAge(data?.dateOfBirth));
    const [customRelationship, setCustomRelationship] = useState('');

    // Handle date of birth change
    const handleDOBChange = (e) => {
        const newDOB = e.target.value;
        onChange(e);

        // Update age field
        if (newDOB) {
            setAge(calculateAge(newDOB));
        } else {
            setAge('');
        }
    };

    // Handle age change
    const handleAgeChange = (e) => {
        const newAge = e.target.value;
        setAge(newAge);

        // Update date of birth field
        if (newAge && !isNaN(parseInt(newAge))) {
            const newDOB = calculateDOB(newAge);
            onChange({
                target: {
                    name: 'dateOfBirth',
                    value: newDOB,
                },
            });
        }
    };

    const switchChange = (e, v) => onChange({ target: { name: e.target.name, value: !v } });
    const nationalityChanged = (e, v) =>
        onChange({ ...e, target: { ...e.target, name: 'nationality', value: v } });
    const handleGenderChange = (e, v) =>
        onChange({ ...e, target: { ...e.target, name: 'gender', value: v + '' } });
    const handleAvatarChange = ({ data }) => onChange({ target: { name: 'avatar', value: data } });

    // Helper function to check if a field has an error
    const hasError = (fieldName) =>
        !!errors && Object.prototype.hasOwnProperty.call(errors, fieldName);

    // Omani nationals must provide second and third names
    const isOmani = data?.nationality?.code === 'OM';

    // Governorate / wilayat are cascading: wilayat options depend on the chosen governorate.
    const governorateOptions = Object.keys(omanWilayats);
    // Legacy patients may have a stored wilayat but no governorate — derive it so the
    // wilayat still resolves and displays when editing them.
    const selectedGovernorate =
        data?.governorate ||
        (data?.wilayat
            ? governorateOptions.find((g) => omanWilayats[g].includes(data.wilayat))
            : '') ||
        '';
    const wilayatOptions = selectedGovernorate ? omanWilayats[selectedGovernorate] : [];

    const handleGovernorateChange = (e, v) => {
        onChange({ target: { name: 'governorate', value: v || '' } });
        // A wilayat belongs to a single governorate; clear it when the governorate changes.
        if (v !== selectedGovernorate) {
            onChange({ target: { name: 'wilayat', value: '' } });
        }
    };

    const handleWilayatChange = (e, v) => onChange({ target: { name: 'wilayat', value: v || '' } });

    // Toggle section expansion
    const toggleSection = (section) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    const relationOptions = [
        ...(data.gender === 'male'
            ? [
                  { value: 'father', label: 'Father' },
                  { value: 'grandfather', label: 'Grandfather' },
                  { value: 'uncle', label: 'Uncle' },
                  { value: 'brother', label: 'Brother' },
                  { value: 'husband', label: 'Husband' },
                  { value: 'father in law', label: 'Father in Law' },
                  { value: 'brother in law', label: 'Brother in Law' },
              ]
            : [
                  { value: 'mother', label: 'Mother' },
                  { value: 'sister', label: 'Sister' },
                  { value: 'wife', label: 'Wife' },
                  { value: 'grandmother', label: 'Grandmother' },
                  { value: 'aunt', label: 'Aunt' },
                  { value: 'mother in law', label: 'Mother in Law' },
                  { value: 'sister in law', label: 'Sister in Law' },
              ]),
        { value: 'child', label: 'Child' },
        { value: 'first cousin', label: 'First Cousin' },
        { value: 'second cousin', label: 'Second Cousin' },
        { value: 'other', label: 'Other' },
    ];

    const currentRelationship = data.relationship
        ? Array.isArray(data.relationship)
            ? data.relationship
            : data.relationship.split(',')
        : [];
    const showCustomInput = currentRelationship.includes('other');

    const handleAddCustomRelationship = () => {
        const trimmed = customRelationship.trim().toLowerCase();
        if (trimmed && !currentRelationship.includes(trimmed)) {
            const newRelationship = [
                ...currentRelationship.filter((r) => r !== 'other'),
                trimmed,
                'other',
            ];
            onChange({ target: { name: 'relationship', value: newRelationship } });
        }
        setCustomRelationship('');
    };

    const handleCustomRelationshipKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddCustomRelationship();
        }
    };

    return (
        <Card elevation={3} sx={{ borderRadius: 2, overflow: 'visible' }}>
            <CardContent sx={{ p: 3 }}>
                {/* Header with Avatar */}
                <AvatarSection
                    data={data}
                    editable={editable}
                    errors={errors}
                    hasError={hasError}
                    onAvatarChange={handleAvatarChange}
                    onSwitchChange={switchChange}
                />

                {/* Foldable Sections */}
                <CollapsibleSection
                    icon={<Person sx={{ mr: 1 }} />}
                    title="Personal Information"
                    expanded={expandedSection === 'personal'}
                    onToggle={() => toggleSection('personal')}
                >
                    <PersonalInfoSection
                        data={data}
                        errors={errors}
                        editable={editable}
                        hasError={hasError}
                        isOmani={isOmani}
                        age={age}
                        onChange={onChange}
                        onDOBChange={handleDOBChange}
                        onAgeChange={handleAgeChange}
                        onGenderChange={handleGenderChange}
                    />
                </CollapsibleSection>

                <CollapsibleSection
                    icon={<Flag sx={{ mr: 1 }} />}
                    title="Nationality & Location"
                    expanded={expandedSection === 'location'}
                    onToggle={() => toggleSection('location')}
                >
                    <LocationSection
                        data={data}
                        errors={errors}
                        editable={editable}
                        hasError={hasError}
                        governorateOptions={governorateOptions}
                        selectedGovernorate={selectedGovernorate}
                        wilayatOptions={wilayatOptions}
                        onChange={onChange}
                        onNationalityChange={nationalityChanged}
                        onGovernorateChange={handleGovernorateChange}
                        onWilayatChange={handleWilayatChange}
                    />
                </CollapsibleSection>

                {/* Relationship Field (for relatives) */}
                {withRelative && (
                    <CollapsibleSection
                        icon={<Info sx={{ mr: 1 }} />}
                        title="Relationship Information"
                        expanded={expandedSection === 'relationship'}
                        onToggle={() => toggleSection('relationship')}
                    >
                        <RelationshipSection
                            editable={editable}
                            relationOptions={relationOptions}
                            currentRelationship={currentRelationship}
                            showCustomInput={showCustomInput}
                            customRelationship={customRelationship}
                            setCustomRelationship={setCustomRelationship}
                            onChange={onChange}
                            onAddCustom={handleAddCustomRelationship}
                            onCustomKeyDown={handleCustomRelationshipKeyDown}
                        />
                    </CollapsibleSection>
                )}

                {/* Form Submission Hint */}
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                    <Chip
                        icon={<Info />}
                        label="Fields marked with * are required"
                        variant="outlined"
                        color="primary"
                    />
                </Box>
            </CardContent>
        </Card>
    );
};

export default PatientForm;
