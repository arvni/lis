<?php

namespace App\Http\Controllers\Reception\Api;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Reception\Models\Acceptance;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class GetAcceptancePoolingItemsController extends Controller
{
    public function __invoke(Acceptance $acceptance): JsonResponse
    {
        $acceptance->load([
            'acceptanceItems.methodTest.test',
            'acceptanceItems.methodTest.method',
        ]);

        $tests  = [];
        $panels = [];

        foreach ($acceptance->acceptanceItems as $item) {
            $methodTest = $item->methodTest;
            $test       = $methodTest?->test;
            if (!$test) continue;

            $isPanel = $test->type === TestType::PANEL || $test->type === TestType::PANEL->value;

            if ($isPanel) {
                $panelId = $item->panel_id;
                if (!$panelId || isset($panels[$panelId])) continue;

                $panels[$panelId] = [
                    'type'     => 'panel',
                    'id'       => $panelId,
                    'name'     => $test->name,
                    'panelData' => [
                        'panel'   => $test->toArray(),
                        'price'   => (float) $item->price * $acceptance->acceptanceItems->where('panel_id', $panelId)->count(),
                        'discount'=> (float) $item->discount * $acceptance->acceptanceItems->where('panel_id', $panelId)->count(),
                        'id'      => $panelId,
                        'acceptanceItems' => $acceptance->acceptanceItems
                            ->where('panel_id', $panelId)
                            ->values()
                            ->map(fn($sub) => [
                                'id'              => $sub->id,
                                'method_test'     => $sub->methodTest ? array_merge($sub->methodTest->toArray(), [
                                    'test'   => $sub->methodTest->test?->toArray(),
                                    'method' => $sub->methodTest->method?->toArray(),
                                ]) : null,
                                'price'           => (float) $sub->price,
                                'discount'        => (float) $sub->discount,
                                'no_sample'       => 1,
                                'customParameters'=> $sub->customParameters ?? [],
                            ])->toArray(),
                    ],
                ];
            } else {
                $testId = $test->id;
                if (isset($tests[$testId])) continue;

                $tests[$testId] = [
                    'type' => 'test',
                    'id'   => $testId,
                    'name' => $test->name,
                    'initialData' => [
                        'method_test' => array_merge($methodTest->toArray(), [
                            'test'   => $test->toArray(),
                            'method' => $methodTest->method?->toArray(),
                        ]),
                        'price'           => (float) $item->price,
                        'discount'        => (float) $item->discount,
                        'customParameters'=> $item->customParameters ?? [],
                        'no_sample'       => 1,
                    ],
                ];
            }
        }

        return response()->json([
            'items' => array_values(array_merge(array_values($tests), array_values($panels))),
        ]);
    }
}
