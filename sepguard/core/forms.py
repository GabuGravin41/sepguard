from django import forms
from .models import Vitals, Patient, TestingSchedule

class VitalsForm(forms.ModelForm):
    patient_id = forms.CharField(max_length=20, widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Enter patient ID'}))
    
    class Meta:
        model = Vitals
        fields = ['patient_id', 'heart_rate', 'temperature', 'systolic_bp', 
                  'diastolic_bp', 'oxygen_saturation', 'respiratory_rate']
        widgets = {
            'heart_rate': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.1', 'min': '30', 'max': '200', 'placeholder': 'BPM'}),
            'temperature': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.1', 'min': '30', 'max': '45', 'placeholder': '°C'}),
            'systolic_bp': forms.NumberInput(attrs={'class': 'form-control', 'min': '50', 'max': '300', 'placeholder': 'mmHg'}),
            'diastolic_bp': forms.NumberInput(attrs={'class': 'form-control', 'min': '30', 'max': '200', 'placeholder': 'mmHg'}),
            'oxygen_saturation': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.1', 'min': '70', 'max': '100', 'placeholder': '%'}),
            'respiratory_rate': forms.NumberInput(attrs={'class': 'form-control', 'min': '5', 'max': '60', 'placeholder': 'breaths/min'}),
        }

    def clean(self):
        cleaned_data = super().clean()
        patient_id = cleaned_data.get('patient_id')
        heart_rate = cleaned_data.get('heart_rate')
        temperature = cleaned_data.get('temperature')
        systolic_bp = cleaned_data.get('systolic_bp')
        diastolic_bp = cleaned_data.get('diastolic_bp')
        oxygen_saturation = cleaned_data.get('oxygen_saturation')
        respiratory_rate = cleaned_data.get('respiratory_rate')

        # Ensure at least one vital is provided
        if not any([heart_rate, temperature, systolic_bp, diastolic_bp, oxygen_saturation, respiratory_rate]):
            raise forms.ValidationError("At least one vital sign must be provided.")

        # Validate patient_id
        try:
            patient = Patient.objects.get(patient_id=patient_id)
            cleaned_data['patient'] = patient
        except Patient.DoesNotExist:
            raise forms.ValidationError("Invalid patient ID.")
        
        # Ensure systolic_bp >= diastolic_bp
        if systolic_bp and diastolic_bp and systolic_bp <= diastolic_bp:
            raise forms.ValidationError("Systolic BP must be greater than diastolic BP.")

        return cleaned_data

class AlertConfigForm(forms.ModelForm):
    class Meta:
        model = TestingSchedule
        fields = ['critical_threshold', 'warning_threshold', 'audio_alerts', 'email_notifications', 'sms_alerts']
        widgets = {
            'critical_threshold': forms.NumberInput(attrs={'class': 'form-control', 'min': '0', 'max': '100'}),
            'warning_threshold': forms.NumberInput(attrs={'class': 'form-control', 'min': '0', 'max': '100'}),
            'audio_alerts': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'email_notifications': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'sms_alerts': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }

    def clean(self):
        cleaned_data = super().clean()
        critical_threshold = cleaned_data.get('critical_threshold')
        warning_threshold = cleaned_data.get('warning_threshold')
        if critical_threshold and warning_threshold and critical_threshold <= warning_threshold:
            raise forms.ValidationError("Critical threshold must be greater than warning threshold.")
        return cleaned_data