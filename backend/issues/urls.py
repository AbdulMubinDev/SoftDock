from django.urls import path
from .views import (
    IssueListCreateView,
    IssueDetailView,
    IssueTransferView,
    SendMessageView,
    AttachmentServeView,
)

urlpatterns = [
    path("", IssueListCreateView.as_view(), name="issue_list_create"),
    path("<uuid:pk>/", IssueDetailView.as_view(), name="issue_detail"),
    path("<uuid:pk>/transfer/", IssueTransferView.as_view(), name="issue_transfer"),
    path("<uuid:pk>/messages/", SendMessageView.as_view(), name="send_message"),
    path("<uuid:pk>/attachments/<uuid:attachment_id>/", AttachmentServeView.as_view(), name="serve_attachment"),
]
