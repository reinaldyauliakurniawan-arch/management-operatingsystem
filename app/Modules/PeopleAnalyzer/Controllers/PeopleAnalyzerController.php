<?php

namespace App\Modules\PeopleAnalyzer\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\PeopleAnalyzer\Actions\CreateEvaluation;
use App\Modules\PeopleAnalyzer\Models\Evaluation;
use App\Modules\PeopleAnalyzer\Resources\EvaluationResource;
use App\Modules\VTO\Models\VTOPlan;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class PeopleAnalyzerController extends Controller
{
    public function index()
    {
        $teamId     = session('active_team_id');
        $vto        = VTOPlan::withoutGlobalScopes()->where('team_id', $teamId)->first();
        $coreValues = $vto->core_values ?? [];

        $evaluations = Evaluation::with(['evaluatee', 'evaluator'])
            ->where('team_id', $teamId)
            ->get();

        $users = $teamId
            ? User::whereHas('teamMemberships', fn($q) => $q->where('team_id', $teamId))->get(['id', 'name'])
            : User::all(['id', 'name']);

        return Inertia::render('PeopleAnalyzer/Index', [
            'evaluations' => EvaluationResource::collection($evaluations),
            'users'       => $users,
            'coreValues'  => $coreValues,
        ]);
    }

    public function store(Request $request, CreateEvaluation $createEvaluation)
    {
        $teamId = session('active_team_id');
        $role   = $request->user()->teamMemberships()->where('team_id', $teamId)->value('role');

        if ($role !== 'leader') {
            abort(403, 'Hanya leader yang bisa membuat evaluasi.');
        }

        $validated = $request->validate([
            'evaluatee_id'       => 'required|exists:users,id',
            'core_value_ratings' => 'nullable|array',
            'gets_it'            => 'required|in:y,n',
            'wants_it'           => 'required|in:y,n',
            'capacity'           => 'required|in:y,n',
        ]);

        $validated['evaluator_id'] = Auth::id();
        $createEvaluation->execute($validated);
        return back()->with('message', 'Evaluation saved');
    }
}
