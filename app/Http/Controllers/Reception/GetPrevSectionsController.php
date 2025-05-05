<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Laboratory\Resources\SectionOptionResource;
use App\Domains\Reception\Adapters\WorkflowAdapter;
use App\Domains\Reception\Models\AcceptanceItemState;
use App\Http\Controllers\Controller;

class GetPrevSectionsController extends Controller
{

    public function __construct(private WorkflowAdapter $workflowAdapter)
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(AcceptanceItemState $acceptanceItemState)
    {
        $acceptanceItemState->load("acceptanceItem");
        $pervSections = $this->workflowAdapter->getPrevSections($acceptanceItemState->acceptanceItem->method_test_id, $acceptanceItemState->order);
        return response()->json([
            "sections" => SectionOptionResource::collection($pervSections),
        ]);
    }
}
