from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegisterView, WatchlistItemViewSet

router = DefaultRouter()
router.register(r'watchlist', WatchlistItemViewSet, basename='watchlist')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
]