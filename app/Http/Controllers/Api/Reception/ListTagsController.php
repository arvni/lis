<?php

namespace App\Http\Controllers\Api\Reception;

use App\Domains\Reception\Services\TagService;
use App\Http\Controllers\Controller;
use App\Http\Resources\ListResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListTagsController extends Controller
{
    public function __construct(private readonly TagService $tagService)
    {
        $this->middleware('indexProvider:name');
    }

    public function __invoke(Request $request): AnonymousResourceCollection
    {
        return ListResource::collection($this->tagService->listTags($request->all()));
    }
}
