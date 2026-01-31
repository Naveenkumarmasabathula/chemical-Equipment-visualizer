from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return response
    request = context.get("request")
    if (
        request
        and response.status_code == 403
        and getattr(request, "user", None)
        and not request.user.is_authenticated
    ):
        response.status_code = 401
    if response.status_code == 401 and response.has_header("WWW-Authenticate"):
        del response["WWW-Authenticate"]
    return response
