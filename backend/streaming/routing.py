from django.urls import re_path
from .consumers import IssueStreamConsumer

websocket_urlpatterns = [
    re_path(r"ws/issues/(?P<issue_id>[0-9a-f-]+)/$", IssueStreamConsumer.as_asgi()),
]
