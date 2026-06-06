<?php

namespace App\Domains\Reception\DTOs;

class PatientDTO
{
    public function __construct(
        public string       $firstName,
        public ?string      $lastName,
        public ?string      $secondName,
        public ?string      $thirdName,
        public string       $idNo,
        public string       $nationality,
        public string       $dateOfBirth,
        public string       $gender,
        public string|array $avatar,
        public ?string      $phone=null,
        public ?string      $tribe=null,
        public ?string      $wilayat=null,
        public ?string      $governorate=null,
        public ?string      $village=null,
        public ?int         $id=null
    )
    {
    }

    public static function fromRequest($validatedRequest): self
    {
        return new self(
            $validatedRequest['firstName'],
            $validatedRequest['lastName'] ?? null,
            $validatedRequest['secondName'] ?? null,
            $validatedRequest['thirdName'] ?? null,
            $validatedRequest['idNo'],
            is_array($validatedRequest['nationality']) ? $validatedRequest["nationality"]["code"] : $validatedRequest['nationality'],
            $validatedRequest['dateOfBirth'],
            $validatedRequest['gender'],
            $validatedRequest['avatar'],
            $validatedRequest['phone']??null,
            $validatedRequest['tribe'] ?? null,
            $validatedRequest['wilayat'] ?? null,
            $validatedRequest['governorate'] ?? null,
            $validatedRequest['village'] ?? null
        );
    }

    public function fullName(): string
    {
        return implode(' ', array_filter([
            $this->firstName,
            $this->secondName,
            $this->thirdName,
            $this->lastName,
        ], fn($part) => filled($part)));
    }

    public function toArray(): array
    {
        $data = [
            "fullName" => $this->fullName(),
            "firstName" => $this->firstName,
            "secondName" => $this->secondName,
            "thirdName" => $this->thirdName,
            "lastName" => $this->lastName,
            "idNo" => $this->idNo,
            "nationality" => $this->nationality,
            "dateOfBirth" => $this->dateOfBirth,
            "gender" => $this->gender,
            "avatar" => $this->avatar,
            "phone" => $this->phone??null,
            "tribe" => $this->tribe,
            "wilayat" => $this->wilayat,
            "governorate" => $this->governorate,
            "village" => $this->village
        ];
        if ($this->id) {
            $data["id"] = $this->id;
        }
        return $data;
    }
}
