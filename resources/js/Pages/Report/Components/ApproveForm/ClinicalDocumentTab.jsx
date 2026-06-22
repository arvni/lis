import Grid from '@mui/material/Grid';
import {
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    RadioGroup,
    FormControlLabel,
    Radio,
} from '@mui/material';
import { Description, CloudUploadOutlined } from '@mui/icons-material';
import Upload from '@/Components/Upload';
import DocumentSelectItem, { SelectedDocumentValue } from './DocumentSelectItem';

const ClinicalDocumentTab = ({
    data,
    setData,
    processing,
    availableClinicalDocuments,
    clinicalDocumentMode,
    onModeChange,
    onClinicalDocumentChange,
}) => (
    <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
        <Grid size={12}>
            <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
                <Description fontSize="small" />
                Clinical Report Document
            </Typography>

            {/* Document Mode Selection */}
            <FormControl component="fieldset" sx={{ mb: 2 }}>
                <RadioGroup
                    row
                    aria-label="clinical-document-mode"
                    name="clinical-document-mode"
                    value={clinicalDocumentMode}
                    onChange={onModeChange}
                >
                    {availableClinicalDocuments.length > 0 && (
                        <FormControlLabel
                            value="select"
                            control={<Radio />}
                            label="Select Existing Document"
                            disabled={processing}
                        />
                    )}
                    <FormControlLabel
                        value="upload"
                        control={<Radio />}
                        label="Upload New Document"
                        disabled={processing}
                    />
                </RadioGroup>
            </FormControl>

            {/* Existing Document Selection */}
            {clinicalDocumentMode === 'select' && (
                <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                    <InputLabel id="clinical-document-label">Select Clinical Document</InputLabel>
                    <Select
                        labelId="clinical-document-label"
                        id="clinical-document-select"
                        value={data.clinical_comment_document_id || ''}
                        onChange={onClinicalDocumentChange}
                        label="Select Clinical Document"
                        disabled={processing}
                        renderValue={(selected) => (
                            <SelectedDocumentValue
                                document={availableClinicalDocuments.find(
                                    (doc) => (doc.hash ?? doc.id) === selected,
                                )}
                                chipColor="secondary"
                            />
                        )}
                    >
                        {availableClinicalDocuments.length === 0 ? (
                            <MenuItem disabled>
                                <Typography color="text.secondary">
                                    No available documents (excluding published report)
                                </Typography>
                            </MenuItem>
                        ) : (
                            availableClinicalDocuments.map((document) => (
                                <MenuItem
                                    key={document.hash ?? document.id}
                                    value={document.hash ?? document.id}
                                >
                                    <DocumentSelectItem document={document} chipColor="secondary" />
                                </MenuItem>
                            ))
                        )}
                    </Select>
                </FormControl>
            )}

            {/* Upload New Document */}
            {clinicalDocumentMode === 'upload' && (
                <Upload
                    label="Upload Clinical Report"
                    value={data.clinical_comment_document}
                    name="clinical_comment_document"
                    editable={!processing}
                    onChange={setData}
                    accept={'.pdf'}
                    url={route('documents.store')}
                    placeholder="Select or drag and drop a PDF file"
                    icon={<CloudUploadOutlined />}
                />
            )}
        </Grid>
    </Grid>
);

export default ClinicalDocumentTab;
