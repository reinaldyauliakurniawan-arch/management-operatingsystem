<?php

namespace App\Modules\L10Meeting\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MeetingWorkspaceResource extends JsonResource
{
    public function __construct(
        $resource,
        protected $rocks,
        protected $metrics,
        protected $todos,
        protected $issues,
    ) {
        parent::__construct($resource);
    }

    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'title'          => $this->title,
            'scheduled_at'   => $this->scheduled_at?->format('Y-m-d H:i:s'),
            'started_at'     => $this->started_at?->format('Y-m-d H:i:s'),
            'ended_at'       => $this->ended_at?->format('Y-m-d H:i:s'),
            'rating'         => $this->rating,
            'segue_notes'    => $this->segue_notes,
            'conclude_notes' => $this->conclude_notes,
            'attendees'      => $this->attendees->map(fn ($u) => ['id' => $u->id, 'name' => $u->name]),
            'rocks'          => $this->rocks->map(fn ($r) => [
                'id'           => $r->id,
                'title'        => $r->title,
                'status'       => $r->status,
                'is_off_track' => $r->status === 'off_track',
                'owner'        => $r->owner?->name ?? '—',
            ]),
            'metrics'        => $this->metrics->map(fn ($m) => [
                'id'     => $m->id,
                'name'   => $m->title,
                'goal'   => $m->goal_value,
                'actual' => $m->latestScore?->actual_value,
                'status' => $m->latestScore?->status ?? 'neutral',
                'owner'  => $m->owner?->name ?? '—',
            ]),
            'todos'          => $this->todos->map(fn ($t) => [
                'id'       => $t->id,
                'title'    => $t->title,
                'assignee' => $t->owner?->name ?? '—',
                'owner_id' => $t->owner_id,
                'due_date' => $t->due_date?->format('Y-m-d'),
                'done'     => $t->is_completed,
            ]),
            'issues'         => $this->issues->map(fn ($i) => [
                'id'       => $i->id,
                'title'    => $i->title,
                'priority' => $this->priorityLabel($i->priority),
                'status'   => $i->status,
            ]),
        ];
    }

    private function priorityLabel(int $priority): string
    {
        return match (true) {
            $priority >= 7 => 'high',
            $priority >= 4 => 'medium',
            default        => 'low',
        };
    }
}
