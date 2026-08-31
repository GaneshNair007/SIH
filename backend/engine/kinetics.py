import math

# Kinetic constants for passive colorimetric lead acetate / silver-based H2S dosimeter substrates
ACTIVATION_ENERGY_J_MOL = 25000.0  # Ea = 25 kJ/mol
GAS_CONSTANT_R = 8.314             # J / (mol · K)
T_REF_KELVIN = 298.15              # 25°C in Kelvin
RH_REF_PCT = 50.0                  # 50% Reference Relative Humidity
MOISTURE_COEFFICIENT = 0.0035      # 0.35% per % RH variation

def compute_kinetic_factor(temperature_c: float, relative_humidity_pct: float) -> float:
    """
    Computes Arrhenius temperature and moisture scaling factor k(T, RH).
    k > 1.0 means accelerated color development (hot/humid); raw optical reading is higher than true dose.
    k < 1.0 means slowed color development (cold/dry); raw optical reading is lower than true dose.
    
    True / Compensated Dose = Raw Optical Dose / k(T, RH)
    """
    # Safe temperature conversion
    t_c = max(-20.0, min(60.0, temperature_c))
    t_kelvin = t_c + 273.15
    
    # Safe RH clamping
    rh = max(0.0, min(100.0, relative_humidity_pct))
    
    # Arrhenius temperature factor: exp(-Ea/R * (1/T - 1/T_ref))
    arrhenius_factor = math.exp(- (ACTIVATION_ENERGY_J_MOL / GAS_CONSTANT_R) * ((1.0 / t_kelvin) - (1.0 / T_REF_KELVIN)))
    
    # Moisture scaling factor: 1 + alpha * (RH - RH_ref)
    moisture_factor = 1.0 + (MOISTURE_COEFFICIENT * (rh - RH_REF_PCT))
    
    k = arrhenius_factor * moisture_factor
    
    # Clamp to physically sensible calibration envelope [0.4, 3.0]
    return max(0.4, min(3.0, round(k, 4)))

def compensate_dose(raw_optical_dose_ppm_hr: float, k_factor: float) -> float:
    """
    Compensates raw dosimeter reading: compensated_dose = raw_optical_dose / k_factor
    """
    if k_factor <= 0.0:
        k_factor = 1.0
    compensated = raw_optical_dose_ppm_hr / k_factor
    return max(0.0, round(compensated, 4))
