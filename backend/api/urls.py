from django.urls import path
from .views import HelloView #import your views
from . import views

urlpatterns = [
    path('hello/', HelloView.as_view()),
    path('data/',views.csvdat,name="csvdata"),
]