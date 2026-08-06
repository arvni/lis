import { describe, it, expect } from 'vitest';
import { hasDeliveryMethods } from './Publish.jsx';

/**
 * The publishing queue used to hardcode `whatsapp || email || sendToReferrer` in
 * three separate places, so an acceptance with only `howReport.sms` rendered a
 * "No delivery method" chip, lost its Quick Publish action and was counted under
 * the "No Delivery" stat. `sms` is the key PatientReportPublished::via() reads,
 * so it must count as deliverable.
 */
describe('Report/Publish — hasDeliveryMethods', () => {
    it('counts an SMS-only acceptance as deliverable', () => {
        expect(hasDeliveryMethods({ sms: true })).toBe(true);
    });

    it.each([
        ['whatsapp', { whatsapp: true }],
        ['email', { email: true }],
        ['sendToReferrer', { sendToReferrer: true }],
    ])('counts %s as deliverable', (_label, howReport) => {
        expect(hasDeliveryMethods(howReport)).toBe(true);
    });

    it('does not count print, which publishing has no channel for', () => {
        expect(hasDeliveryMethods({ print: true, printReceiver: 'Front desk' })).toBe(false);
    });

    it('ignores falsy flags rather than treating the key as present', () => {
        expect(hasDeliveryMethods({ sms: false, whatsapp: false })).toBe(false);
    });

    it('treats a referrer-panel acceptance with no patient channel as undeliverable', () => {
        expect(hasDeliveryMethods({ sendToReferrer: false })).toBe(false);
    });

    it('handles a missing or empty howReport', () => {
        expect(hasDeliveryMethods(undefined)).toBe(false);
        expect(hasDeliveryMethods(null)).toBe(false);
        expect(hasDeliveryMethods({})).toBe(false);
    });
});
