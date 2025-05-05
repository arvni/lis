<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IndexProvider
{
    /**
     * Handle an incoming request.
     *
     * @param Closure(Request): (Response) $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $inputs["filters"] = array_merge($request->get("filters", []), $request->except("filters", "page", "sort", "pageSize"));
        $inputs["page"] = $request->get("page", 1);
        $inputs["sort"] = $request->get("sort", ["field" => "id", "sort" => "desc"]);
        $inputs["pageSize"] = $request->get("pageSize", 10);
        $request->replace($inputs);
        return $next($request);
    }
}
