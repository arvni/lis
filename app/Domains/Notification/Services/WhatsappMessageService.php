<?php

namespace App\Domains\Notification\Services;


use App\Domains\Notification\Repositories\WhatsappMessageRepository;

readonly class WhatsappMessageService
{

    public function __construct(private WhatsappMessageRepository $whatsappMessageRepository)
    {
    }

    public function listMessages($queryData)
    {
        return $this->whatsappMessageRepository->listMessages($queryData);
    }


    public function listContacts($queryData)
    {
        return $this->whatsappMessageRepository->listContacts($queryData);
    }

}
