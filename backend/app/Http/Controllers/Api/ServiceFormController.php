<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

use App\Http\Requests\StoreServiceFormRequest;
use App\Http\Requests\UpdateServiceFormRequest;

use App\Models\ServiceForm;

use App\Services\ServiceFormService;

use Illuminate\Http\Request;

class ServiceFormController extends Controller
{
    public function __construct(
        protected ServiceFormService $service
    ) {}

    public function index(Request $request)
    {
        return response()->json(
            $this->service->list($request)
        );
    }

    public function store(
        StoreServiceFormRequest $request
    ) {

        $data = $this->service->create(
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Created successfully',
            'data' => $data
        ]);
    }

    public function show(
        ServiceForm $serviceForm
    ) {

        return response()->json([
            'success' => true,
            'data' => $serviceForm->load('service')
        ]);
    }

    public function update(
        UpdateServiceFormRequest $request,
        ServiceForm $serviceForm
    ) {

        $data = $this->service->update(
            $serviceForm,
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Updated successfully',
            'data' => $data
        ]);
    }

    public function destroy(
        ServiceForm $serviceForm
    ) {

        $this->service->delete(
            $serviceForm
        );

        return response()->json([
            'success' => true,
            'message' => 'Deleted successfully'
        ]);
    }
}