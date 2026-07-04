<?php

namespace Tests\Feature\Reception;

use App\Domains\Reception\DTOs\AcceptanceItemExportRow;
use App\Domains\Reception\Exports\AcceptanceItemsExport;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Tag;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection as SupportCollection;
use Tests\TestCase;

/**
 * Guards the DTO-normalization refactor of AcceptanceItemsExport (task #14):
 * both the single-row and merged-panel paths must produce byte-identical export
 * rows. Runs entirely in memory — relations are pre-set so the `status` accessor
 * never touches the database.
 */
class AcceptanceItemsExportTest extends TestCase
{
    /**
     * @param  array<string, mixed>  $attributes
     * @param  list<Tag>  $tags
     */
    private function makeItem(array $attributes, array $tags, string $barcode, ?string $patientName = null): AcceptanceItem
    {
        $item = new AcceptanceItem();
        $item->setRawAttributes(array_merge([
            'created_at' => Carbon::parse('2026-01-01 08:30:00'),
            'updated_at' => Carbon::parse('2026-01-02 09:00:00'),
        ], $attributes));

        $item->setRelation('tags', new EloquentCollection($tags));
        $item->setRelation('activeSamples', new SupportCollection([
            (object) ['barcode' => $barcode, 'collection_date' => '2026-01-01'],
        ]));
        $item->setRelation('invoice', null);

        $acceptance = null;
        if ($patientName !== null) {
            $acceptance = new Acceptance();
            $acceptance->setRelation('referrer', null);
            $acceptance->setRelation('patient', (object) ['fullName' => $patientName]);
        }
        $item->setRelation('acceptance', $acceptance);

        // Prevent getStatusAttribute() from hitting the DB.
        $item->setRelation('report', null);
        $item->setRelation('latestState', null);

        return $item;
    }

    public function test_single_and_merged_rows_map_to_expected_columns(): void
    {
        $tagA = (new Tag())->forceFill(['id' => 1, 'name' => 'Urgent']);
        $tagB = (new Tag())->forceFill(['id' => 2, 'name' => 'Repeat']);

        $standalone = $this->makeItem([
            'id' => 1, 'acceptance_id' => 5, 'panel_id' => null, 'price' => 40, 'discount' => 0,
            'patient_fullname' => 'Alice Doe', 'patient_idno' => 'A1', 'patient_dateofbirth' => '1990-01-01',
            'test_testsname' => 'CBC', 'method_name' => 'Flow', 'method_turnaround_time' => 2,
        ], [$tagA], 'BC-1', 'Alice Doe');

        // Two items sharing acceptance + panel → merged into one row.
        $panelOne = $this->makeItem([
            'id' => 2, 'acceptance_id' => 10, 'panel_id' => 'P1', 'price' => 30, 'discount' => 5,
            'patient_fullname' => 'Bob Roe', 'patient_idno' => 'B2', 'patient_dateofbirth' => '1985-05-05',
            'test_testsname' => 'Panel A', 'method_name' => 'PCR', 'method_turnaround_time' => 3,
        ], [$tagA], 'BC-2', 'Bob Roe');
        $panelTwo = $this->makeItem([
            'id' => 3, 'acceptance_id' => 10, 'panel_id' => 'P1', 'price' => 20, 'discount' => 5,
            'patient_fullname' => 'Bob Roe', 'patient_idno' => 'B2', 'patient_dateofbirth' => '1985-05-05',
            'test_testsname' => 'Panel A', 'method_name' => 'PCR', 'method_turnaround_time' => 3,
        ], [$tagA, $tagB], 'BC-3', 'Bob Roe');

        $export = new AcceptanceItemsExport(new EloquentCollection([$standalone, $panelOne, $panelTwo]));

        $rows = $export->collection();
        $this->assertCount(2, $rows, 'standalone item + one merged panel row');

        $mapped = $rows->map(fn ($row) => $export->map($row))->values();

        // Row 0 — standalone
        $single = $mapped[0];
        $this->assertSame(1, $single[0]);
        $this->assertSame('Alice Doe', $single[1]);       // client name (patient)
        $this->assertSame('Alice Doe', $single[2]);       // patient_fullname
        $this->assertSame('CBC', $single[5]);             // test name
        $this->assertSame('Urgent', $single[7]);          // tags
        $this->assertSame('40.00', $single[8]);           // price
        $this->assertSame('0.00', $single[9]);            // discount
        $this->assertSame('BC-1', $single[11]);           // barcodes
        $this->assertSame('-', $single[12]);              // status
        $this->assertSame('', $single[13]);               // invoice no (no invoice)

        // Row 1 — merged: price/discount summed, tags unioned
        $merged = $mapped[1];
        $this->assertSame(2, $merged[0]);                 // identity of first item
        $this->assertSame('Bob Roe', $merged[2]);
        $this->assertSame('Panel A', $merged[5]);
        $this->assertSame('Urgent, Repeat', $merged[7]);  // tag union, unique by id
        $this->assertSame('50.00', $merged[8]);           // 30 + 20
        $this->assertSame('10.00', $merged[9]);           // 5 + 5
    }

    public function test_from_merged_group_sums_and_unions(): void
    {
        $tagA = (new Tag())->forceFill(['id' => 1, 'name' => 'A']);
        $tagB = (new Tag())->forceFill(['id' => 2, 'name' => 'B']);

        $one = $this->makeItem([
            'id' => 7, 'acceptance_id' => 3, 'panel_id' => 'PX', 'price' => 12, 'discount' => 1,
            'patient_fullname' => 'Carol', 'test_testsname' => 'T', 'method_name' => 'M',
            'method_turnaround_time' => 1,
        ], [$tagA], 'X1', 'Carol');
        $two = $this->makeItem([
            'id' => 8, 'acceptance_id' => 3, 'panel_id' => 'PX', 'price' => 8, 'discount' => 2,
            'patient_fullname' => 'Carol', 'test_testsname' => 'T', 'method_name' => 'M',
            'method_turnaround_time' => 1,
        ], [$tagA, $tagB], 'X2', 'Carol');

        $row = AcceptanceItemExportRow::fromMergedGroup(new EloquentCollection([$one, $two]));

        $this->assertSame(7, $row->id);              // first item's identity
        $this->assertSame(20, $row->price);          // 12 + 8
        $this->assertSame(3, $row->discount);        // 1 + 2
        $this->assertCount(2, $row->tags);           // unique by id
    }
}
