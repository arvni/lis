<?php

namespace Tests\Feature\Billing;

use App\Domains\Billing\Models\Statement;
use App\Domains\Billing\Repositories\StatementRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StatementRepositoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_get_total_statements_for_date_range_counts_statements_in_range(): void
    {
        // Two statements created today, one created two months ago.
        $this->makeStatement('S1', now());
        $this->makeStatement('S2', now());
        $this->makeStatement('S3', now()->subMonths(2));

        $repo = new StatementRepository();
        $total = $repo->getTotalStatementsForDateRange([
            now()->startOfDay(),
            now()->endOfDay(),
        ]);

        // Previously this returned a Builder (a TypeError against the `: float`
        // declaration); it now returns the count of statements in the range.
        $this->assertSame(2, $total);
    }

    private function makeStatement(string $no, \Illuminate\Support\Carbon $createdAt): Statement
    {
        $referrer = \App\Domains\Referrer\Models\Referrer::create([
            'fullName'        => 'Ref ' . $no,
            'phoneNo'         => '90000000',
            'billingInfo'     => [],
            'email'           => $no . '@example.com',
            'reportReceivers' => [],
        ]);

        $statement = Statement::create([
            'no'          => $no,
            'issue_date'  => now()->toDateString(),
            'referrer_id' => $referrer->id,
        ]);
        $statement->forceFill(['created_at' => $createdAt])->saveQuietly();

        return $statement;
    }
}
