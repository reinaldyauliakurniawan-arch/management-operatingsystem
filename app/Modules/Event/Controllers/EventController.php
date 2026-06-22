<?php

namespace App\Modules\Event\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Event\Models\Event;
use App\Modules\Event\Models\EventAttendance;
use App\Modules\Teams\Models\Team;
use App\Models\User;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Carbon\Carbon;

class EventController extends Controller
{
    // ─── Agenda templates (EOS) ───────────────────────────────────────
    private static function agendaFor(string $type): array
    {
        return match($type) {
            'l10' => [
                ['title' => 'Segue',         'duration' => 5,  'desc' => 'Check-in singkat, good news personal & bisnis.'],
                ['title' => 'Scorecard',     'duration' => 5,  'desc' => 'Review angka mingguan tim. Setiap angka: on-track atau off-track?'],
                ['title' => 'Rock Review',   'duration' => 5,  'desc' => 'Status rock per orang: on-track / off-track. Tidak ada diskusi di sini.'],
                ['title' => 'Headlines',     'duration' => 5,  'desc' => 'Customer & employee headlines. Berita penting saja.'],
                ['title' => 'To-Do Review',  'duration' => 5,  'desc' => 'Review to-do minggu lalu. Done / not done. 90% completion rate target.'],
                ['title' => 'IDS',           'duration' => 60, 'desc' => 'Identify-Discuss-Solve. Selesaikan isu terpenting. Hasilkan to-do baru.'],
                ['title' => 'Conclude',      'duration' => 5,  'desc' => 'Recap to-do, cascade messages, rating meeting 1-10.'],
            ],
            'quarterly' => [
                ['title' => 'Check-in',              'duration' => 30,  'desc' => 'Good news personal & bisnis. Ekspektasi hari ini.'],
                ['title' => 'Review V/TO',            'duration' => 60,  'desc' => 'Review Vision/Traction Organizer. Masih selaras dengan Core Values, Core Focus, 10-Year Target?'],
                ['title' => 'Review Rocks Lalu',      'duration' => 30,  'desc' => 'Done / not done. Jujur. Tidak ada judgment.'],
                ['title' => 'Review P&L & Data',      'duration' => 30,  'desc' => 'Kesehatan bisnis: revenue, profit, pipeline, scorecard.'],
                ['title' => 'People Review',           'duration' => 30,  'desc' => 'GWC check (Get it, Want it, Capacity): siapa yang perlu diperhatikan?'],
                ['title' => 'SWOT / Issues Identify', 'duration' => 60,  'desc' => 'List semua isu / opportunities. Prioritaskan top 3-5.'],
                ['title' => 'Set Rocks Quarter Baru',  'duration' => 60,  'desc' => 'Tiap rock harus SMART. Max 3-7 rock per orang.'],
                ['title' => 'Conclude',                'duration' => 30,  'desc' => 'Recap rocks & to-do. Cascade messages ke tim. Rating meeting.'],
            ],
            'annual' => [
                ['title' => 'Day 1 — Check-in & Review',    'duration' => 60,  'desc' => 'Check-in panjang. Review tahun lalu: pencapaian & kegagalan jujur.'],
                ['title' => 'Day 1 — Core Values',          'duration' => 90,  'desc' => 'Apakah Core Values masih relevan? Siapa yang hidup / tidak hidup nilai ini?'],
                ['title' => 'Day 1 — Core Focus',           'duration' => 60,  'desc' => 'Review Hedgehog: Purpose/Cause/Passion, Niche, Economic Engine.'],
                ['title' => 'Day 1 — 10-Year Target',       'duration' => 60,  'desc' => 'Apakah masih inspire? Seberapa dekat? Perlu diperbarui?'],
                ['title' => 'Day 1 — Marketing Strategy',   'duration' => 90,  'desc' => 'Target Market, 3 Uniques, Proven Process, Guarantee.'],
                ['title' => 'Day 2 — 3-Year Picture',       'duration' => 60,  'desc' => 'Seperti apa bisnis 3 tahun lagi? Revenue, profit, looks like.'],
                ['title' => 'Day 2 — 1-Year Plan',          'duration' => 60,  'desc' => 'Revenue, profit, 3-7 Goals tahun ini.'],
                ['title' => 'Day 2 — Rocks Q1',             'duration' => 60,  'desc' => 'Set rocks untuk Q1. Prioritas mutlak.'],
                ['title' => 'Day 2 — Issues & IDS',         'duration' => 90,  'desc' => 'Selesaikan isu besar yang memblokir 1-year plan.'],
                ['title' => 'Day 2 — Conclude',             'duration' => 30,  'desc' => 'Recap, cascade, rating meeting.'],
            ],
            default => [],
        };
    }

    // ─── Hitung tanggal L10 (N minggu ke depan) ───────────────────────
    private static function generateL10Dates(Team $team, int $weeksAhead = 12): array
    {
        $day = (int) $team->scorecard_day; // 0=Minggu,1=Senin,...,6=Sabtu
        $dates = [];
        $cursor = Carbon::now()->startOfWeek(Carbon::MONDAY);

        // Cari hari pertama yang sesuai scorecard_day di minggu ini atau minggu depan
        $carbonDay = ($day === 0) ? Carbon::SUNDAY : $day; // Carbon: 0=Mon,6=Sun... pakai constant
        $target = $cursor->copy()->dayOfWeek($day); // PHP Carbon dayOfWeek: 0=Sun,1=Mon
        if ($target->isPast()) {
            $target->addWeek();
        }

        for ($i = 0; $i < $weeksAhead; $i++) {
            $dates[] = $target->copy()->addWeeks($i)->format('Y-m-d');
        }

        return $dates;
    }

    // ─── Hitung tanggal Quarterly dari q1_start_date ──────────────────
    private static function generateQuarterlyDates(Team $team): array
    {
        if (!$team->q1_start_date) return [];

        $q1Start = Carbon::parse($team->q1_start_date);
        $year    = Carbon::now()->year;

        // Sesuaikan ke tahun sekarang
        $q1 = $q1Start->copy()->year($year);

        return [
            $q1->copy()->format('Y-m-d'),
            $q1->copy()->addMonths(3)->format('Y-m-d'),
            $q1->copy()->addMonths(6)->format('Y-m-d'),
            $q1->copy()->addMonths(9)->format('Y-m-d'),
        ];
    }

    // ─── Hitung tanggal Annual ────────────────────────────────────────
    private static function generateAnnualDate(Team $team): ?string
    {
        if (!$team->q1_start_date) return null;

        $q1Start = Carbon::parse($team->q1_start_date);
        // Annual = 1-2 minggu sebelum Q1 start tahun berikutnya
        return $q1Start->copy()->year(Carbon::now()->year)->subWeeks(2)->format('Y-m-d');
    }

    // ─── Regenerate event L10/Quarterly/Annual dari setting tim ───────
    // Dipanggil dari ScorecardController::updateSettings() setiap kali
    // scorecard_day / q1_start_date berubah, supaya calendar otomatis
    // sinkron tanpa perlu klik "Generate Otomatis" manual.
    public static function regenerateForTeam(Team $team): void
    {
        $teamId = $team->id;

        // Hapus event generated yang belum diedit & belum lewat.
        // Event manual, event yang sudah diedit, dan event yang sudah lewat tidak disentuh.
        Event::where('team_id', $teamId)
            ->whereIn('type', ['l10', 'quarterly', 'annual'])
            ->where('is_generated', true)
            ->where('is_modified', false)
            ->whereDate('event_date', '>=', Carbon::today())
            ->delete();

        $toInsert = [];

        foreach (self::generateL10Dates($team) as $date) {
            $toInsert[] = [
                'team_id'      => $teamId,
                'created_by'   => $team->created_by ?? null,
                'name'         => 'L10 Meeting',
                'type'         => 'l10',
                'event_date'   => $date,
                'description'  => 'Weekly L10 Meeting — 90 menit.',
                'agenda'       => json_encode(self::agendaFor('l10')),
                'is_generated' => true,
                'is_modified'  => false,
                'created_at'   => now(),
                'updated_at'   => now(),
            ];
        }

        foreach (self::generateQuarterlyDates($team) as $date) {
            $toInsert[] = [
                'team_id'      => $teamId,
                'created_by'   => $team->created_by ?? null,
                'name'         => 'Quarterly Meeting',
                'type'         => 'quarterly',
                'event_date'   => $date,
                'description'  => 'Quarterly Planning Meeting — 1 hari penuh.',
                'agenda'       => json_encode(self::agendaFor('quarterly')),
                'is_generated' => true,
                'is_modified'  => false,
                'created_at'   => now(),
                'updated_at'   => now(),
            ];
        }

        $annualDate = self::generateAnnualDate($team);
        if ($annualDate) {
            $toInsert[] = [
                'team_id'      => $teamId,
                'created_by'   => $team->created_by ?? null,
                'name'         => 'Annual Meeting',
                'type'         => 'annual',
                'event_date'   => $annualDate,
                'description'  => 'Annual Planning — 2 hari. Review VTO & set target tahunan.',
                'agenda'       => json_encode(self::agendaFor('annual')),
                'is_generated' => true,
                'is_modified'  => false,
                'created_at'   => now(),
                'updated_at'   => now(),
            ];
        }

        // Hindari duplikat: skip tanggal yang sudah ada (event manual/sudah diedit/sudah lewat yang tidak terhapus).
        if (!empty($toInsert)) {
            $existingDates = Event::withoutGlobalScope(\App\Scopes\TeamScope::class)
                ->where('team_id', $teamId)
                ->pluck('event_date')
                ->map(fn($d) => Carbon::parse($d)->format('Y-m-d'))
                ->toArray();

            $toInsert = array_values(array_filter($toInsert, fn($row) => !in_array($row['event_date'], $existingDates)));

            if (!empty($toInsert)) {
                Event::insert($toInsert);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────
    public function index()
    {
        $teamId   = TenantContext::teamId();
        abort_if(!$teamId, 403, 'Tidak ada active team.');
        $userId   = Auth::id();
        $role     = Auth::user()->roleIn($teamId);
        $isLeader = $role === 'leader' || Auth::user()->isAdminOfActiveOrg();
        $team     = Team::withoutGlobalScopes()->find($teamId);

        // org-wide context — dipakai untuk members dropdown & attendance org-wide
        $orgId      = $team?->organization_id;
        $orgTeamIds = $orgId
            ? Team::withoutGlobalScopes()->where('organization_id', $orgId)->pluck('id')
            : collect([$teamId]);

        // ponytail: removed the write-on-GET auto-regenerate loop. It was a
        // race condition (multiple users hitting /events would each fire a
        // delete+insert) plus write amplification across all org teams. Event
        // regeneration now runs only from ScorecardController::updateSettings
        // via RegenerateTeamEvents job. Future: add a scheduled command for
        // daily/weekly auto-extension.

        $eventsQuery = Event::withoutGlobalScopes()->with([
            'attendances' => fn($q) => $isLeader
                ? $q->with('user')
                : $q->where('user_id', $userId),
        ])->where('team_id', $teamId);

        if (!$isLeader) {
            $eventsQuery->where(function ($q) use ($role) {
                $q->whereNull('assigned_roles')->orWhereJsonContains('assigned_roles', $role);
            });
        }

        $events = $eventsQuery
            ->orderBy('event_date', 'desc')
            ->get()
            ->map(function ($event) use ($userId, $isLeader) {
                $myAttendance = $event->attendances->first();
                return [
                    'id'             => $event->id,
                    'name'           => $event->name,
                    'type'           => $event->type,
                    'custom_type'    => $event->custom_type,
                    'type_label'     => $event->type_label,
                    'event_date'     => $event->event_date->format('Y-m-d'),
                    'description'    => $event->description,
                    'agenda'         => $event->agenda ?? [],
                    'assigned_roles' => $event->assigned_roles,
                    'is_generated'   => $event->is_generated,
                    'attended_count' => $isLeader ? $event->attendances->where('attended', true)->count() : null,
                    'my_attended'    => $myAttendance?->attended ?? false,
                    'is_past'        => $event->event_date->isPast(),
                    'attendees'      => $isLeader
                        ? $event->attendances->map(fn($a) => [
                            'id'       => $a->user_id,
                            'name'     => optional($a->user)->name ?? '(unknown)',
                            'attended' => $a->attended,
                        ])->values()
                        : [],
                ];
            });

        // ponytail: users org-wide supaya leader bisa override attendance
        // member dari tim lain — sinkron dengan cara Leaderboard hitung event rate.
        $users = $isLeader
            ? User::whereHas('teamMemberships', fn($q) => $q->whereIn('team_id', $orgTeamIds))
                ->orderBy('name')
                ->get(['id', 'name'])
            : collect();

        // Event L10/Quarterly/Annual dari tim lain di organisasi yang sama,
        // ditampilkan read-only di kalender supaya org_admin/leader bisa lihat
        // jadwal lintas tim tanpa perlu switch-team satu-satu.
        $otherTeamEvents = collect();
        if ($team && $team->organization_id) {
            $otherTeamEvents = Event::withoutGlobalScope(\App\Scopes\TeamScope::class)
                ->whereIn('type', ['l10', 'quarterly', 'annual', 'training', 'townhall', 'custom'])
                ->where('team_id', '!=', $teamId)
                ->whereHas('team', fn($q) => $q->where('organization_id', $team->organization_id))
                ->with('team:id,name')
                ->orderBy('event_date', 'asc')
                ->get()
                ->map(fn($event) => [
                    'id'            => $event->id,
                    'name'          => $event->name,
                    'type'          => $event->type,
                    'type_label'    => $event->type_label,
                    'event_date'    => $event->event_date->format('Y-m-d'),
                    'team_name'     => $event->team->name ?? 'Tim Lain',
                    'is_other_team' => true,
                ]);
        }

        return Inertia::render('Event/Index', [
            'events'           => $events,
            'otherTeamEvents'  => $otherTeamEvents,
            'users'            => $users,
            'isLeader'         => $isLeader,
            'teamSettings' => $team ? [
                'q1_start_date'  => $team->q1_start_date,
                'scorecard_day'  => $team->scorecard_day,
            ] : null,
        ]);
    }

    public function store(Request $request)
    {
        $teamId = TenantContext::teamId();
        $role   = Auth::user()->teamMemberships()->where('team_id', $teamId)->value('role');

        if ($role !== 'leader') {
            abort(403, 'Hanya leader yang bisa membuat event.');
        }

        $validated = $request->validate([
            'name'               => 'required|string|max:255',
            'type'               => 'required|in:training,townhall,l10,quarterly,annual,custom',
            'custom_type'        => 'nullable|string|max:100',
            'event_date'         => 'required|date',
            'description'        => 'nullable|string',
            'agenda'             => 'nullable|array',
            'agenda.*.title'     => 'required|string',
            'agenda.*.duration'  => 'nullable|integer',
            'agenda.*.desc'      => 'nullable|string',
            'assigned_roles'     => 'nullable|array',
            'assigned_roles.*'   => 'in:leader,member,tutor',
            'assigned_user_ids'  => 'nullable|array',
            'assigned_user_ids.*'=> 'exists:users,id',
            'is_generated'       => 'nullable|boolean',
        ]);

        // Auto-fill agenda kalau tidak di-override manual
        if (empty($validated['agenda']) && $validated['type'] !== 'custom') {
            $validated['agenda'] = self::agendaFor($validated['type']);
        }

        $validated['team_id']    = $teamId;
        $validated['created_by'] = Auth::id();
        $assignedUserIds         = $validated['assigned_user_ids'] ?? [];
        unset($validated['assigned_user_ids']);

        $event = Event::create($validated);

        foreach ($assignedUserIds as $uid) {
            EventAttendance::firstOrCreate(
                ['event_id' => $event->id, 'user_id' => $uid],
                ['attended' => false]
            );
        }

        return back()->with('message', 'Event dibuat.');
    }

    public function storeBulk(Request $request)
    {
        $teamId = TenantContext::teamId();
        $role   = Auth::user()->teamMemberships()->where('team_id', $teamId)->value('role');

        if ($role !== 'leader') abort(403);

        $request->validate([
            'events'               => 'required|array',
            'events.*.type'        => 'required|string',
            'events.*.name'        => 'required|string',
            'events.*.event_date'  => 'required|date',
        ]);

        foreach ($request->events as $ev) {
            Event::create([
                'team_id'      => $teamId,
                'created_by'   => Auth::id(),
                'name'         => $ev['name'],
                'type'         => $ev['type'],
                'event_date'   => $ev['event_date'],
                'description'  => $ev['description'] ?? null,
                'agenda'       => $ev['agenda'] ?? self::agendaFor($ev['type']),
                'is_generated' => true,
            ]);
        }

        return back()->with('message', count($request->events) . ' event berhasil digenerate.');
    }

    public function update(Request $request, Event $event)
    {
        $teamId = TenantContext::teamId();
        $role   = Auth::user()->teamMemberships()->where('team_id', $teamId)->value('role');

        if ($role !== 'leader') abort(403);
        if ($event->event_date->isPast()) abort(422, 'Event sudah lewat, tidak bisa diedit.');

        $validated = $request->validate([
            'name'           => 'sometimes|string|max:255',
            'type'           => 'sometimes|in:training,townhall,l10,quarterly,annual,custom',
            'custom_type'    => 'nullable|string|max:100',
            'event_date'     => 'sometimes|date',
            'description'    => 'nullable|string',
            'agenda'         => 'nullable|array',
            'assigned_roles' => 'nullable|array',
        ]);

        // Event generated yang diedit manual ditandai is_modified
        // supaya tidak ikut terhapus saat regenerasi otomatis dari Scorecard Setting.
        if ($event->is_generated) {
            $validated['is_modified'] = true;
        }

        $event->update($validated);

        return back()->with('message', 'Event diperbarui.');
    }

    public function markAttended(Request $request, Event $event)
    {
        $userId = Auth::id();
        $teamId = TenantContext::teamId();
        $role   = Auth::user()->teamMemberships()->where('team_id', $teamId)->value('role');

        // ponytail: izinkan self-attendance untuk event lintas tim di org yang sama.
        $currentTeam = Team::withoutGlobalScopes()->findOrFail($teamId);
        $orgTeamIds  = Team::withoutGlobalScopes()
            ->where('organization_id', $currentTeam->organization_id)
            ->pluck('id');
        abort_unless($orgTeamIds->contains($event->team_id), 403, 'Event bukan milik organisasi aktif.');

        $assignedRoles = $event->assigned_roles ?? [];
        if (!empty($assignedRoles) && ($role === null || !in_array($role, $assignedRoles, true))) {
            abort(403, 'Event ini tidak di-assign ke role kamu.');
        }

        EventAttendance::updateOrCreate(
            ['event_id' => $event->id, 'user_id' => $userId],
            ['attended' => true, 'marked_at' => now(), 'marked_by' => $userId]
        );

        return back()->with('message', 'Kehadiran dicatat.');
    }

    public function overrideAttendance(Request $request, Event $event)
    {
        $teamId = TenantContext::teamId();
        $user   = Auth::user();
        $role   = $user->roleIn($teamId);

        if ($role !== 'leader' && !$user->isAdminOfActiveOrg()) abort(403);

        // ponytail: event dari tim lain di org yang sama boleh di-override.
        // Sebelumnya guard tolak cross-team → angka Leaderboard (org-wide) tidak
        // match tampilan Events. Fix ini menyamakan scope keduanya.
        $currentTeam = Team::withoutGlobalScopes()->findOrFail($teamId);
        $orgTeamIds  = Team::withoutGlobalScopes()
            ->where('organization_id', $currentTeam->organization_id)
            ->pluck('id');
        abort_unless($orgTeamIds->contains($event->team_id), 403, 'Event bukan milik organisasi aktif.');

        $request->validate([
            'user_id'  => 'required|exists:users,id',
            'attended' => 'nullable|boolean',
        ]);

        // ponytail: frontend kirim {} tanpa 'attended' — default true karena
        // tombol Override hanya muncul kalau belum hadir (!a.attended).
        $attended = $request->has('attended') ? (bool) $request->attended : true;

        EventAttendance::updateOrCreate(
            ['event_id' => $event->id, 'user_id' => $request->user_id],
            ['attended' => $attended, 'marked_at' => now(), 'marked_by' => Auth::id()]
        );

        return back()->with('message', 'Kehadiran di-override.');
    }

    public function destroy(Event $event)
    {
        $teamId = TenantContext::teamId();
        $role   = Auth::user()->teamMemberships()->where('team_id', $teamId)->value('role');

        if ($role !== 'leader') abort(403);

        $event->delete();

        return back()->with('message', 'Event dihapus.');
    }
}
