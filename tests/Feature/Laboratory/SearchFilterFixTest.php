<?php

namespace Tests\Feature\Laboratory;

use App\Domains\Laboratory\Enums\OfferType;
use App\Domains\Laboratory\Models\Offer;
use App\Domains\Laboratory\Models\ReportTemplate;
use App\Domains\Laboratory\Models\ReportTemplateParameter;
use App\Domains\Laboratory\Repositories\OfferRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Regression tests for improvement-plan #13: the Offer and ReportTemplateParameter
 * search filters called $query->search(["name"], …) but neither model used the
 * Searchable trait (BadMethodCallException) and neither table has a "name" column
 * (the column is "title"). OfferRepository additionally filtered a non-existent
 * "referrer_id" relation (RelationNotFoundException) instead of "referrers".
 */
class SearchFilterFixTest extends TestCase
{
    use RefreshDatabase;

    private function makeOffer(string $title): Offer
    {
        return Offer::create([
            "title"       => $title,
            "description" => "desc",
            "type"        => OfferType::PERCENTAGE,
            "amount"      => 10,
            "active"      => true,
        ]);
    }

    public function test_offer_search_filters_by_title_without_throwing(): void
    {
        $this->makeOffer("Spring Promo");
        $this->makeOffer("Winter Sale");

        $result = app(OfferRepository::class)->listOffers([
            "filters" => ["search" => "Spring"],
        ]);

        $this->assertCount(1, $result->items());
        $this->assertSame("Spring Promo", $result->items()[0]->title);
    }

    public function test_offer_referrer_filter_uses_the_referrers_relation(): void
    {
        $this->makeOffer("Spring Promo");

        // Before the fix this threw RelationNotFoundException on "referrer_id".
        $result = app(OfferRepository::class)->listOffers([
            "filters" => ["referrer_id" => 999],
        ]);

        $this->assertCount(0, $result->items());
    }

    public function test_report_template_parameter_search_scope_filters_by_title(): void
    {
        $template = ReportTemplate::create(["name" => "Template A"]);

        ReportTemplateParameter::create([
            "report_template_id" => $template->id,
            "title"              => "Haemoglobin",
            "type"               => "text",
        ]);
        ReportTemplateParameter::create([
            "report_template_id" => $template->id,
            "title"              => "Glucose",
            "type"               => "text",
        ]);

        // Exercises the same Searchable scope the repository's applyFilters uses.
        $matches = ReportTemplateParameter::query()
            ->search(["title"], "Haemo")
            ->get();

        $this->assertCount(1, $matches);
        $this->assertSame("Haemoglobin", $matches->first()->title);
    }
}
