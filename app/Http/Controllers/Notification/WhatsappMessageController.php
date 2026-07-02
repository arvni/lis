<?php

namespace App\Http\Controllers\Notification;

use App\Domains\Notification\Models\WhatsappMessage;
use App\Domains\Notification\Requests\ListWhatsappMessageRequest;
use App\Domains\Notification\Services\WhatsappMessageService;
use App\Http\Controllers\Controller;

class WhatsappMessageController extends Controller
{
    public function __construct(private WhatsappMessageService $whatsappMessageService)
    {
        $this->middleware('indexProvider:created_at,desc');
        $this->middleware('can:notifications.manage-whatsapp');
    }

    public function index(ListWhatsappMessageRequest $request): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        return $this->whatsappMessageService->listMessages($request->all());
    }
}
