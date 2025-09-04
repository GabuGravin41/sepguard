from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from django.http import HttpResponseRedirect
from .models import Patient, Vitals, SepsisTest, Alert, TestingSchedule, SensorStatus
from .forms import VitalsForm, AlertConfigForm
import json
from datetime import datetime, timedelta
import math

def get_recommended_actions(risk_score):
    if risk_score >= 85:
        return [
            "Immediate medical attention required",
            "Contact attending physician",
            "Consider antibiotic therapy",
            "Increase monitoring frequency"
        ]
    elif risk_score >= 65:
        return [
            "Monitor closely",
            "Consider additional testing",
            "Notify medical team"
        ]
    elif risk_score >= 40:
        return [
            "Continue routine monitoring",
            "Review patient history"
        ]
    return ["Maintain current care plan"]

def dashboard(request):
    stats = {
        'active_patients': Patient.objects.count(),
        'high_risk_count': Patient.objects.filter(sepsistest__risk_score__gte=65).distinct().count(),
        'critical_alerts': Alert.objects.filter(type='critical', acknowledged=False).count(),
        'tests_today': SepsisTest.objects.filter(timestamp__date=datetime.today()).count(),
        'avg_response_time': '2.5s',  # Placeholder; calculate from actual data if available
    }
    
    recent_alerts = Alert.objects.filter(acknowledged=False).order_by('-timestamp')[:5]
    high_risk_patients = [p for p in Patient.objects.all() if p.latest_test and p.latest_test.risk_score >= 65][:5]
    
    context = {
        'stats': stats,
        'recent_alerts': recent_alerts,
        'high_risk_patients': high_risk_patients,
    }
    return render(request, 'dashboard.html', context)

def patient_details(request, patient_id):
    patient = get_object_or_404(Patient, pk=patient_id)
    test_history = SepsisTest.objects.filter(patient=patient).order_by('-timestamp')[:6]
    alert_history = Alert.objects.filter(patient=patient).order_by('-timestamp')[:5]
    recommended_actions = get_recommended_actions(patient.latest_test.risk_score) if patient.latest_test else []
    
    context = {
        'patient': patient,
        'test_history': test_history,
        'alert_history': alert_history,
        'recommended_actions': recommended_actions,
    }
    return render(request, 'patient_details_modal.html', context)

def patient_monitoring_grid(request):
    patients = Patient.objects.all()
    more_patients = max(0, len(patients) - 3)
    patients = patients[:3] if more_patients else patients
    
    def get_last_update(timestamp):
        if not timestamp:
            return 'No data'
        now = datetime.now()
        diff = now - timestamp
        minutes = diff.total_seconds() // 60
        if minutes < 1:
            return 'Updated now'
        if minutes < 60:
            return f"Updated {int(minutes)}m ago"
        return f"Updated {int(minutes // 60)}h ago"
    
    for patient in patients:
        patient.last_update = get_last_update(patient.latest_vitals.timestamp if patient.latest_vitals else None)
    
    context = {
        'patients': patients,
        'more_patients': more_patients,
    }
    return render(request, 'patient_monitoring_grid.html', context)

def sensor_status_panel(request):
    sensor_status = SensorStatus.objects.all()
    sensor_types = ['heart_rate', 'temperature', 'blood_pressure', 'oxygen']
    
    def get_sensor_label(t):
        return {
            'heart_rate': 'Heart Rate Monitors',
            'temperature': 'Temperature Sensors',
            'blood_pressure': 'Blood Pressure',
            'oxygen': 'O2 Saturation'
        }.get(t, t)
    
    def get_sensor_counts(t):
        sensors = [s for s in sensor_status if s.sensor_type == t]
        online = len([s for s in sensors if s.status == 'online'])
        total = len(sensors)
        return {'online': online, 'total': total}
    
    def get_status_class(online, total):
        if total == 0:
            return 'critical'
        percentage = online / total
        if percentage >= 0.9:
            return 'normal'
        if percentage >= 0.7:
            return 'warning'
        return 'critical'
    
    sensor_statuses = {}
    for t in sensor_types:
        counts = get_sensor_counts(t)
        sensor_statuses[t] = {
            'online': counts['online'],
            'total': counts['total'],
            'status_class': get_status_class(counts['online'], counts['total'])
        }
    
    context = {
        'sensor_types': sensor_types,
        'sensor_labels': lambda t: get_sensor_label(t),
        'sensor_statuses': lambda t: sensor_statuses.get(t, {}),
    }
    return render(request, 'sensor_status_panel.html', context)

def automated_testing_panel(request):
    schedule = TestingSchedule.objects.first()
    selected_interval = schedule.interval_minutes if schedule else 120
    
    def get_interval_label(minutes):
        if minutes < 60:
            return f"Every {minutes} minutes"
        if minutes == 60:
            return 'Every 1 hour'
        return f"Every {minutes // 60} hours"
    
    def get_next_test_time(schedule):
        if not schedule or not schedule.next_run:
            return 'Unknown'
        now = datetime.now()
        diff = schedule.next_run - now
        minutes = diff.total_seconds() // 60
        if minutes <= 0:
            return 'Starting soon...'
        if minutes < 60:
            return f"{int(minutes)} minutes"
        return f"{int(minutes // 60)}h {int(minutes % 60)}m"
    
    def get_test_progress(schedule):
        if not schedule or not schedule.last_run or not schedule.next_run:
            return 0
        now = datetime.now()
        total = (schedule.next_run - schedule.last_run).total_seconds()
        elapsed = (now - schedule.last_run).total_seconds()
        return min(100, max(0, (elapsed / total) * 100))
    
    recent_tests = SepsisTest.objects.filter(is_automatic=True).order_by('-timestamp')[:3].values('timestamp', 'patient__id').annotate(patients_count=models.Count('patient__id'))
    recent_tests = [
        {'time': test['timestamp'].strftime('%H:%M'), 'patients_count': test['patients_count']}
        for test in recent_tests
    ]
    
    context = {
        'schedule': schedule,
        'selected_interval': selected_interval,
        'interval_label': get_interval_label(selected_interval),
        'next_test_time': get_next_test_time(schedule),
        'test_progress': get_test_progress(schedule),
        'recent_tests': recent_tests,
    }
    return render(request, 'automated_testing_panel.html', context)

def update_testing_schedule(request):
    if request.method == 'POST':
        interval = int(request.POST.get('interval_minutes', 120))
        schedule, created = TestingSchedule.objects.get_or_create(pk=1)
        schedule.interval_minutes = interval
        schedule.last_run = datetime.now()
        schedule.next_run = schedule.last_run + timedelta(minutes=interval)
        schedule.save()
        messages.success(request, "Testing schedule updated successfully.")
    return redirect('automated_testing_panel')

def run_manual_test(request):
    if request.method == 'POST':
        patients = Patient.objects.all()
        for patient in patients:
            # Placeholder for actual sepsis test logic
            risk_score = 50  # Mock value; replace with actual model prediction
            SepsisTest.objects.create(
                patient=patient,
                risk_score=risk_score,
                confidence=0.9,
                model_predictions=[{"model_name": "Mock", "prediction": risk_score, "confidence": 0.9}],
                is_automatic=False
            )
        messages.success(request, "Manual test completed.")
    return redirect('automated_testing_panel')

def manual_entry_panel(request):
    form = VitalsForm()
    context = {'form': form, 'form_errors': form.errors}
    return render(request, 'manual_entry_panel.html', context)

def submit_manual_vitals(request):
    if request.method == 'POST':
        form = VitalsForm(request.POST)
        if form.is_valid():
            vitals = Vitals.objects.create(
                patient=form.cleaned_data['patient'],
                heart_rate=form.cleaned_data['heart_rate'],
                temperature=form.cleaned_data['temperature'],
                systolic_bp=form.cleaned_data['systolic_bp'],
                diastolic_bp=form.cleaned_data['diastolic_bp'],
                oxygen_saturation=form.cleaned_data['oxygen_saturation'],
                respiratory_rate=form.cleaned_data['respiratory_rate'],
            )
            # Run sepsis test (placeholder)
            risk_score = 50  # Mock value
            SepsisTest.objects.create(
                patient=vitals.patient,
                risk_score=risk_score,
                confidence=0.9,
                model_predictions=[{"model_name": "Mock", "prediction": risk_score, "confidence": 0.9}],
                is_automatic=False
            )
            messages.success(request, "Vitals submitted successfully.")
            return redirect('manual_entry_panel')
        else:
            messages.error(request, "Please correct the errors in the form.")
            return render(request, 'manual_entry_panel.html', {'form': form, 'form_errors': form.errors})
    return redirect('manual_entry_panel')

def alerts_panel(request):
    critical_alerts = Alert.objects.filter(type='critical', acknowledged=False)
    context = {'critical_alerts': critical_alerts}
    return render(request, 'alerts_panel.html', context)

def acknowledge_alert(request, alert_id):
    if request.method == 'POST':
        alert = get_object_or_404(Alert, pk=alert_id)
        alert.acknowledged = True
        alert.save()
        messages.success(request, "Alert acknowledged.")
    return redirect('alerts_panel')

def alert_config(request):
    schedule = TestingSchedule.objects.first()
    form = AlertConfigForm(instance=schedule)
    if request.method == 'POST':
        form = AlertConfigForm(request.POST, instance=schedule)
        if form.is_valid():
            form.save()
            messages.success(request, "Alert configuration updated.")
            return redirect('alert_config')
    context = {
        'form': form,
        'critical_threshold': schedule.critical_threshold if schedule else 85,
        'warning_threshold': schedule.warning_threshold if schedule else 65,
        'audio_alerts': schedule.audio_alerts if schedule else True,
        'email_notifications': schedule.email_notifications if schedule else True,
        'sms_alerts': schedule.sms_alerts if schedule else False,
    }
    return render(request, 'alert_config_panel.html', context)

def model_prediction_panel(request, patient_id=None):
    if patient_id:
        patient = get_object_or_404(Patient, pk=patient_id)
        test_history = SepsisTest.objects.filter(patient=patient)
        latest_test = patient.latest_test
        model_predictions = latest_test.model_predictions if latest_test else []
        ensemble_prediction = latest_test.risk_score if latest_test else 0
        context = {
            'patient': patient,
            'model_predictions': model_predictions,
            'latest_test': latest_test,
            'ensemble_prediction': ensemble_prediction,
        }
    else:
        context = {}
    return render(request, 'model_prediction_panel.html', context)

def retest_patient(request, patient_id):
    if request.method == 'POST':
        patient = get_object_or_404(Patient, pk=patient_id)
        # Placeholder for retest logic
        risk_score = 50  # Mock value
        SepsisTest.objects.create(
            patient=patient,
            risk_score=risk_score,
            confidence=0.9,
            model_predictions=[{"model_name": "Mock", "prediction": risk_score, "confidence": 0.9}],
            is_automatic=False
        )
        messages.success(request, "Retest completed.")
    return redirect('model_prediction_panel', patient_id=patient_id)

def sidebar(request):
    is_dark = request.session.get('is_dark', False)
    last_update = datetime.now().strftime("%Y-%m-%d %H:%M")
    alert_count = Alert.objects.filter(acknowledged=False).count()
    context = {
        'is_dark': is_dark,
        'last_update': last_update,
        'alert_count': alert_count,
    }
    return render(request, 'sidebar.html', context)

def toggle_dark_mode(request):
    if request.method == 'POST':
        request.session['is_dark'] = not request.session.get('is_dark', False)
        messages.success(request, "Dark mode toggled.")
    return redirect(request.POST.get('next', 'dashboard'))

def stats_overview(request):
    stats = {
        'active_patients': Patient.objects.count(),
        'high_risk_count': Patient.objects.filter(sepsistest__risk_score__gte=65).distinct().count(),
        'tests_today': SepsisTest.objects.filter(timestamp__date=datetime.today()).count(),
        'avg_response_time': '2.5s',  # Placeholder
    }
    context = {'stats': stats}
    return render(request, 'stats_overview.html', context)

def vitals_chart(request, patient_id):
    patient = get_object_or_404(Patient, pk=patient_id)
    time_range = request.GET.get('time_range', '24')
    hours_ago = int(time_range)
    cutoff = datetime.now() - timedelta(hours=hours_ago)
    vitals_history = Vitals.objects.filter(patient=patient, timestamp__gte=cutoff).order_by('-timestamp')
    
    chart_labels = [v.timestamp.strftime('%H:%M') for v in vitals_history]
    heart_rate_data = [v.heart_rate if v.heart_rate is not None else None for v in vitals_history]
    temperature_data = [v.temperature if v.temperature is not None else None for v in vitals_history]
    systolic_bp_data = [v.systolic_bp if v.systolic_bp is not None else None for v in vitals_history]
    oxygen_sat_data = [v.oxygen_saturation if v.oxygen_saturation is not None else None for v in vitals_history]
    
    chart_data = bool(vitals_history)
    current_vitals = patient.latest_vitals
    previous_vitals = vitals_history[1] if len(vitals_history) > 1 else None
    
    def get_trend(current, previous):
        if current is None or previous is None:
            return None
        return 'up' if current > previous else 'down'
    
    context = {
        'patient': patient,
        'time_range': time_range,
        'chart_data': chart_data,
        'chart_labels': json.dumps(chart_labels),
        'heart_rate_data': json.dumps(heart_rate_data),
        'temperature_data': json.dumps(temperature_data),
        'systolic_bp_data': json.dumps(systolic_bp_data),
        'oxygen_sat_data': json.dumps(oxygen_sat_data),
        'current_vitals': current_vitals,
        'previous_vitals': previous_vitals,
        'hr_trend': get_trend(current_vitals.heart_rate if current_vitals else None, previous_vitals.heart_rate if previous_vitals else None),
        'temp_trend': get_trend(current_vitals.temperature if current_vitals else None, previous_vitals.temperature if previous_vitals else None),
        'bp_trend': get_trend(current_vitals.systolic_bp if current_vitals else None, previous_vitals.systolic_bp if previous_vitals else None),
        'o2_trend': get_trend(current_vitals.oxygen_saturation if current_vitals else None, previous_vitals.oxygen_saturation if previous_vitals else None),
    }
    return render(request, 'vitals_chart.html', context)

def escalate_to_doctor(request, patient_id):
    if request.method == 'POST':
        patient = get_object_or_404(Patient, pk=patient_id)
        Alert.objects.create(
            patient=patient,
            type='critical',
            message=f"Escalation requested for {patient.name}",
        )
        messages.success(request, "Escalation request sent to doctor.")
    return redirect('patient_details', patient_id=patient_id)

def escalate_patient(request, patient_id):
    if request.method == 'POST':
        patient = get_object_or_404(Patient, pk=patient_id)
        Alert.objects.create(
            patient=patient,
            type='critical',
            message=f"Critical risk escalation for {patient.name}",
        )
        messages.success(request, "Patient escalated.")
    return redirect('patient_monitoring_grid')

def all_patients(request):
    patients = Patient.objects.all()
    context = {'patients': patients}
    return render(request, 'patient_monitoring_grid.html', context)

def manual_entry_mode(request):
    return redirect('manual_entry_panel')