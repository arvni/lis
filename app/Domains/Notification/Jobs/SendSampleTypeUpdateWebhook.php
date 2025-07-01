<?php

namespace App\Domains\Notification\Jobs;

use App\Domains\Laboratory\Models\SampleType;
use Exception;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SendSampleTypeUpdateWebhook implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1; // Retry 3 times if failed
    public array $backoff = [10]; // Wait times between retries

    protected SampleType $sampleType;
    protected string $action;

    public function __construct(SampleType $sampleType,string $action)
    {
        $this->sampleType = $sampleType;
        $this->action = $action;
    }

    /**
     * Execute the job.
     * @throws ConnectionException
     */
    public function handle(): void
    {
        $request = Http::timeout(30)
            ->asMultipart();
        $webhookDomain = config('services.provider_app.webhook_domain');
        $webhookUrl = config('services.provider_app.sample_type_webhook_url');
        $secret = config('services.provider_app.webhook_secret');
        $payload = [
            'sample_type_id' => $this->sampleType->id,
            'updated_at' => $this->sampleType?->updated_at?->toISOString(),
            'sample_type' => $this->sampleType->toArray(),
            "action"=>$this->action
        ];
        $webhookUrl = (Str::endsWith($webhookDomain, '/') ? Str::substr($webhookDomain, 0, -1) : $webhookDomain) . (Str::endsWith($webhookUrl, '/') ? $webhookUrl : $webhookUrl . "/") . $this->sampleType->id;
        $signature = hash_hmac('sha256', json_encode($payload), $secret);
        Log::debug("Webhook URL: " . $webhookUrl);

        $request->withHeaders(['X-Webhook-Signature' => $signature]);
        $jsonString = json_encode($payload);
        $request->attach("data", $jsonString, 'data.json');
        try {
               $response=$request ->post($webhookUrl);
            if (!$response->successful()) {
                throw new Exception("Webhook failed with status: " . $response->status());
            }

            Log::info("Order webhook sent successfully", ['sample_type_id' => $this->sampleType->id]);

        } catch (ConnectionException $e) {
            Log::error("Webhook connection failed", [
                'sample_type_id' => $this->sampleType->id,
                'error' => $e->getMessage(),
                'webhook_url' => $webhookUrl
            ]);
            throw $e;
        } catch (Exception $e) {
            Log::error("Webhook failed", [
                'sample_type_id' => $this->sampleType->id,
                'error' => $e->getMessage(),
                'webhook_url' => $webhookUrl
            ]);
            throw $e;
        }
    }
}
