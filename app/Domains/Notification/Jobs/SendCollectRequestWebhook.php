<?php

namespace App\Domains\Notification\Jobs;

use App\Domains\Referrer\Models\CollectRequest;
use Exception;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SendCollectRequestWebhook implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3; // Retry 3 times if failed
    public array $backoff = [10, 30, 60]; // Wait times between retries

    protected string $action;
    protected $id;

    public function __construct($id=null, string $action = "update")
    {
        $this->action = $action;
        $this->id = $id;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $webhookDomain = config('services.logistics_app.webhook_domain');
        $webhookUrl = config('services.logistics_app.collect_request_webhook_url');
        $secret = config('services.logistics_app.webhook_secret');


        // Load relationships for webhook payload
        if ($this->action != 'delete') {
            $collectRequest=CollectRequest::where('id',$this->id)->with(['sampleCollector', 'referrer'])->first();

            $payload = [
                'id' => $collectRequest->id,
                'action' => $this->action,
                'status' => $collectRequest->status?->value,
                'sample_collector' => [
                    'id' => $collectRequest->sampleCollector?->id,
                    'name' => $collectRequest->sampleCollector?->name,
                    'email' => $collectRequest->sampleCollector?->email,
                ],
                'referrer' => [
                    'id' => $collectRequest->referrer?->id,
                    'name' => $collectRequest->referrer?->name ?? $collectRequest->referrer?->fullName,
                    'email' => $collectRequest->referrer?->email,
                    'phone' => $collectRequest->referrer?->phoneNo,
                    ...($collectRequest->referrer?->logisticInfo??[]),
                ],
                'logistic_information' => $collectRequest->logistic_information,
                'created_at' => $collectRequest->created_at?->toISOString(),
                'updated_at' => $collectRequest->updated_at?->toISOString(),
            ];
        } else {
            $payload = [
                'id' => $this->id,
            ];
        }

        // Build the full webhook URL
        $webhookUrl = (Str::endsWith($webhookDomain, '/') ? Str::substr($webhookDomain, 0, -1) : $webhookDomain)
            . (Str::startsWith($webhookUrl, '/') ? $webhookUrl : '/' . $webhookUrl);

        // Create signature for security
        $signature = hash_hmac('sha256', json_encode($payload), $secret);

        Log::debug("CollectRequest Webhook URL: " . $webhookUrl);

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'X-Webhook-Signature' => $signature,
                    'X-Webhook-Action' => $this->action
                ])
                ->post($webhookUrl, $payload);

            if (!$response->successful()) {
                throw new Exception("Webhook failed with status: " . $response->status());
            }

            Log::info("CollectRequest webhook sent successfully", [
                'collect_request_id' => $this->id,
                'action' => $this->action
            ]);

        } catch (Exception $e) {
            Log::error("CollectRequest webhook failed", [
                'collect_request_id' => $this->id,
                'action' => $this->action,
                'error' => $e->getMessage()
            ]);
            throw $e; // This will trigger retry
        }
    }
}
