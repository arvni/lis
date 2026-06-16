<?php

namespace Tests\Feature\Notification;

use App\Domains\Notification\Repositories\WhatsappMessageRepository;
use App\Domains\Notification\Services\WhatsappMessageService;
use Mockery;
use Tests\TestCase;

class WhatsappMessageServiceTest extends TestCase
{
    private WhatsappMessageRepository $repo;
    private WhatsappMessageService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = Mockery::mock(WhatsappMessageRepository::class);
        $this->service = new WhatsappMessageService($this->repo);
    }

    public function test_list_messages_delegates(): void
    {
        $paginator = new \Illuminate\Pagination\LengthAwarePaginator([], 0, 10);
        $this->repo->shouldReceive('listMessages')->once()->with(['q' => 1])->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listMessages(['q' => 1]));
    }

    public function test_list_contacts_delegates(): void
    {
        $paginator = new \Illuminate\Pagination\LengthAwarePaginator([], 0, 10);
        $this->repo->shouldReceive('listContacts')->once()->with(['q' => 2])->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listContacts(['q' => 2]));
    }
}
