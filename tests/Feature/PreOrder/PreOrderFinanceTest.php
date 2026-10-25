<?php

declare(strict_types=1);

namespace Tests\Feature\PreOrder;

use App\Domains\PreOrder\DTOs\CreatePreOrderDTO;
use App\Domains\PreOrder\DTOs\FinanceDecisionDTO;
use App\Domains\PreOrder\DTOs\QuoteDTO;
use App\Domains\PreOrder\DTOs\RaiseRequestDTO;
use App\Domains\PreOrder\Enums\ActionOwner;
use App\Domains\PreOrder\Enums\ActionStatus;
use App\Domains\PreOrder\Enums\ExceptionType;
use App\Domains\PreOrder\Enums\FinanceStatus;
use App\Domains\PreOrder\Enums\ItemStatus;
use App\Domains\PreOrder\Enums\PreOrderStage;
use App\Domains\PreOrder\Enums\RequestStatus;
use App\Domains\PreOrder\Events\PreOrderActionProcessed;
use App\Domains\PreOrder\Events\PreOrderChanged;
use App\Domains\PreOrder\Events\QuotationDecided;
use App\Domains\PreOrder\Events\QuotationSent;
use App\Domains\PreOrder\Exceptions\PreOrderRuleException;
use App\Domains\PreOrder\Models\Flow;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Models\PreOrderAction;
use App\Domains\PreOrder\Models\PreOrderQuotation;
use App\Domains\PreOrder\Services\PreOrderInbox;
use App\Domains\PreOrder\Support\PreOrderSnapshot;
use App\Domains\PreOrder\Support\QuotationPdf;
use App\Domains\Referrer\Events\ReferrerOrderUpdated;
use App\Domains\User\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

class PreOrderFinanceTest extends PreOrderTestCase
{
    private int $pgtm;

    private int $karyotype;

    protected function setUp(): void
    {
        parent::setUp();
        // Re-faking replaces the base case's list, so it is repeated here with the finance event.
        Event::fake([PreOrderChanged::class, PreOrderActionProcessed::class, ReferrerOrderUpdated::class, QuotationDecided::class, QuotationSent::class]);
        $this->pgtm = $this->test('PGTM', 'pgt_m', price: 900);
        // A ride-along test the center may order with PGT-M, but that can't lead the case.
        $this->karyotype = $this->test('KARYO', 'pgt_m', canBeMain: false, price: 50);
        // PGT-M asks how many genes; two or more raises the price.
        DB::table('tests')->where('id', $this->pgtm)->update(['preorder' => json_encode([
            'can_be_main' => true,
            'scope' => [['key' => 'genes', 'label' => 'Genes', 'type' => 'number', 'needs_finance' => true, 'threshold' => 2]],
        ])]);
    }

    /** A center-chosen PGT-M case in review, with the gene count the center answered. */
    private function inReview(int $genes, bool $withKaryotype = true): PreOrder
    {
        $tests = [['test_id' => $this->pgtm]];
        if ($withKaryotype) {
            $tests[] = ['test_id' => $this->karyotype, 'patient_ref' => 'P2'];
        }
        $preOrder = $this->workflow->createDraft($this->referrerId, CreatePreOrderDTO::fromArray([
            'start_mode' => 'tests',
            'patients' => [
                ['ref' => 'P1', 'fullName' => 'Mother Example', 'gender' => 'female'],
                ['ref' => 'P2', 'fullName' => 'Father Example', 'gender' => 'male'],
            ],
            'tests' => $tests,
            'scope' => [(string) $this->pgtm => ['genes' => $genes]],
        ]), $this->center());
        $preOrder = $this->workflow->submit($preOrder, $this->center());

        return $this->workflow->openReview($preOrder, $this->bion());
    }

    private function decide(PreOrder $preOrder, string $number, string $decision, array $extra = []): PreOrder
    {
        return $this->workflow->decideFinance($preOrder, FinanceDecisionDTO::fromArray(['quotation' => $number, 'decision' => $decision, ...$extra]), $this->center());
    }

    private function quotation(PreOrder $preOrder, ?string $number = null): PreOrderQuotation
    {
        $query = $preOrder->quotations()->with('items');

        return $number ? $query->where('number', $number)->firstOrFail() : $query->latest('id')->firstOrFail();
    }

    private function assertRule(\Closure $action, string $message): void
    {
        try {
            $action();
        } catch (PreOrderRuleException $e) {
            $this->assertStringContainsString($message, $e->getMessage());

            return;
        }
        $this->fail("Expected a rule error containing \"$message\".");
    }

    public function test_tests_the_center_chose_with_an_ordinary_scope_go_straight_to_the_lab(): void
    {
        $preOrder = $this->workflow->confirmTests($this->inReview(genes: 1), $this->bion());

        $this->assertSame(PreOrderStage::AWAITING_SAMPLES, $preOrder->stage);
        $this->assertSame(0, $preOrder->quotations()->count());
        $this->assertNotContains('AWAITING_FINANCE', array_column(app(PreOrderSnapshot::class)->build($preOrder)['progress'], 'code'));
    }

    /** The plan's "done when": genes = 2 opens a quotation, partial approval goes back to review. */
    public function test_a_scope_that_raises_the_price_needs_approval_and_a_partial_one_returns_to_review(): void
    {
        $preOrder = $this->workflow->confirmTests($this->inReview(genes: 2), $this->bion(), new QuoteDTO('Two genes need two probe sets', '50'));

        $this->assertSame(PreOrderStage::AWAITING_FINANCE, $preOrder->stage);
        $this->assertSame(ActionOwner::CENTER, $preOrder->action_owner);
        $quotation = $this->quotation($preOrder);
        $this->assertSame(sprintf('Q-%s-%04d', now()->format('y'), $preOrder->id), $quotation->number);
        $this->assertSame(['scope'], $quotation->reasons);
        $this->assertSame('950.000', (string) $quotation->subtotal);
        $this->assertSame('900.000', (string) $quotation->total);
        $this->assertTrue($quotation->expires_at->isSameDay(now()->addDays(30)));

        $snapshot = app(PreOrderSnapshot::class)->build($preOrder);
        $this->assertSame($quotation->number, $snapshot['quotations'][0]['number']);
        $this->assertSame('900.000', $snapshot['quotations'][0]['lines'][0]['unit_price']);
        $this->assertContains('AWAITING_FINANCE', array_column($snapshot['progress'], 'code'));

        $pgtLine = $quotation->items->firstWhere('test_id', $this->pgtm);
        $preOrder = $this->decide($preOrder, $quotation->number, 'partial', ['items' => [$pgtLine->id], 'center_reference' => 'PO-7781']);

        $this->assertSame(PreOrderStage::UNDER_REVIEW, $preOrder->stage);
        $quotation->refresh();
        $this->assertSame(FinanceStatus::PARTIALLY_APPROVED, $quotation->status);
        // 900 of 950 kept, less its share of the 50 discount.
        $this->assertSame('852.632', (string) $quotation->approved_amount);
        $this->assertSame('PO-7781', $quotation->center_reference);
        $this->assertSame('Center nurse', $quotation->decided_by);
        $this->assertSame(ItemStatus::APPROVED, $pgtLine->refresh()->status);
        Event::assertDispatched(QuotationDecided::class);

        // BION drops the line the center didn't approve; the approved one is not asked again.
        $karyoLine = $quotation->items->firstWhere('test_id', $this->karyotype);
        $preOrder = $this->workflow->dropItem($preOrder, $karyoLine->id, 'Center declined', $this->bion());
        $preOrder = $this->workflow->confirmTests($preOrder, $this->bion());

        $this->assertSame(PreOrderStage::AWAITING_SAMPLES, $preOrder->stage);
        $this->assertSame(1, $preOrder->quotations()->count());
        $this->assertSame(ItemStatus::RELEASED, $pgtLine->refresh()->status);
        $this->assertSame($preOrder->code.'-M1', $pgtLine->release_key);
    }

    public function test_approval_releases_the_quoted_lines(): void
    {
        $preOrder = $this->workflow->confirmTests($this->inReview(genes: 3), $this->bion());
        $number = $this->quotation($preOrder)->number;

        $preOrder = $this->decide($preOrder, $number, 'approve');

        $this->assertSame(PreOrderStage::AWAITING_SAMPLES, $preOrder->stage);
        $this->assertSame('950.000', (string) $this->quotation($preOrder)->approved_amount);
        $this->assertSame(2, $preOrder->items()->where('status', 'released')->count());
        $this->assertRule(fn () => $this->decide($preOrder, $number, 'approve'), 'is Approved');
    }

    public function test_a_flow_with_the_bion_check_waits_for_finance_before_releasing(): void
    {
        $flow = Flow::query()->where('family', 'pgt_m')->firstOrFail();
        $flow->stages = array_map(fn (array $s) => $s['stage'] === 'FINANCE_VERIFY' ? [...$s, 'mode' => 'on'] : $s, $flow->stages);
        $flow->save();
        $preOrder = $this->workflow->confirmTests($this->inReview(genes: 2), $this->bion());

        $preOrder = $this->decide($preOrder, $this->quotation($preOrder)->number, 'approve');
        $this->assertSame(PreOrderStage::FINANCE_VERIFY, $preOrder->stage);
        $this->assertSame(ActionOwner::BION, $preOrder->action_owner);
        $this->assertSame(0, $preOrder->items()->where('status', 'released')->count());

        $preOrder = $this->workflow->verifyFinance($preOrder, $this->bion());
        $this->assertSame(PreOrderStage::AWAITING_SAMPLES, $preOrder->stage);
    }

    public function test_a_rejection_raises_the_exception_until_bion_revises_with_a_new_quotation(): void
    {
        $preOrder = $this->workflow->confirmTests($this->inReview(genes: 2), $this->bion());
        $number = $this->quotation($preOrder)->number;

        $this->assertRule(fn () => $this->decide($preOrder, $number, 'reject'), 'why');
        $preOrder = $this->decide($preOrder, $number, 'reject', ['note' => 'Too expensive for this cycle']);

        $this->assertSame(PreOrderStage::AWAITING_FINANCE, $preOrder->stage);
        $this->assertSame(ExceptionType::FINANCE_REJECTED->value, $preOrder->exception['type']);
        $this->assertSame(ActionOwner::BION, $preOrder->action_owner);
        $this->assertRule(fn () => $this->workflow->resume($preOrder, $this->bion()), 'Revise the quotation');

        $preOrder = $this->workflow->reviseQuotation($preOrder, 'Dropping the karyotype', $this->bion());
        $this->assertSame(PreOrderStage::UNDER_REVIEW, $preOrder->stage);
        $this->assertNull($preOrder->exception);
        $this->assertSame(2, $preOrder->items()->where('status', 'recommended')->count(), 'rejected lines are BION’s to edit again');

        $preOrder = $this->workflow->confirmTests($preOrder, $this->bion());
        $this->assertSame($number.'-2', $this->quotation($preOrder)->number);
        $this->assertSame(PreOrderStage::AWAITING_FINANCE, $preOrder->stage);
    }

    public function test_bion_can_pull_back_a_quotation_still_with_the_center(): void
    {
        $preOrder = $this->workflow->confirmTests($this->inReview(genes: 2), $this->bion());
        $quotation = $this->quotation($preOrder);

        $preOrder = $this->workflow->reviseQuotation($preOrder, 'Wrong probe count', $this->bion());

        $this->assertSame(PreOrderStage::UNDER_REVIEW, $preOrder->stage);
        $this->assertSame(FinanceStatus::REVISION_REQUIRED, $quotation->refresh()->status);
        $this->assertRule(fn () => $this->decide($preOrder, $quotation->number, 'approve'), 'Revision required');
    }

    public function test_a_partial_approval_must_keep_some_of_its_own_lines(): void
    {
        $preOrder = $this->workflow->confirmTests($this->inReview(genes: 2), $this->bion());
        $quotation = $this->quotation($preOrder);
        $ids = $quotation->items->pluck('id')->all();

        $this->assertRule(fn () => $this->decide($preOrder, $quotation->number, 'partial', ['items' => $ids]), 'not none or all');
        $this->assertRule(fn () => $this->decide($preOrder, $quotation->number, 'partial', ['items' => [999999]]), 'only lines from this quotation');
        $this->assertSame(FinanceStatus::AWAITING_CENTER, $quotation->refresh()->status);
    }

    public function test_prices_come_from_the_catalogue_and_only_unpriced_lines_can_be_priced(): void
    {
        $formula = $this->test('HLA', null, canBeMain: false);
        DB::table('tests')->where('id', $formula)->update(['price' => null, 'price_type' => 'Formulate']);
        $preOrder = $this->inReview(genes: 2);
        $this->workflow->addTest($preOrder, $formula, 'P1', 1, $this->bion());
        $lines = $preOrder->items()->get();
        $hla = $lines->firstWhere('test_id', $formula);
        $pgt = $lines->firstWhere('test_id', $this->pgtm);

        $this->assertRule(fn () => $this->workflow->confirmTests($preOrder->refresh(), $this->bion()), 'Set a price for HLA');
        $this->assertRule(fn () => $this->workflow->confirmTests($preOrder->refresh(), $this->bion(), new QuoteDTO(null, '0', [$pgt->id => '1'])), "can't be changed");
        $this->assertRule(fn () => $this->workflow->confirmTests($preOrder->refresh(), $this->bion(), new QuoteDTO(null, '5000', [$hla->id => '120'])), 'discount must be');

        $preOrder = $this->workflow->confirmTests($preOrder->refresh(), $this->bion(), new QuoteDTO(null, '0', [$hla->id => '120']));
        $quotation = $this->quotation($preOrder);
        $this->assertSame('1070.000', (string) $quotation->total);
        $this->assertEqualsCanonicalizing(['bion_added', 'scope'], $quotation->reasons);
    }

    public function test_without_a_quotation_prices_and_discounts_are_refused(): void
    {
        $this->assertRule(fn () => $this->workflow->confirmTests($this->inReview(genes: 1), $this->bion(), new QuoteDTO(null, '10')), 'No quotation is needed');
    }

    /** The plan's "done when", second half: a later Sanger request opens Q-…-2 and an add-on order. */
    public function test_an_additional_test_request_has_its_own_quotation_and_add_on_order(): void
    {
        $sanger = $this->test('SANGER', null, canBeMain: false, price: 75);
        $preOrder = $this->workflow->confirmTests($this->inReview(genes: 2), $this->bion());
        $main = $this->quotation($preOrder);
        $preOrder = $this->decide($preOrder, $main->number, 'approve');
        $mainKeys = $preOrder->items()->pluck('release_key', 'id')->all();

        $request = $this->workflow->raiseRequest($preOrder, RaiseRequestDTO::fromArray([
            'types' => ['test', 'samples'],
            'reason' => 'segregation',
            'message' => 'Confirm the variant in the mother',
            'tests' => [['test_id' => $sanger, 'patient_ref' => 'P1']],
            'needs' => ['samples' => [['patient_ref' => 'P1', 'sample_type' => 'EDTA blood', 'count' => 1]]],
        ]), $this->bion());

        $this->assertSame(RequestStatus::AWAITING_FINANCE, $request->refresh()->status);
        $addOn = $this->quotation($preOrder);
        $this->assertSame($main->number.'-2', $addOn->number);
        $this->assertSame($request->id, $addOn->request_id);
        $this->assertSame('75.000', (string) $addOn->total);
        $this->assertSame(PreOrderStage::AWAITING_SAMPLES, $preOrder->refresh()->stage, 'a request never moves the stage after review');

        $preOrder = $this->decide($preOrder, $addOn->number, 'approve');

        $this->assertSame(RequestStatus::ORDER_CREATED, $request->refresh()->status);
        $line = $addOn->items()->firstOrFail();
        $this->assertSame($preOrder->code.'-A2', $line->release_key);
        $this->assertSame(FinanceStatus::APPROVED, $main->refresh()->status, 'the main approval is never edited');
        foreach ($mainKeys as $id => $key) {
            $this->assertSame($key, $preOrder->items()->find($id)->release_key);
        }
        $toPlace = collect(app(PreOrderSnapshot::class)->build($preOrder)['orders_to_place'])->firstWhere('release_key', $line->release_key);
        $this->assertSame('add_on', $toPlace['purpose']);

        // The request closes once the center has placed the add-on order.
        DB::table('referrer_orders')->insert([
            'referrer_id' => $preOrder->referrer_id,
            'pre_order_id' => $preOrder->id,
            'order_id' => 'ORD-ADDON',
            'orderInformation' => json_encode(['pre_order_release_key' => $line->release_key]),
            'status' => 'waiting',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->workflow->syncFromOrders($preOrder);
        $this->assertSame(RequestStatus::CLOSED, $request->refresh()->status);
    }

    public function test_declining_an_additional_test_closes_the_request_and_drops_its_lines(): void
    {
        $sanger = $this->test('SANGER', null, canBeMain: false, price: 75);
        $preOrder = $this->workflow->confirmTests($this->inReview(genes: 1), $this->bion());
        $request = $this->workflow->raiseRequest($preOrder, RaiseRequestDTO::fromArray([
            'types' => ['test'], 'reason' => 'confirmation', 'message' => 'Sanger confirmation', 'tests' => [['test_id' => $sanger]],
        ]), $this->bion());
        $quotation = $this->quotation($preOrder);

        $preOrder = $this->decide($preOrder, $quotation->number, 'reject', ['note' => 'Not needed']);

        $this->assertSame(RequestStatus::DECLINED, $request->refresh()->status);
        $this->assertSame(ItemStatus::DROPPED, $quotation->items()->firstOrFail()->status);
        $this->assertNull($preOrder->exception, 'a declined add-on does not raise the exception');
    }

    public function test_closing_an_additional_test_request_withdraws_its_quotation(): void
    {
        $sanger = $this->test('SANGER', null, canBeMain: false, price: 75);
        $preOrder = $this->workflow->confirmTests($this->inReview(genes: 1), $this->bion());
        $request = $this->workflow->raiseRequest($preOrder, RaiseRequestDTO::fromArray([
            'types' => ['test'], 'reason' => 'confirmation', 'message' => 'Sanger confirmation', 'tests' => [['test_id' => $sanger]],
        ]), $this->bion());

        $this->workflow->closeRequest($preOrder, $request->number, false, 'Not needed after all', $this->bion());

        $this->assertSame(FinanceStatus::REVISION_REQUIRED, $this->quotation($preOrder)->status);
        $this->assertSame(0, $preOrder->items()->where('request_id', $request->id)->whereNot('status', 'dropped')->count());
    }

    public function test_samples_only_requests_never_open_a_quotation(): void
    {
        $preOrder = $this->workflow->confirmTests($this->inReview(genes: 1), $this->bion());

        $this->workflow->raiseRequest($preOrder, RaiseRequestDTO::fromArray([
            'types' => ['samples'], 'reason' => 'insufficient DNA', 'message' => 'Please re-draw', 'blocking' => true,
            'needs' => ['samples' => [['sample_type' => 'EDTA blood', 'count' => 1]]],
        ]), $this->bion());

        $this->assertSame(0, $preOrder->quotations()->count());
    }

    public function test_quotations_expire_like_a_rejection(): void
    {
        $preOrder = $this->workflow->confirmTests($this->inReview(genes: 2), $this->bion());
        $this->quotation($preOrder)->update(['expires_at' => now()->subDay()]);

        $this->artisan('pre-orders:expire-quotations')->assertSuccessful();

        $preOrder->refresh();
        $this->assertSame(FinanceStatus::EXPIRED, $this->quotation($preOrder)->status);
        $this->assertSame(ExceptionType::FINANCE_REJECTED->value, $preOrder->exception['type']);
        $this->assertSame('expired', $preOrder->exception['reason']);
    }

    public function test_a_sent_quotation_gets_its_pdf_filed_on_the_pre_order_once(): void
    {
        Storage::fake('local');
        $preOrder = $this->workflow->confirmTests($this->inReview(genes: 2), $this->bion());
        $quotation = $this->quotation($preOrder);
        Event::assertDispatched(QuotationSent::class, fn (QuotationSent $e) => $e->quotation->is($quotation));
        $version = $preOrder->refresh()->version;

        $this->workflow->attachQuotationPdf($quotation);
        $this->assertNull($this->workflow->attachQuotationPdf($quotation), 'a retried job files nothing twice');

        $document = $preOrder->documents()->where('tag', 'QUOTATION')->sole();
        $this->assertSame('pdf', $document->ext);
        $this->assertSame((string) $quotation->id, (string) $document->related_id);
        $this->assertStringStartsWith('%PDF-', Storage::disk('local')->get($document->path));
        $this->assertGreaterThan($version, $preOrder->refresh()->version, 'the panel takes the snapshot that lists the file');
        $snapshot = app(PreOrderSnapshot::class)->build($preOrder);
        $this->assertSame($document->hash, $snapshot['quotations'][0]['pdf']);
        $this->assertContains($document->hash, array_column($snapshot['documents'], 'hash'));
    }

    public function test_the_quotation_pdf_escapes_what_centers_and_bion_typed(): void
    {
        $preOrder = $this->workflow->confirmTests($this->inReview(genes: 2), $this->bion(), new QuoteDTO('<img src="file:///etc/passwd"> & more'));
        $preOrder->update(['patients' => [['ref' => 'P1', 'fullName' => 'فاطمة <b>Al</b>'], ['ref' => 'P2', 'fullName' => 'Father']]]);
        $quotation = $this->quotation($preOrder)->load('items.test');

        $html = app(QuotationPdf::class)->html($preOrder->refresh()->load('referrer'), $quotation);

        $this->assertStringNotContainsString('<img', $html);
        $this->assertStringContainsString('&lt;img src=&quot;file:///etc/passwd&quot;&gt; &amp; more', $html);
        $this->assertStringContainsString('فاطمة &lt;b&gt;Al&lt;/b&gt;', $html);
        $this->assertStringContainsString('900.000 OMR', $html);
    }

    public function test_the_center_decides_through_the_inbox_only_on_its_own_pre_order(): void
    {
        $preOrder = $this->workflow->confirmTests($this->inReview(genes: 2), $this->bion());
        $number = $this->quotation($preOrder)->number;
        $action = fn (array $payload, ?int $referrerId = null) => PreOrderAction::create([
            'uuid' => (string) Str::uuid(),
            'referrer_id' => $referrerId ?? $this->referrerId,
            'pre_order_id' => $preOrder->id,
            'type' => 'decide_finance',
            'payload' => $payload,
            'actor' => ['user_id' => 7, 'name' => 'Center approver'],
            'status' => ActionStatus::PENDING,
        ]);
        $inbox = app(PreOrderInbox::class);

        $foreign = $action(['quotation' => $number, 'decision' => 'approve'], $this->referrer('Other IVF'));
        $inbox->processOne($foreign->id);
        $this->assertSame('Pre-order not found.', $foreign->refresh()->error);

        $invalid = $action(['quotation' => $number, 'decision' => 'partial']);
        $inbox->processOne($invalid->id);
        $this->assertSame(ActionStatus::FAILED, $invalid->refresh()->status);

        $ok = $action(['quotation' => $number, 'decision' => 'approve', 'center_reference' => 'PO-1']);
        $inbox->processOne($ok->id);
        $this->assertSame(ActionStatus::DONE, $ok->refresh()->status);
        $this->assertSame('Center approver', $this->quotation($preOrder)->decided_by);
        $this->assertSame(PreOrderStage::AWAITING_SAMPLES, $preOrder->refresh()->stage);
    }

    public function test_discounts_and_the_finance_desk_need_the_quote_permission(): void
    {
        $this->withoutVite();
        $preOrder = $this->inReview(genes: 2);
        $reviewer = $this->userWith(['PreOrders.Cases.Review', 'PreOrders.Cases.View']);
        $finance = $this->userWith(['PreOrders.Cases.Review', 'PreOrders.Finance.Quote']);

        $this->actingAs($reviewer)->post(route('pre-orders.confirm', $preOrder), ['discount' => 10])->assertSessionHasErrors('discount');
        $this->actingAs($reviewer)->get(route('pre-orders.finance'))->assertForbidden();

        $this->actingAs($finance)->post(route('pre-orders.confirm', $preOrder), ['discount' => 10, 'reason' => 'Loyalty'])->assertSessionHasNoErrors();
        $this->assertSame('940.000', (string) $this->quotation($preOrder)->total);
        $this->actingAs($finance)->get(route('pre-orders.finance'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('PreOrder/Finance', false)->where('quotations.data.0.number', $this->quotation($preOrder)->number));
    }

    /** @param  list<string>  $permissions */
    private function userWith(array $permissions): User
    {
        $user = User::factory()->create();
        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission);
            $user->givePermissionTo($permission);
        }

        return $user;
    }
}
