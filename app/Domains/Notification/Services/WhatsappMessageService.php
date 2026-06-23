<?php

namespace App\Domains\Notification\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;


use App\Domains\Notification\Repositories\WhatsappMessageRepository;

readonly class WhatsappMessageService
{

    public function __construct(private WhatsappMessageRepository $whatsappMessageRepository)
    {
    }

    public function listMessages(array $queryData): LengthAwarePaginator
    {
        return $this->whatsappMessageRepository->listMessages($queryData);
    }


    public function listContacts(array $queryData): LengthAwarePaginator
    {
        return $this->whatsappMessageRepository->listContacts($queryData);
    }

}
