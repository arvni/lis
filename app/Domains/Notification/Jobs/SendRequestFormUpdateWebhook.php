<?php

namespace App\Domains\Notification\Jobs;

use App\Domains\Laboratory\Models\RequestForm;
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

class SendRequestFormUpdateWebhook implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1; // Retry 3 times if failed
    public array $backoff = [10]; // Wait times between retries

    protected RequestForm $requestForm;
    protected string $action;

    public function __construct(RequestForm $requestForm,string $action)
    {
        $this->requestForm = $requestForm;
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
        $webhookUrl = config('services.provider_app.request_form_webhook_url');
        $secret = config('services.provider_app.webhook_secret');
        $this->requestForm->load("document");
        $payload = [
            'request_form_id' => $this->requestForm->id,
            'updated_at' => $this->requestForm?->updated_at?->toISOString(),
            'request_form' => $this->requestForm->toArray(),
            "action"=>$this->action
        ];
        $webhookUrl = (Str::endsWith($webhookDomain, '/') ? Str::substr($webhookDomain, 0, -1) : $webhookDomain) . (Str::endsWith($webhookUrl, '/') ? $webhookUrl : $webhookUrl . "/") . $this->requestForm->id;
        $signature = hash_hmac('sha256', json_encode($payload), $secret);
        Log::debug("Webhook URL: " . $webhookUrl);

        if ($this->requestForm->document){
            $fileContents = file_get_contents(storage_path("app/private/" . $this->requestForm->document->path));
            if ($fileContents !== false) {
                $request->attach("file", $fileContents,$this->requestForm->document->originalName);
            }
        }
        $request->withHeaders(['X-Webhook-Signature' => $signature]);
        $jsonString = json_encode($payload);
        $request->attach("data", $jsonString, 'data.json');
        try {
               $response=$request ->post($webhookUrl);
            if (!$response->successful()) {
                throw new Exception("Webhook failed with status: " . $response->status());
            }

            Log::info("Order webhook sent successfully", ['order_id' => $this->requestForm->id]);

        } catch (ConnectionException $e) {
            Log::error("Webhook connection failed", [
                'request_form_id' => $this->requestForm->id,
                'error' => $e->getMessage(),
                'webhook_url' => $webhookUrl
            ]);
            throw $e;
        } catch (Exception $e) {
            Log::error("Webhook failed", [
                'request_form_id' => $this->requestForm->id,
                'error' => $e->getMessage(),
                'webhook_url' => $webhookUrl
            ]);
            throw $e;
        }
    }
}
