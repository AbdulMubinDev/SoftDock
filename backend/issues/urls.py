from django.urls import path
from .views import IssueListCreateView, IssueDetailView, SendMessageView

urlpatterns = [
    path("", IssueListCreateView.as_view(), name="issue_list_create"),
    path("<uuid:pk>/", IssueDetailView.as_view(), name="issue_detail"),
    path("<uuid:pk>/messages/", SendMessageView.as_view(), name="send_message"),
]
