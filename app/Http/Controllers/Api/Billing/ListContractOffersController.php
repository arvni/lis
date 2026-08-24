<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Billing;

use App\Domains\Billing\Adapters\LaboratoryAdapter;
use App\Domains\Billing\Resources\ContractOfferResource;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListContractOffersController extends Controller
{
    public function __construct(private readonly LaboratoryAdapter $laboratoryAdapter) {}

    /**
     * Offers a discount contract can be built from.
     */
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $offers = $this->laboratoryAdapter->listContractableOffers(
            $request->string('search')->toString() ?: null
        );

        return ContractOfferResource::collection($offers);
    }
}
