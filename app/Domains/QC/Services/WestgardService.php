<?php

namespace App\Domains\QC\Services;

use App\Domains\QC\Enums\QCStatus;

class WestgardService
{
    /**
     * Evaluate Westgard rules for a new QC value.
     *
     * @param  float   $value     New measurement
     * @param  float   $mean      Target mean
     * @param  float   $sd        Target SD
     * @param  float[] $recent    Previous values, newest first (up to 10)
     * @return array{status: QCStatus, violations: string[]}
     */
    public function evaluate(float $value, float $mean, float $sd, array $recent): array
    {
        if ($sd <= 0) {
            return ['status' => QCStatus::PASS, 'violations' => []];
        }

        // All values newest-first (new value prepended)
        $all = array_merge([$value], $recent);

        $violations = [];

        // 1-3s: reject — 1 value > ±3SD
        if (abs($value - $mean) > 3 * $sd) {
            $violations[] = '1-3s';
        }

        // 1-2s: warning — 1 value > ±2SD
        if (abs($value - $mean) > 2 * $sd) {
            $violations[] = '1-2s';
        }

        // 2-2s: reject — 2 consecutive on same side > ±2SD
        if (count($all) >= 2) {
            $v0 = $all[0] - $mean;
            $v1 = $all[1] - $mean;
            if (abs($v0) > 2 * $sd && abs($v1) > 2 * $sd && ($v0 * $v1 > 0)) {
                $violations[] = '2-2s';
            }
        }

        // R-4s: reject — range of consecutive pair > 4SD
        if (count($all) >= 2) {
            $range = abs($all[0] - $all[1]);
            if ($range > 4 * $sd) {
                $violations[] = 'R-4s';
            }
        }

        // 4-1s: warning — 4 consecutive same side of mean
        if (count($all) >= 4) {
            $signs = array_map(fn($v) => ($v - $mean) >= 0 ? 1 : -1, array_slice($all, 0, 4));
            if (count(array_unique($signs)) === 1) {
                $violations[] = '4-1s';
            }
        }

        // 10x: reject — 10 consecutive same side
        if (count($all) >= 10) {
            $signs = array_map(fn($v) => ($v - $mean) >= 0 ? 1 : -1, array_slice($all, 0, 10));
            if (count(array_unique($signs)) === 1) {
                $violations[] = '10x';
            }
        }

        $rejectRules = ['1-3s', '2-2s', 'R-4s', '10x'];
        $warnRules   = ['1-2s', '4-1s'];

        $status = QCStatus::PASS;
        foreach ($violations as $v) {
            if (in_array($v, $rejectRules)) {
                $status = QCStatus::FAIL;
                break;
            }
            if (in_array($v, $warnRules)) {
                $status = QCStatus::WARNING;
            }
        }

        return ['status' => $status, 'violations' => array_values(array_unique($violations))];
    }
}
