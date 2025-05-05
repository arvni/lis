<?php

namespace App\Http\Controllers\Api\Laboratory;

use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Resources\MethodResource;
use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class GetMethodController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Method $method, Request $request)
    {
        $load = ["test.sampleTypes"];
        if ($request->has("referrer")) {
            $referrer = $request->input("referrer");
//            $load["referrerMethod"] = function ($query) use ($referrer) {
//                $query->where("referrer_id", $referrer);
//            };
        }
        $method->load($load);
        return new MethodResource($method);
    }
}
