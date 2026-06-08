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
        $vto = VTOPlan::where('team_id', Auth::user()->team_id)->first();
        $coreValues = $vto->core_values ?? [];

        $evaluations = Evaluation::with('user')->get();
        $users = User::all(['id', 'name']);

        return Inertia::render('PeopleAnalyzer/Index', [
            'evaluations' => EvaluationResource::collection($evaluations),
            'users' => $users,
            'coreValues' => $coreValues,
        ]);
    }

    public function store(Request $request, CreateEvaluation $createEvaluation)
    {
        $createEvaluation->execute($request->all());
        return back()->with('message', 'Evaluation saved');
    }
}
