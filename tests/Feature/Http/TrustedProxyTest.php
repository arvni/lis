<?php

declare(strict_types=1);

namespace Tests\Feature\Http;

use Tests\TestCase;

/**
 * nginx terminates HTTPS in front of the app; the absolute URLs Laravel builds (redirects, asset links)
 * must follow what nginx forwards, but only when nginx is the one saying it.
 */
class TrustedProxyTest extends TestCase
{
    private const FORWARDED = ['X-Forwarded-Proto' => 'https', 'X-Forwarded-Host' => 'lis.biongenetic.com', 'X-Forwarded-Port' => '443'];

    public function test_redirects_follow_https_when_nginx_forwards_it(): void
    {
        $this->withServerVariables(['REMOTE_ADDR' => '172.18.0.5'])
            ->get('/dashboard', self::FORWARDED)
            ->assertRedirect('https://lis.biongenetic.com/login');
    }

    public function test_forwarded_headers_from_outside_the_docker_network_are_ignored(): void
    {
        $location = $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.9'])
            ->get('/dashboard', self::FORWARDED)
            ->assertRedirect()
            ->headers->get('Location');

        $this->assertStringStartsNotWith('https://lis.biongenetic.com', (string) $location);
    }
}
