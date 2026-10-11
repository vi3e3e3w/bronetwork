
import logging
import time


class AccessLogMiddleware:
    def __init__(self, app):
        self.app = app
        self.logger = logging.getLogger("bro-network.access")

    def __call__(self, environ, start_response):
        started = time.perf_counter()
        status = "-"
        logged = False
        response = None
        response_closed = False

        method = environ.get("REQUEST_METHOD", "-")
        path = environ.get("PATH_INFO", "/")
        query = environ.get("QUERY_STRING", "")
        protocol = environ.get("SERVER_PROTOCOL", "HTTP/1.1")
        client = environ.get("REMOTE_ADDR", "-")

        if query:
            path = f"{path}?{query}"

        def log_once():
            nonlocal logged
            if not logged:
                logged = True
                elapsed = time.perf_counter() - started
                self.logger.info(
                    '%s - "%s %s %s" %s %.3fs',
                    client, method, path, protocol, status, elapsed
                )

        def close_response():
            nonlocal response_closed
            if response is not None and not response_closed:
                response_closed = True
                close = getattr(response, "close", None)
                if close:
                    close()

        def wrapped_start_response(status_line, headers, exc_info=None):
            nonlocal status
            status = status_line.split(" ", 1)[0]
            return start_response(status_line, headers, exc_info)

        try:
            response = self.app(environ, wrapped_start_response)
        except Exception:
            log_once()
            raise

        def generate():
            try:
                yield from response
            finally:
                try:
                    close_response()
                finally:
                    log_once()

        return generate()

