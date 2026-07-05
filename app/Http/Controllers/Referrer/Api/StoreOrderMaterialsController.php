<?php

namespace App\Http\Controllers\Referrer\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class StoreOrderMaterialsController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): void
    {
        // authz: unimplemented stub — no-op, exposes/mutates nothing. If this is ever
        // implemented, gate it on OrderMaterialPolicy@create. See docs/authz-matrix.md.
    }
}
