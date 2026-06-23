<?php

namespace App\Http\Controllers\Referrer;

use App\Domains\Referrer\Repositories\CollectRequestRepository;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ListCollectRequestsController extends Controller
{
    public function __construct(private CollectRequestRepository $collectRequests) {}

    public function __invoke(Request $request): \Illuminate\Http\JsonResponse
    {
        $paginated = $this->collectRequests->listBarcodedForLookup(
            $request->integer('referrer_id') ?: null,
            $request->filled('search') ? (string) $request->get('search') : null,
        );

        $paginated->setCollection(
            $paginated->getCollection()->map(fn($cr) => [
                'id'      => $cr->id,
                'name'    => $cr->barcode,
                'barcode' => $cr->barcode,
            ])
        );

        return response()->json($paginated);
    }
}
