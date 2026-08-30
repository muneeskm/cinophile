from django.db import models
from django.contrib.auth.models import User

class WatchlistItem(models.Model):
    MEDIA_CHOICES = [
        ('Movie', 'Movie'),
        ('TV', 'TV'),
    ]

    STATUS_CHOICES = [
        ('Plan to Watch', 'Plan to Watch'),
        ('Watching', 'Watching'),
        ('Completed', 'Completed'),
        ('Dropped', 'Dropped'),
    ]

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='watchlist')
    title = models.CharField(max_length=255)
    media_type = models.CharField(max_length=20, choices=MEDIA_CHOICES, default='Movie')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Plan to Watch')
    rating = models.FloatField(default=0.0)
    poster_path = models.CharField(max_length=500, blank=True, null=True)
    is_custom = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.owner.username})"