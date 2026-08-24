<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Billing;

use App\Domains\Billing\Services\DiscountPartnerService;
use App\Http\Controllers\Controller;
use App\Http\Resources\ListResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListDiscountPartnersController extends Controller
{
    public function __construct(private readonly DiscountPartnerService $partnerService) {}

    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $partners = $this->partnerService->listForSelect($request->string('search')->toString() ?: null);

        return ListResource::collection($partners);
    }
}
