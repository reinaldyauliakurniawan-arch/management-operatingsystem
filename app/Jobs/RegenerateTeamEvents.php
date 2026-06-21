<?php

namespace App\Jobs;

use App\Modules\Event\Controllers\EventController;
use App\Modules\Teams\Models\Team;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * ponytail: extracted from EventController::index to remove write-on-GET.
 * Regeneration now runs on the queue — multiple users hitting /events
 * no longer race to delete+re-insert the same event rows.
 */
class RegenerateTeamEvents implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public Team $team)
    {
    }

    public function handle(): void
    {
        EventController::regenerateForTeam($this->team);
    }
}
