from django.db import models
import json

class Patient(models.Model):
    patient_id = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    admission_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='stable')
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.patient_id})"
    
    @property
    def latest_test(self):
        return self.sepsistest_set.order_by('-timestamp').first()
    
    @property
    def latest_vitals(self):
        return self.vitals_set.order_by('-timestamp').first()

class Vitals(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    heart_rate = models.FloatField(null=True, blank=True)
    temperature = models.FloatField(null=True, blank=True)
    systolic_bp = models.FloatField(null=True, blank=True)
    diastolic_bp = models.FloatField(null=True, blank=True)
    oxygen_saturation = models.FloatField(null=True, blank=True)
    respiratory_rate = models.FloatField(null=True, blank=True)
    mean_arterial_pressure = models.FloatField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        # Calculate MAP if systolic and diastolic BP are provided
        if self.systolic_bp and self.diastolic_bp:
            self.mean_arterial_pressure = self.diastolic_bp + (self.systolic_bp - self.diastolic_bp) / 3
        super().save(*args, **kwargs)

class SepsisTest(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    risk_score = models.FloatField()
    confidence = models.FloatField(default=0)
    model_predictions = models.JSONField(default=dict)  # Stores predictions from individual models
    
    def __str__(self):
        return f"Sepsis Test for {self.patient} - Score: {self.risk_score}"

class Alert(models.Model):
    ALERT_TYPES = (
        ('critical', 'Critical'),
        ('warning', 'Warning'),
        ('info', 'Information'),
    )
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    type = models.CharField(max_length=10, choices=ALERT_TYPES)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    acknowledged = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.type.upper()} Alert for {self.patient}"

class TestingSchedule(models.Model):
    interval_minutes = models.IntegerField(default=120)
    last_run = models.DateTimeField(null=True, blank=True)
    next_run = models.DateTimeField(null=True, blank=True)
    critical_threshold = models.IntegerField(default=85)
    warning_threshold = models.IntegerField(default=65)
    audio_alerts = models.BooleanField(default=True)
    email_notifications = models.BooleanField(default=True)
    sms_alerts = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Testing Schedule (Every {self.interval_minutes} minutes)"

class SensorStatus(models.Model):
    SENSOR_TYPES = (
        ('heart_rate', 'Heart Rate Monitor'),
        ('temperature', 'Temperature Sensor'),
        ('blood_pressure', 'Blood Pressure Monitor'),
        ('oxygen', 'Oxygen Saturation Sensor'),
    )
    
    STATUS_CHOICES = (
        ('online', 'Online'),
        ('offline', 'Offline'),
        ('error', 'Error'),
    )
    
    sensor_type = models.CharField(max_length=20, choices=SENSOR_TYPES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='online')
    last_updated = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.get_sensor_type_display()} - {self.status}"