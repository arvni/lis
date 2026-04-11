<?php

namespace App\Http\Controllers\Referrer;

use App\Domains\Referrer\Models\CollectRequest;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ListCollectRequestsController extends Controller
{
    public function __invoke(Request $request)
    {
        $search     = $request->get('search', '');
        $referrerId = $request->get('referrer_id');

        $paginated = CollectRequest::query()
            ->whereNotNull('barcode')
            ->when($referrerId, fn($q) => $q->where('referrer_id', $referrerId))
            ->when($search,     fn($q) => $q->where('barcode', 'like', "%$search%"))
            ->orderBy('id', 'desc')
            ->paginate(20);

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
