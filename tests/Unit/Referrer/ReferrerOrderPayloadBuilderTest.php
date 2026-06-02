<?php

namespace Tests\Unit\Referrer;

use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Models\Sample;
use App\Domains\Referrer\Models\ReferrerOrder;
use App\Domains\Referrer\Support\ReferrerOrderPayloadBuilder;
use Illuminate\Database\Eloquent\Collection;
use Tests\TestCase;

class ReferrerOrderPayloadBuilderTest extends TestCase
{
    /**
     * The payload must only include acceptance items that are actually
     * sampled — items flagged `sampleless` or carrying zero samples are
     * skipped.
     */
    public function test_payload_skips_sampleless_and_zero_sample_items(): void
    {
        $patient = $this->makePatient(1);

        // A: normal item with a sample → included
        $sampledItem = $this->makeItem(10, sampleless: false, samples: [
            $this->makeSample(100, $patient->id),
        ], patient: $patient);

        // B: sampleless item (with samples present) → skipped by the flag
        $samplelessItem = $this->makeItem(20, sampleless: true, samples: [
            $this->makeSample(200, $patient->id),
        ], patient: $patient);

        // C: normal item but with no samples → skipped by the count check
        $emptyItem = $this->makeItem(30, sampleless: false, samples: [], patient: $patient);

        $acceptance = new Acceptance();
        $acceptance->id = 5;
        $acceptance->referrer_id = 7;
        $acceptance->referenceCode = 'REF-5';
        $acceptance->status = AcceptanceStatus::PROCESSING;
        $acceptance->setRelation('patient', $patient);
        $acceptance->setRelation('acceptanceItems', new Collection([
            $sampledItem,
            $samplelessItem,
            $emptyItem,
        ]));

        $referrerOrder = new ReferrerOrder();
        $referrerOrder->id = 99;
        $referrerOrder->setRelation('collectRequest', null);

        $payload = ReferrerOrderPayloadBuilder::build($acceptance, $referrerOrder);

        $orderItems = $payload['order']['orderItems'];

        // Only the sampled item survives.
        $this->assertCount(1, $orderItems);
        $this->assertSame(10, $orderItems[0]['id']);
        $this->assertCount(1, $orderItems[0]['samples']);
        $this->assertSame(100, $orderItems[0]['samples'][0]['id']);

        // Each sample must expose its collect_request_id.
        $this->assertArrayHasKey('collect_request_id', $orderItems[0]['samples'][0]);
        $this->assertSame(42, $orderItems[0]['samples'][0]['collect_request_id']);

        // The sampleless and empty item group ids must be absent.
        $ids = array_column($orderItems, 'id');
        $this->assertNotContains(20, $ids);
        $this->assertNotContains(30, $ids);
    }

    /**
     * When every item is sampleless or unsampled, the payload carries no
     * order items and hasSendableItems() reports false — the signal the
     * listeners and service use to skip sending / creating.
     */
    public function test_payload_is_empty_when_no_sendable_items(): void
    {
        $patient = $this->makePatient(1);

        $acceptance = new Acceptance();
        $acceptance->id = 5;
        $acceptance->referrer_id = 7;
        $acceptance->referenceCode = 'REF-5';
        $acceptance->status = AcceptanceStatus::PROCESSING;
        $acceptance->setRelation('patient', $patient);
        $acceptance->setRelation('acceptanceItems', new Collection([
            $this->makeItem(20, sampleless: true, samples: [
                $this->makeSample(200, $patient->id),
            ], patient: $patient),
            $this->makeItem(30, sampleless: false, samples: [], patient: $patient),
        ]));

        $referrerOrder = new ReferrerOrder();
        $referrerOrder->id = 99;
        $referrerOrder->setRelation('collectRequest', null);

        $payload = ReferrerOrderPayloadBuilder::build($acceptance, $referrerOrder);

        $this->assertSame([], $payload['order']['orderItems']);
        $this->assertFalse(ReferrerOrderPayloadBuilder::hasSendableItems($acceptance));
    }

    private function makePatient(int $id): Patient
    {
        $patient = new Patient();
        $patient->id = $id;
        $patient->fullName = "Patient {$id}";
        $patient->idNo = "ID{$id}";
        $patient->nationality = 'Testland';
        $patient->dateOfBirth = '1990-01-01';
        $patient->gender = 'male';

        return $patient;
    }

    private function makeSample(int $id, int $patientId): Sample
    {
        $sample = new Sample();
        $sample->id = $id;
        $sample->barcode = "BC{$id}";
        $sample->patient_id = $patientId;
        $sample->collection_date = '2026-06-01';
        $sample->collect_request_id = 42;
        $sample->sample_type_id = 3;
        $sample->setRelation('sampleType', null);

        return $sample;
    }

    private function makeItem(int $id, bool $sampleless, array $samples, Patient $patient): AcceptanceItem
    {
        $test = new Test();
        $test->id = 1000 + $id;
        $test->name = "Test {$id}";
        $test->code = "T{$id}";

        $methodTest = new MethodTest();
        $methodTest->setRelation('test', $test);

        $item = new AcceptanceItem();
        $item->id = $id;
        $item->panel_id = null;
        $item->reportless = false;
        $item->sampleless = $sampleless;
        $item->setRelation('methodTest', $methodTest);
        $item->setRelation('patients', new Collection([$patient]));
        $item->setRelation('samples', new Collection($samples));

        return $item;
    }
}
