<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// List all tables
Route::get('/tables', function () {
    $tables = DB::select('SHOW TABLES');
    $tables = array_map('array_values', array_map('get_object_vars', $tables));
    return response()->json(array_column($tables, 0));
});

// Describe a table
Route::get('/tables/{table}/columns', function ($table) {
    $columns = DB::select("DESCRIBE `$table`");
    return response()->json($columns);
});

// List records
Route::get('/tables/{table}', function (Request $request, $table) {
    $query = DB::table($table);
    foreach ($request->query() as $key => $value) {
        if (!in_array($key, ['limit', 'offset'])) {
            $query->where($key, $value);
        }
    }
    $limit = $request->query('limit', 50);
    $offset = $request->query('offset', 0);
    return response()->json($query->limit($limit)->offset($offset)->get());
});

// Get single record
Route::get('/tables/{table}/{id}', function ($table, $id) {
    $row = DB::table($table)->find($id);
    if (!$row) return response()->json(['error' => 'Not found'], 404);
    return response()->json($row);
});

// Create record
Route::post('/tables/{table}', function (Request $request, $table) {
    $data = $request->json()->all();
    $data['created_at'] = $data['created_at'] ?? now();
    $data['updated_at'] = now();
    $id = DB::table($table)->insertGetId($data);
    return response()->json(DB::table($table)->find($id), 201);
});

// Update record
Route::put('/tables/{table}/{id}', function (Request $request, $table, $id) {
    $data = $request->json()->all();
    $data['updated_at'] = now();
    DB::table($table)->where('id', $id)->update($data);
    return response()->json(DB::table($table)->find($id));
});

// Delete record
Route::delete('/tables/{table}/{id}', function ($table, $id) {
    $row = DB::table($table)->find($id);
    if (!$row) return response()->json(['error' => 'Not found'], 404);
    DB::table($table)->where('id', $id)->delete();
    return response()->json(['deleted' => true]);
});
