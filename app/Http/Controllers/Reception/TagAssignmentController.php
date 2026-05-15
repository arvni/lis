<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Requests\SyncTagsRequest;
use App\Domains\Reception\Services\TagService;
use App\Http\Controllers\Controller;
use App\Http\Resources\ListResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TagAssignmentController extends Controller
{
    public function __construct(private readonly TagService $tagService)
    {
        $this->middleware('permission:Reception.Acceptances.Assign Tag');
    }

    public function syncAcceptance(SyncTagsRequest $request, Acceptance $acceptance): AnonymousResourceCollection
    {
        $tags = $this->tagService->syncTags($acceptance, $request->validated('tags'));

        return ListResource::collection($tags);
    }

    public function syncAcceptanceItem(SyncTagsRequest $request, AcceptanceItem $acceptanceItem): AnonymousResourceCollection
    {
        $tags = $this->tagService->syncTags($acceptanceItem, $request->validated('tags'));

        return ListResource::collection($tags);
    }
}
