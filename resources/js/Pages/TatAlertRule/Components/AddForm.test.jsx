import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useForm } from '@inertiajs/react';
import SelectSearch from '@/Components/SelectSearch';
import AddForm from '@/Pages/TatAlertRule/Components/AddForm';

vi.mock('@inertiajs/react', () => ({ useForm: vi.fn() }));

// The real picker fetches over axios; the form only decides what it searches and shows.
vi.mock('@/Components/SelectSearch', () => ({
    default: vi.fn(({ label }) => <div>{label}</div>),
}));

const emptyAlert = { name: '', days_left: 1, active: true, tests: [], users: [], roles: [] };

let form;

const mockForm = (overrides = {}) => {
    form = {
        data: emptyAlert,
        setData: vi.fn(),
        post: vi.fn(),
        processing: false,
        errors: {},
        reset: vi.fn(),
        clearErrors: vi.fn(),
        setError: vi.fn(),
        ...overrides,
    };
    vi.mocked(useForm).mockReturnValue(form);
};

const renderForm = (defaultValue = null) =>
    render(<AddForm open onClose={vi.fn()} defaultValue={defaultValue} />);

const picker = (name) =>
    vi
        .mocked(SelectSearch)
        .mock.calls.map(([pickerProps]) => pickerProps)
        .filter((pickerProps) => pickerProps.name === name)
        .at(-1);

const lastUpdate = () =>
    form.setData.mock.calls.filter(([arg]) => typeof arg === 'function').at(-1)[0];

beforeEach(() => {
    vi.clearAllMocks();
    mockForm();
});

describe('TatAlertRule AddForm', () => {
    it('starts a new alert at one working day, active, with nothing picked', () => {
        renderForm();

        expect(useForm).toHaveBeenCalledWith(emptyAlert);
        expect(screen.getByRole('heading', { name: 'Add New TAT Alert' })).toBeInTheDocument();
    });

    it('posts a new alert to the store route', () => {
        // The name is a required input, so the browser only submits once it is filled.
        mockForm({ data: { ...emptyAlert, name: 'Cultures due soon' } });
        renderForm();
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

        expect(form.post).toHaveBeenCalledWith(
            '/tat-alert-rules.store',
            expect.objectContaining({ preserveScroll: true }),
        );
    });

    it('posts an edited alert to its update route', () => {
        const rule = { ...emptyAlert, id: 7, name: 'Cultures due soon', _method: 'put' };
        mockForm({ data: rule });
        renderForm(rule);

        expect(screen.getByRole('heading', { name: 'Edit TAT Alert' })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
        expect(form.post).toHaveBeenCalledWith('/tat-alert-rules.update/7', expect.any(Object));
    });

    // A validation error re-renders the page; that must not reset what the user entered.
    it('keeps the entered values when the page re-renders with the same alert', () => {
        const onClose = vi.fn();
        const { rerender } = render(<AddForm open onClose={onClose} defaultValue={null} />);
        form.setData.mockClear();

        rerender(<AddForm open onClose={onClose} defaultValue={null} />);

        expect(form.setData).not.toHaveBeenCalled();
    });

    it('searches tests, users and roles, each allowing several picks', () => {
        renderForm();

        expect(picker('tests')).toMatchObject({ url: '/api.tests.list', multiple: true });
        expect(picker('users')).toMatchObject({ url: '/api.users.list', multiple: true });
        expect(picker('roles')).toMatchObject({ url: '/api.roles.list', multiple: true });
    });

    it('keeps the picked tests in the form data', () => {
        renderForm();
        picker('tests').onChange({ target: { name: 'tests', value: [{ id: 1, name: 'CBC' }] } });

        expect(lastUpdate()({ tests: [] })).toEqual({ tests: [{ id: 1, name: 'CBC' }] });
    });

    it('shows the missing-test error on the tests picker', () => {
        mockForm({ errors: { tests: 'Select at least one test.' } });
        renderForm();

        expect(picker('tests')).toMatchObject({
            error: true,
            helperText: 'Select at least one test.',
        });
    });

    it('flags both recipient pickers when nobody was chosen to notify', () => {
        const message = 'Select at least one user or role to notify.';
        mockForm({ errors: { users: message, roles: message } });
        renderForm();

        expect(picker('users')).toMatchObject({ error: true, helperText: message });
        expect(picker('roles')).toMatchObject({ error: true, helperText: message });
    });

    it('updates the threshold and can pause the alert', () => {
        renderForm();

        fireEvent.change(screen.getByLabelText(/Notify when TAT left is at most/), {
            target: { value: '3' },
        });
        expect(lastUpdate()({ days_left: 1 })).toEqual({ days_left: '3' });

        fireEvent.click(document.querySelector('input[name="active"]'));
        expect(lastUpdate()({ active: true })).toEqual({ active: false });
    });
});
