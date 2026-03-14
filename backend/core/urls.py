from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/workspaces/", include("workspaces.urls")),
    # Knowledge and Issues are nested under workspaces in their own url files
]
