#ifndef PLAYFAB_RESULT_HANDLER_H_
#define PLAYFAB_RESULT_HANDLER_H_

#include "HttpRequest.h"
#include "PlayFabBaseModel.h"

namespace PlayFab
{


    class PlayFabRequestHandler
    {
    public:

        static bool DecodeRequest(int httpStatus, HttpRequest* request, void* userData, PlayFabBaseModel& outResult, PlayFabError& outError);

    };

  
};

#endif