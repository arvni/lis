<?php

namespace App\Domains\Reception\Repositories;

use App\Domains\Reception\Models\Signer;
use App\Domains\User\Enums\ActivityType;
use App\Domains\User\Services\UserActivityService;

class SignerRepository
{
    public function create($data)
    {
        $signer= Signer::create($data);
        UserActivityService::createUserActivity($signer,ActivityType::CREATE);
        return $signer;
    }

    public function save(Signer $signer)
    {
         $signer->save();
        UserActivityService::createUserActivity($signer,ActivityType::UPDATE);
    }
}
