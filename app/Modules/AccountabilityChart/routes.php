<?php

use App\Modules\AccountabilityChart\Controllers\AccountabilityChartController;
use Illuminate\Support\Facades\Route;

Route::get("/accountability-chart", [
    AccountabilityChartController::class,
    "index",
])->name("accountability.index");
Route::post("/accountability-chart", [
    AccountabilityChartController::class,
    "store",
])->name("accountability-chart.store");
Route::patch("/accountability-chart/{seat}", [
    AccountabilityChartController::class,
    "update",
])->name("accountability-chart.update");
Route::delete("/accountability-chart/{seat}", [
    AccountabilityChartController::class,
    "destroy",
])->name("accountability-chart.destroy");
