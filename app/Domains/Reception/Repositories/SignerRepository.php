<?php

namespace App\Domains\Reception\Repositories;

use App\Domains\Reception\Models\Signer;

class SignerRepository
{
    public function create($data)
    {
        return Signer::create($data);
    }

    public function save(Signer $signer)
    {
        return $signer->save();
    }
}
