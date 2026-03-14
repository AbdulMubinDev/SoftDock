from django.urls import path
from .views import KnowledgeListCreateView, KnowledgeDetailView

urlpatterns = [
    path("", KnowledgeListCreateView.as_view(), name="knowledge_list_create"),
    path("<uuid:pk>/", KnowledgeDetailView.as_view(), name="knowledge_detail"),
]
