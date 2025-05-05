<?php

namespace App\Domains\Reception\Factories;

use App\Domains\Reception\Models\Report;
use App\Domains\Reception\Models\Signer;
use App\Domains\User\Models\User;

/**
 * Factory for creating Signer entities
 */
class SignerFactory
{
    /**
     * Create a new signer from a user
     *
     * @param User $user
     * @param Report $report
     * @param int $row
     * @return Signer
     */
    public function createFromUser(User $user, Report $report, int $row = 1): Signer
    {
        $signer = new Signer();
        $signer->report()->associate($report);
        $signer->user()->associate($user);
        $signer->name = $user->name;
        $signer->title = $user->title;
        $signer->signature = $user->signature;
        $signer->stamp = $user->stamp;
        $signer->row = $row;

        return $signer;
    }
}
