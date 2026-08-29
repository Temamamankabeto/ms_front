<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\OfficerApplicationActionRequest;
use App\Models\ServiceApplication;
use App\Services\OfficerApplicationService;
use Illuminate\Http\Request;

class ManagerApplicationController extends Controller
{
    public function __construct(protected OfficerApplicationService $service) {}

    public function queue(Request $request)
    {
        return response()->json(['success'=>true,'message'=>'Manager queue retrieved successfully','data'=>$this->service->managerQueue($request->user(), $request->query('bucket'))]);
    }

    public function show(ServiceApplication $application)
    {
        return response()->json(['success'=>true,'message'=>'Application retrieved successfully','data'=>$this->service->show($application)]);
    }

    public function assign(OfficerApplicationActionRequest $request, ServiceApplication $application)
    {
        return response()->json(['success'=>true,'message'=>'Application assigned successfully','data'=>$this->service->managerAssign($application,$request->user(),$request->validated())]);
    }

    public function returnToOfficer(OfficerApplicationActionRequest $request, ServiceApplication $application)
    {
        return response()->json(['success'=>true,'message'=>'Application returned to officer successfully','data'=>$this->service->managerReturn($application,$request->user(),$request->remark)]);
    }

    public function escalateUp(OfficerApplicationActionRequest $request, ServiceApplication $application)
    {
        return response()->json(['success'=>true,'message'=>'Application escalated upward successfully','data'=>$this->service->managerEscalateUp($application,$request->user(),$request->validated())]);
    }
}
