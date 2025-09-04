from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('patients/<int:patient_id>/details/', views.patient_details, name='patient_details'),
    path('patients/all/', views.all_patients, name='all_patients'),
    path('patients/<int:patient_id>/escalate/', views.escalate_to_doctor, name='escalate_to_doctor'),
    path('patient-monitoring-grid/', views.patient_monitoring_grid, name='patient_monitoring_grid'),
    path('patient/<int:patient_id>/escalate/', views.escalate_patient, name='escalate_patient'),
    path('alert-config/', views.alert_config, name='alert_config'),
    path('update-alert-config/', views.update_alert_config, name='update_alert_config'),
    path('alerts-panel/', views.alerts_panel, name='alerts_panel'),
    path('acknowledge-alert/<int:alert_id>/', views.acknowledge_alert, name='acknowledge_alert'),
    path('automated-testing/', views.automated_testing_panel, name='automated_testing_panel'),
    path('update-testing-schedule/', views.update_testing_schedule, name='update_testing_schedule'),
    path('run-manual-test/', views.run_manual_test, name='run_manual_test'),
    path('manual-entry/', views.manual_entry_panel, name='manual_entry_panel'),
    path('manual-entry-mode/', views.manual_entry_mode, name='manual_entry_mode'),
    path('submit-manual-vitals/', views.submit_manual_vitals, name='submit_manual_vitals'),
    path('model-prediction/<int:patient_id>/', views.model_prediction_panel, name='model_prediction_panel'),
    path('retest-patient/<int:patient_id>/', views.retest_patient, name='retest_patient'),
    path('sensor-status/', views.sensor_status_panel, name='sensor_status_panel'),
    path('stats-overview/', views.stats_overview, name='stats_overview'),
    path('vitals-chart/<int:patient_id>/', views.vitals_chart, name='vitals_chart'),
    path('toggle-dark-mode/', views.toggle_dark_mode, name='toggle_dark_mode'),
]