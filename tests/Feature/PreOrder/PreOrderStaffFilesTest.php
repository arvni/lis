<?php

declare(strict_types=1);

namespace Tests\Feature\PreOrder;

use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Support\PreOrderSnapshot;
use App\Domains\User\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

/** BION staff attach any file except active content; internal files never reach the center. */
class PreOrderStaffFilesTest extends PreOrderTestCase
{
    private User $reviewer;

    private PreOrder $preOrder;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        $this->reviewer = User::factory()->create(['name' => 'Dr Reviewer']);
        foreach (['PreOrders.Cases.View', 'PreOrders.Cases.Review'] as $permission) {
            Permission::findOrCreate($permission);
            $this->reviewer->givePermissionTo($permission);
        }
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $this->preOrder = $this->workflow->submit($this->draft([$this->test('NIPT', 'nipt')]), $this->center());
    }

    private function attach(UploadedFile $file, bool $shared = false, string $tag = 'DOCUMENT', ?User $as = null, array $details = [])
    {
        return $this->actingAs($as ?? $this->reviewer)
            ->post(route('pre-orders.documents.store', $this->preOrder), ['file' => $file, 'tag' => $tag, 'shared' => $shared, 'title' => $file->getClientOriginalName(), ...$details]);
    }

    public function test_a_staff_file_needs_a_name_and_shows_its_name_and_details_instead_of_the_file_name(): void
    {
        $file = fn () => UploadedFile::fake()->createWithContent('scan_0042.pdf', "%PDF-1.4\n%%EOF\n");
        $this->attach($file(), details: ['title' => ''])->assertSessionHasErrors('title');

        $this->attach($file(), shared: true, details: ['title' => 'Signed consent (mother)', 'description' => "Signed on 24 Oct.\nThe father's copy follows."])
            ->assertSessionHasNoErrors();

        $shown = app(PreOrderSnapshot::class)->build($this->preOrder->refresh())['documents'][0];
        $this->assertSame('Signed consent (mother)', $shown['name']);
        $this->assertSame('scan_0042.pdf', $shown['file_name']);
        $this->assertSame("Signed on 24 Oct.\nThe father's copy follows.", $shown['description']);
        $this->assertContains('Signed consent (mother)', array_column(app(PreOrderSnapshot::class)->build($this->preOrder)['history'], 'body'));
    }

    /** @return list<string> */
    private function centerSees(): array
    {
        return array_column(app(PreOrderSnapshot::class)->build($this->preOrder->refresh())['documents'], 'name');
    }

    public function test_staff_attach_office_files_spreadsheets_and_text_kept_internal_or_shared(): void
    {
        $this->attach(UploadedFile::fake()->createWithContent('counselling notes.docx', "PK\x03\x04docx"))->assertSessionHasNoErrors();
        $this->attach(UploadedFile::fake()->createWithContent('variant table.xlsx', "PK\x03\x04xlsx"), shared: true)->assertSessionHasNoErrors();
        $this->attach(UploadedFile::fake()->createWithContent('family tree.csv', "name,relation\nA,mother\n"), shared: true, tag: 'MEDICAL_HISTORY')->assertSessionHasNoErrors();

        $this->assertEqualsCanonicalizing(['variant table.xlsx', 'family tree.csv'], $this->centerSees(), 'the internal file stays with BION');
        $history = app(PreOrderSnapshot::class)->build($this->preOrder)['history'];
        $this->assertNotContains('counselling notes.docx', array_column($history, 'body'));

        $this->actingAs($this->reviewer)->get(route('pre-orders.show', $this->preOrder))->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('canReview', true)
                ->has('preOrder.documents', 3)
                ->where('preOrder.documents', fn ($documents) => collect($documents)->sortBy('name')->mapWithKeys(fn ($d) => [$d['name'] => [$d['from'], $d['shared']]])->all() === [
                    'counselling notes.docx' => ['bion', false],
                    'family tree.csv' => ['bion', true],
                    'variant table.xlsx' => ['bion', true],
                ]));
    }

    public function test_html_svg_and_programs_are_refused_by_name_or_by_content(): void
    {
        $refused = [
            UploadedFile::fake()->createWithContent('page.html', '<html><script>alert(1)</script></html>'),
            UploadedFile::fake()->createWithContent('logo.svg', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
            // Renamed: the content still gives it away.
            UploadedFile::fake()->createWithContent('innocent.txt', '<!DOCTYPE html><html><body><script>alert(1)</script></body></html>'),
            UploadedFile::fake()->createWithContent('tool.exe', "MZ\x90\x00program"),
        ];
        foreach ($refused as $file) {
            $this->attach($file, shared: true)->assertSessionHasErrors('file');
        }

        $this->assertSame([], $this->centerSees());
        $this->assertSame(0, $this->preOrder->documents()->count());
    }

    public function test_only_reviewers_attach_files_and_bions_file_does_not_count_as_one_the_center_owes(): void
    {
        $viewer = User::factory()->create();
        Permission::findOrCreate('PreOrders.Cases.View');
        $viewer->givePermissionTo('PreOrders.Cases.View');
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $this->attach(UploadedFile::fake()->createWithContent('x.pdf', '%PDF-1.4'), as: $viewer)->assertForbidden();
        $this->attach(UploadedFile::fake()->createWithContent('x.pdf', '%PDF-1.4'), tag: 'AVATAR')->assertSessionHasErrors('tag');

        $stages = array_map(fn (array $s) => $s['stage'] === 'SUBMITTED' ? [...$s, 'required_documents' => ['CONSENT_FORM']] : $s, $this->preOrder->flow_stages);
        $this->preOrder->update(['flow_stages' => $stages]);
        $this->attach(UploadedFile::fake()->createWithContent('blank consent.pdf', '%PDF-1.4'), shared: true, tag: 'CONSENT_FORM')->assertSessionHasNoErrors();

        $stage = app(PreOrderSnapshot::class)->build($this->preOrder->refresh())['stage'];
        $this->assertSame([['tag' => 'CONSENT_FORM', 'uploaded' => false]], $stage['required_documents'], 'a blank form from BION is not the signed one');
    }
}
