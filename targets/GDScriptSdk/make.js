var path = require("path");

if (typeof (getCompiledTemplate) === "undefined") getCompiledTemplate = function () { };
if (typeof (templatizeTree) === "undefined") templatizeTree = function () { };


function getVerticalNameDefault() {
    if (sdkGlobals.verticalName) {
        return "\"" + sdkGlobals.verticalName + "\"";
    }

    return "null";
}


function getAuthParams(apiCall) {
    if (apiCall.url === "/Authentication/GetEntityToken")
        return "authKey, authValue";
    if (apiCall.auth === "EntityToken")
        return "\"X-EntityToken\", PlayFabSettings._internalSettings.EntityToken";
    if (apiCall.auth === "SecretKey")
        return "\"X-SecretKey\", PlayFabSettings.DeveloperSecretKey";
    else if (apiCall.auth === "SessionTicket")
        return "\"X-Authorization\", PlayFabSettings._internalSettings.ClientSessionTicket";
    return "null, null";
}


function getRequestActions(tabbing, apiCall) {
    if (apiCall.result === "LoginResult" || apiCall.request === "RegisterPlayFabUserRequest") {
        str_result = "";
        str_result += tabbing + "if \"TitleId\" in dict_request:\n";
        str_result += tabbing + "    pass\n";
        str_result += tabbing + "else:\n";
        str_result += tabbing + "    dict_request[\"TitleId\"] = PlayFabSettings.TitleId\n";
        str_result += tabbing + "if not dict_request[\"TitleId\"]:\n";
        str_result += tabbing + "    # Must be have TitleId set to call this method\n";
        str_result += tabbing + "    assert(false)\n";
        return str_result;
    }
    if (apiCall.auth === "EntityToken") {
        str_result = "";
        str_result += tabbing + "if not PlayFabSettings._internalSettings.EntityToken:\n";
        str_result += tabbing + "    # Must call GetEntityToken before calling this method\n";
        str_result += tabbing + "    assert(false)\n";
        return str_result;
    }
    if (apiCall.auth === "SessionTicket") {
        str_result = "";
        str_result += tabbing + "if not PlayFabSettings._internalSettings.ClientSessionTicket:\n";
        str_result += tabbing + "    # Must be logged in to call this method\n";
        str_result += tabbing + "    assert(false)\n";
        return str_result;
    }
    if (apiCall.auth === "SecretKey") {
        str_result = "";
        str_result += tabbing + "if not PlayFabSettings._internalSettings.DeveloperSecretKey:\n";
        str_result += tabbing + "    # Must have DeveloperSecretKey set to call this method\n";
        str_result += tabbing + "    assert(false)\n";
        return str_result;
    }
    if (apiCall.url === "/Authentication/GetEntityToken")
        return tabbing + "var authKey = null\n"
            + tabbing + "var authValue = null\n\n"
            + tabbing + "if PlayFabSettings._internalSettings.EntityToken:\n"
            + tabbing + "    authKey = \"X-EntityToken\"\n"
            + tabbing + "    authValue = PlayFabSettings._internalSettings.EntityToken\n"
            + tabbing + "elif PlayFabSettings._internalSettings.ClientSessionTicket:\n"
            + tabbing + "    authKey = \"X-Authorization\"\n"
            + tabbing + "    authValue = PlayFabSettings._internalSettings.ClientSessionTicket \n"
            + tabbing + "elif PlayFabSettings.DeveloperSecretKey:\n"
            + tabbing + "    authKey = \"X-SecretKey\"\n"
            + tabbing + "    authValue = PlayFabSettings.DeveloperSecretKey \n";
    return "";
}


function getResultActions(tabbing, apiCall, api) {

    if (apiCall.result === "LoginResult") {
        str_result = "";
        str_result += tabbing + "PlayFabHTTPRequest.reset_connection()\n"
        str_result += tabbing + "PlayFabHTTPRequest.connect(\"request_completed\", PlayFabHTTPRequest, \"_evt_LoginResult\")"
        return str_result;
    }
    else if (apiCall.result === "RegisterPlayFabUserResult") {
        str_result = "";
        str_result += tabbing + "PlayFabHTTPRequest.reset_connection()\n"
        str_result += tabbing + "PlayFabHTTPRequest.connect(\"request_completed\", PlayFabHTTPRequest, \"_evt_RegisterPlayFabUserResult\")"
        return str_result;
    }
    else if (apiCall.result === "AttributeInstallResult") {
        str_result = "";
        str_result += tabbing + "PlayFabHTTPRequest.reset_connection()\n"
        str_result += tabbing + "PlayFabHTTPRequest.connect(\"request_completed\", PlayFabHTTPRequest, \"_evt_AttributeInstallResult\")"
        return str_result;
    }
    else if (apiCall.result === "GetEntityTokenResponse") {
        str_result = "";
        str_result += tabbing + "PlayFabHTTPRequest.reset_connection()\n"
        str_result += tabbing + "PlayFabHTTPRequest.connect(\"request_completed\", PlayFabHTTPRequest, \"_evt_GetEntityTokenResponse\")"
        return str_result;
    }
    else {
        str_result = "";
        str_result += tabbing + "PlayFabHTTPRequest.reset_connection()\n"
        str_result += tabbing + "PlayFabHTTPRequest.connect(\"request_completed\", PlayFabHTTPRequest, \"_evt_RequestCompleted\")"
        return str_result;
    }

    return "";
}


exports.makeCombinedAPI = function (apis, sourceDir, apiOutputDir) {
    var locals = {
        apis: apis,
        buildIdentifier: sdkGlobals.buildIdentifier,
        friendlyName: "PlayFab GDScript Combined Sdk",
        errorList: apis[0].errorList,
        errors: apis[0].errors,
        sdkVersion: sdkGlobals.sdkVersion,
        getVerticalNameDefault: getVerticalNameDefault
    };

    // console.log(sdkGlobals)

    for (var i = 0; i < apis.length; i++) {
        // console.log("API >>> " + apis[i].url + " " + apis[i].name);
        for (var j = 0; j < apis[i].calls.length; j++) {
            // console.log("    CALL >>> " + apis[i].calls[j].url + " " + apis[i].calls[j].name);

            var api_locals = {
                api: apis[i],
                getAuthParams: getAuthParams,
                getRequestActions: getRequestActions,
                getResultActions: getResultActions,
                hasClientOptions: getAuthMechanisms([apis[i]]).includes("SessionTicket")
            }

            var apiTemplate = getCompiledTemplate(path.resolve(sourceDir, "templates/API.gd.ejs"));
            writeFile(path.resolve(apiOutputDir, "PlayFabSDK/PlayFab" + apis[i].name + "API.gd"), apiTemplate(api_locals));
        }
    }

    templatizeTree(locals, path.resolve(sourceDir, "source"), apiOutputDir);
}
