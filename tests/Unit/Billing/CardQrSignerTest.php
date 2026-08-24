<?php

declare(strict_types=1);

namespace Tests\Unit\Billing;

use App\Domains\Billing\Support\CardQrSigner;
use Tests\TestCase;

class CardQrSignerTest extends TestCase
{
    private CardQrSigner $signer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->signer = new CardQrSigner;
    }

    public function test_a_signature_verifies_against_its_own_uuid(): void
    {
        $uuid = '11111111-2222-3333-4444-555555555555';

        $this->assertTrue($this->signer->verify($uuid, $this->signer->sign($uuid)));
    }

    public function test_a_signature_does_not_verify_against_another_uuid(): void
    {
        $signature = $this->signer->sign('11111111-2222-3333-4444-555555555555');

        $this->assertFalse($this->signer->verify('99999999-2222-3333-4444-555555555555', $signature));
    }

    public function test_a_missing_or_empty_signature_never_verifies(): void
    {
        $uuid = '11111111-2222-3333-4444-555555555555';

        $this->assertFalse($this->signer->verify($uuid, null));
        $this->assertFalse($this->signer->verify($uuid, ''));
    }

    public function test_a_forged_signature_does_not_verify(): void
    {
        $uuid = '11111111-2222-3333-4444-555555555555';

        $this->assertFalse($this->signer->verify($uuid, 'deadbeef00'));
    }
}
