<?php

namespace Tests\Feature\Reception;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Models\Tag;
use App\Domains\Reception\Services\TagService;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class TagServiceTest extends TestCase
{
    use RefreshDatabase;

    private TagService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
        $this->service = new TagService();
    }

    // ── listTags ───────────────────────────────────────────────────────────────

    public function test_list_tags_returns_all_ordered_by_name(): void
    {
        Tag::create(['name' => 'Zebra']);
        Tag::create(['name' => 'Apple']);

        $tags = $this->service->listTags();

        $this->assertSame(['Apple', 'Zebra'], $tags->pluck('name')->all());
    }

    public function test_list_tags_respects_page_size_limit(): void
    {
        foreach (['Aa', 'Bb', 'Cc'] as $name) {
            Tag::create(['name' => $name]);
        }

        $tags = $this->service->listTags(['pageSize' => 2]);

        $this->assertCount(2, $tags);
    }

    public function test_list_tags_filters_by_nested_search(): void
    {
        Tag::create(['name' => 'Urgent']);
        Tag::create(['name' => 'Routine']);

        $tags = $this->service->listTags(['filters' => ['search' => 'Urg']]);

        $this->assertSame(['Urgent'], $tags->pluck('name')->all());
    }

    public function test_list_tags_filters_by_top_level_search(): void
    {
        Tag::create(['name' => 'Urgent']);
        Tag::create(['name' => 'Routine']);

        $tags = $this->service->listTags(['search' => 'Rout']);

        $this->assertSame(['Routine'], $tags->pluck('name')->all());
    }

    // ── syncTags ───────────────────────────────────────────────────────────────

    public function test_sync_tags_creates_and_attaches_tags(): void
    {
        $acceptance = $this->makeAcceptance();

        $result = $this->service->syncTags($acceptance, ['Blood', 'Urine']);

        $this->assertSame(['Blood', 'Urine'], $result->pluck('name')->all());
        $this->assertDatabaseHas('tags', ['name' => 'Blood']);
        $this->assertCount(2, $acceptance->tags()->get());
    }

    public function test_sync_tags_deduplicates_case_insensitively(): void
    {
        $acceptance = $this->makeAcceptance();

        $result = $this->service->syncTags($acceptance, ['Blood', 'blood', '  BLOOD ']);

        // All normalize to the same tag → only one attached.
        $this->assertCount(1, $result);
        $this->assertSame(1, Tag::count());
    }

    public function test_sync_tags_reuses_existing_tag(): void
    {
        $existing = Tag::create(['name' => 'Existing']);
        $acceptance = $this->makeAcceptance();

        $this->service->syncTags($acceptance, ['existing']);

        $this->assertSame(1, Tag::count());
        $this->assertTrue($acceptance->tags()->where('tags.id', $existing->id)->exists());
    }

    public function test_sync_tags_replaces_previous_tags(): void
    {
        $acceptance = $this->makeAcceptance();
        $this->service->syncTags($acceptance, ['Old']);

        $result = $this->service->syncTags($acceptance, ['New']);

        $this->assertSame(['New'], $result->pluck('name')->all());
        $this->assertCount(1, $acceptance->tags()->get());
    }

    public function test_sync_tags_throws_on_invalid_characters(): void
    {
        $acceptance = $this->makeAcceptance();

        $this->expectException(ValidationException::class);
        $this->service->syncTags($acceptance, ['bad@name!']);
    }

    public function test_sync_tags_throws_on_empty_name(): void
    {
        $acceptance = $this->makeAcceptance();

        $this->expectException(ValidationException::class);
        $this->service->syncTags($acceptance, ['   ']);
    }

    // ── Inverse (taggable) relations on the Tag model ────────────────────────────
    // These return a MorphToMany; the model previously type-hinted a non-existent
    // MorphedByMany class, so calling them would have fatally errored.

    public function test_tag_acceptances_relation_resolves_tagged_acceptances(): void
    {
        $acceptance = $this->makeAcceptance();
        $this->service->syncTags($acceptance, ['Urgent']);
        $tag = Tag::firstWhere('name', 'Urgent');

        $this->assertInstanceOf(MorphToMany::class, $tag->acceptances());
        $this->assertTrue($tag->acceptances()->where('acceptances.id', $acceptance->id)->exists());
    }

    public function test_tag_acceptance_items_relation_returns_morph_to_many(): void
    {
        $tag = Tag::create(['name' => 'Pooled']);

        $this->assertInstanceOf(MorphToMany::class, $tag->acceptanceItems());
        $this->assertCount(0, $tag->acceptanceItems()->get());
    }

    private function makeAcceptance(): Acceptance
    {
        $patient = Patient::create([
            'fullName'     => 'Tag Patient',
            'idNo'         => 'TAG' . uniqid(),
            'nationality'  => 'OM',
            'dateOfBirth'  => '1990-01-01',
            'gender'       => 'male',
            'registrar_id' => auth()->id(),
        ]);

        return Acceptance::create([
            'status'              => \App\Domains\Reception\Enums\AcceptanceStatus::PENDING,
            'step'                => 5,
            'patient_id'          => $patient->id,
            'acceptor_id'         => auth()->id(),
            'financial_approved'  => false,
            'out_patient'         => false,
            'waiting_for_pooling' => false,
        ]);
    }
}
