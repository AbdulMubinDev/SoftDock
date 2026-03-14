from django.urls import path, include
from .views import WorkspaceListCreateView, WorkspaceDetailView, WorkspaceMemberListView

urlpatterns = [
    path("", WorkspaceListCreateView.as_view(), name="workspace_list_create"),
    path("<slug:slug>/", WorkspaceDetailView.as_view(), name="workspace_detail"),
    path("<slug:slug>/members/", WorkspaceMemberListView.as_view(), name="workspace_members"),
    # Nested: knowledge and issues
    path("<slug:workspace_slug>/knowledge/", include("knowledge.urls")),
    path("<slug:workspace_slug>/issues/", include("issues.urls")),
]
