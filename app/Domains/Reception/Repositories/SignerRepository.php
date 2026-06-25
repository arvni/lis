<?php

namespace App\Domains\Reception\Repositories;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Reception\Models\Signer;

class SignerRepository
{
    use LogsUserActivity;

    public function create(array $data): Signer
    {
        $signer= Signer::create($data);
        $this->logCreated($signer);
        return $signer;
    }

    public function save(Signer $signer): void
    {
         $signer->save();
        $this->logUpdated($signer);
    }
}
