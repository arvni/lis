<?php

namespace App\Http\Controllers\Notification;

use App\Domains\Notification\Models\WhatsappMessage;
use App\Domains\Notification\Services\WhatsappMessageService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class WhatsappMessageController extends Controller
{
    public function __construct(private WhatsappMessageService $whatsappMessageService)
    {
        $this->middleware('indexProvider:created_at,desc');
        $this->middleware('can:notifications.manage-whatsapp');
    }

    public function index(Request $request)
    {
        return $this->whatsappMessageService->listMessages($request->all());
    }
}
