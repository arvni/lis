import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';

import ScienceIcon from '@mui/icons-material/Science';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';

const TestSelectionStep = ({
    selectedTests,
    processing,
    onOpenTestModal,
    onRemoveTest,
    onPriceChange,
    onMethodSelect,
    onBack,
}) => (
    <>
        <Box
            sx={{
                mb: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}
        >
            <Box>
                <Typography variant="h6" gutterBottom>
                    <ScienceIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Tests for Patients
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    Add tests or panels that will be assigned to all imported patients
                </Typography>
            </Box>
            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onOpenTestModal}
                sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                }}
            >
                Add Test
            </Button>
        </Box>

        {/* Empty State */}
        {selectedTests.length === 0 && (
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <ScienceIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No Tests Added
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Click &quot;Add Test&quot; button to select tests for your patients
                        </Typography>
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={onOpenTestModal}>
                            Add Your First Test
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        )}

        {/* Selected Tests List */}
        {selectedTests.length > 0 && (
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                        Selected Tests ({selectedTests.length})
                    </Typography>
                    <List>
                        {selectedTests.map((test, index) => (
                            <Box key={index} sx={{ mb: 2 }}>
                                <ListItem
                                    secondaryAction={
                                        <IconButton edge="end" onClick={() => onRemoveTest(index)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    }
                                    sx={{
                                        borderBottom: '1px solid',
                                        borderColor: 'divider',
                                        pb: 2,
                                    }}
                                >
                                    <ListItemText
                                        primary={test.test?.name}
                                        secondary={
                                            <>
                                                <Typography
                                                    component="span"
                                                    variant="body2"
                                                    display="block"
                                                >
                                                    Type: {test.type}
                                                </Typography>
                                                {test.method && (
                                                    <Typography
                                                        component="span"
                                                        variant="body2"
                                                        display="block"
                                                    >
                                                        Method:{' '}
                                                        {test.method.method?.name ||
                                                            test.method.name ||
                                                            'N/A'}
                                                    </Typography>
                                                )}
                                                {test.sampleType && (
                                                    <Typography
                                                        component="span"
                                                        variant="body2"
                                                        display="block"
                                                    >
                                                        Sample Type: {test.sampleType}
                                                    </Typography>
                                                )}
                                            </>
                                        }
                                    />
                                </ListItem>

                                {/* Price Input */}
                                <Box sx={{ pl: 2, pr: 7, pt: 1, pb: 1 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        label="Price"
                                        value={test.price}
                                        onChange={(e) =>
                                            onPriceChange(index, parseFloat(e.target.value) || 0)
                                        }
                                        slotProps={{
                                            input: {
                                                endAdornment: (
                                                    <Typography variant="body2" sx={{ ml: 1 }}>
                                                        OMR
                                                    </Typography>
                                                ),
                                            },
                                        }}
                                    />
                                </Box>

                                {/* Method Selection for TEST and SERVICE */}
                                {(test.type === 'TEST' || test.type === 'SERVICE') &&
                                    test.test?.method_tests &&
                                    test.test.method_tests.length > 1 && (
                                        <Box sx={{ pl: 2, pr: 7, pt: 1 }}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel>Select Method</InputLabel>
                                                <Select
                                                    value={test.method?.id || ''}
                                                    onChange={(e) => {
                                                        const method = test.test.method_tests.find(
                                                            (m) => m.id === e.target.value,
                                                        );
                                                        onMethodSelect(index, {
                                                            method,
                                                            price: method.price,
                                                        });
                                                    }}
                                                    label="Select Method"
                                                >
                                                    {test.test.method_tests.map((method) => (
                                                        <MenuItem key={method.id} value={method.id}>
                                                            {method.method?.name || method.name} -{' '}
                                                            {method.price} OMR
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Box>
                                    )}
                            </Box>
                        ))}
                    </List>
                </CardContent>
            </Card>
        )}

        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
                variant="outlined"
                onClick={onBack}
                sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                }}
            >
                Back
            </Button>
            <Button
                type="submit"
                variant="contained"
                disabled={processing || selectedTests.length === 0}
                startIcon={processing ? <CircularProgress size={20} /> : <UploadFileIcon />}
                sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                }}
            >
                {processing ? 'Importing...' : 'Import Patients with Tests'}
            </Button>
        </Box>
    </>
);

export default TestSelectionStep;
