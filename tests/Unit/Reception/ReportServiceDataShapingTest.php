<?php

namespace Tests\Unit\Reception;

use App\Domains\Reception\Services\ReportDataService;
use Tests\TestCase;

/**
 * Pure-transform coverage for the report-data shaping helpers — the
 * placeholder-key builders that feed the Word/PDF report templates. These were
 * extracted from ReportService into ReportDataService (improvement-plan #26);
 * the approval-flow Feature test (ReportApprovalFlowTest) never exercises them.
 * No DB is touched: the helpers operate on plain collections/objects, so
 * lightweight stand-ins are passed in.
 */
class ReportServiceDataShapingTest extends TestCase
{
    private ReportDataService $service;

    protected function setUp(): void
    {
        parent::setUp();
        // ReportDataService has no injected dependencies; the pure shaping
        // helpers under test touch no collaborators, so no mocking is required.
        $this->service = app(ReportDataService::class);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // prepareReferrer
    // ─────────────────────────────────────────────────────────────────────────

    public function test_prepare_referrer_prefers_billing_info(): void
    {
        $referrer = (object) [
            'billingInfo' => [
                'name' => 'Billing Co',
                'address' => '1 Lab St',
                'vatIn' => 'VAT-123',
                'phone' => '999',
                'email' => 'billing@example.com',
                'city' => 'Muscat',
                'country' => 'OM',
            ],
            'fullName' => 'Fallback Name',
            'phoneNo' => '111',
            'email' => 'fallback@example.com',
        ];

        $result = $this->service->prepareReferrer($referrer);

        $this->assertSame('Billing Co', $result['referrer_name']);
        $this->assertSame('1 Lab St', $result['address']);
        $this->assertSame('VAT-123', $result['vatIn']);
        $this->assertSame('999', $result['phone']);
        $this->assertSame('billing@example.com', $result['email']);
        $this->assertSame('Muscat', $result['city']);
        $this->assertSame('OM', $result['country']);
    }

    public function test_prepare_referrer_falls_back_to_referrer_fields(): void
    {
        // billingInfo missing the keys → name/phone/email fall back to the
        // referrer's own columns; address/vatIn/city/country default to N/A.
        $referrer = (object) [
            'billingInfo' => [],
            'fullName' => 'Dr Fallback',
            'phoneNo' => '111',
            'email' => 'fallback@example.com',
        ];

        $result = $this->service->prepareReferrer($referrer);

        $this->assertSame('Dr Fallback', $result['referrer_name']);
        $this->assertSame('111', $result['phone']);
        $this->assertSame('fallback@example.com', $result['email']);
        $this->assertSame('N/A', $result['address']);
        $this->assertSame('N/A', $result['vatIn']);
        $this->assertSame('N/A', $result['city']);
        $this->assertSame('N/A', $result['country']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // preparePatientData
    // ─────────────────────────────────────────────────────────────────────────

    public function test_prepare_patient_data_returns_placeholder_when_empty(): void
    {
        $result = $this->service->preparePatientData(collect([]));

        $this->assertSame(['patient_0_full_name' => 'No patient data available'], $result);
    }

    public function test_prepare_patient_data_maps_indexed_placeholder_keys(): void
    {
        $patients = collect([
            (object) [
                'fullName' => 'Alice A',
                'idNo' => 'ID-1',
                'gender' => 'female',
                'dateOfBirth' => '1990-01-15',
                'nationality' => 'OM',
                'age' => 36,
            ],
            (object) [
                'fullName' => 'Bob B',
                'idNo' => 'ID-2',
                'gender' => 'male',
                'dateOfBirth' => '1985-06-20',
                'nationality' => 'US',
                'age' => 40,
            ],
        ]);

        $result = $this->service->preparePatientData($patients);

        $this->assertSame('Alice A', $result['patient_0_full_name']);
        $this->assertSame('ID-1', $result['patient_0_no_id']);
        $this->assertSame('female', $result['patient_0_gender']);
        $this->assertSame('15 Jan 1990', $result['patient_0_date_of_birth']);
        $this->assertSame('OM', $result['patient_0_nationality']);
        $this->assertSame(36, $result['patient_0_age']);

        // Second patient is suffixed with its index.
        $this->assertSame('Bob B', $result['patient_1_full_name']);
        $this->assertSame('20 Jun 1985', $result['patient_1_date_of_birth']);
    }

    public function test_prepare_patient_data_defaults_missing_scalar_fields_to_na(): void
    {
        $patients = collect([
            (object) ['dateOfBirth' => '2000-12-31'],
        ]);

        $result = $this->service->preparePatientData($patients);

        $this->assertSame('N/A', $result['patient_0_full_name']);
        $this->assertSame('N/A', $result['patient_0_no_id']);
        $this->assertSame('N/A', $result['patient_0_gender']);
        $this->assertSame('N/A', $result['patient_0_nationality']);
        $this->assertSame('N/A', $result['patient_0_age']);
        // The date is still parsed from the one field present.
        $this->assertSame('31 Dec 2000', $result['patient_0_date_of_birth']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // prepareSigners
    // ─────────────────────────────────────────────────────────────────────────

    public function test_prepare_signers_returns_empty_images_when_none(): void
    {
        $this->assertSame(['images' => []], $this->service->prepareSigners(collect([])));
    }

    public function test_prepare_signers_maps_by_row_and_collects_images(): void
    {
        $signers = collect([
            (object) [
                'row' => 1,
                'name' => 'Dr One',
                'title' => 'Pathologist',
                'signature' => '/sig/one.png',
                'stamp' => '/stamp/one.png',
            ],
            // No signature/stamp → only name/title keys, no image entries.
            (object) [
                'row' => 2,
                'name' => 'Dr Two',
                'title' => 'Consultant',
                'signature' => '',
                'stamp' => null,
            ],
        ]);

        $result = $this->service->prepareSigners($signers);

        $this->assertSame('Dr One', $result['signer_1_name']);
        $this->assertSame('Pathologist', $result['signer_1_title']);
        $this->assertSame('Dr Two', $result['signer_2_name']);

        // Images are keyed by row and absolute-URL'd; only the first signer has any.
        $this->assertSame(url('/sig/one.png'), $result['images']['signer_1_signature']);
        $this->assertSame(url('/stamp/one.png'), $result['images']['signer_1_stamp']);
        $this->assertArrayNotHasKey('signer_2_signature', $result['images']);
        $this->assertArrayNotHasKey('signer_2_stamp', $result['images']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // formatDocumentFiles
    // ─────────────────────────────────────────────────────────────────────────

    public function test_format_document_files_maps_to_frontend_shape(): void
    {
        $documents = collect([
            [
                'hash' => 'abc123',
                'originalName' => 'result.pdf',
                'tag' => 'published',
                'created_at' => '2026-06-01',
                'extra' => 'dropped',
            ],
        ]);

        $result = $this->service->formatDocumentFiles($documents)->all();

        $this->assertSame([
            [
                'id' => 'abc123',
                'originalName' => 'result.pdf',
                'tag' => 'published',
                'created_at' => '2026-06-01',
            ],
        ], $result);
    }
}
