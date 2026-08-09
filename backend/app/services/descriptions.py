def angle_diff(a, b):
    d = abs(a - b) % 360
    return min(d, 360 - d)


def describe_wind(wind_direction, facing_direction):
    if facing_direction is None:
        return "Unknown (set this spot's facing direction to see wind type)"

    offshore_center = (facing_direction + 180) % 360
    diff = angle_diff(wind_direction, offshore_center)

    if diff <= 45:
        return "Offshore (clean, holding wave faces up)"
    elif diff <= 135:
        return "Cross-shore (some texture, not ideal)"
    else:
        return "Onshore (choppy, blown out)"


def describe_wave_height(height_m):
    feet = height_m * 3.28084

    if feet < 1:
        label = "Flat to ankle high"
    elif feet < 2:
        label = "Small, knee high"
    elif feet < 3:
        label = "Small to moderate, thigh to waist high"
    elif feet < 4:
        label = "Moderate, waist to chest high"
    elif feet < 6:
        label = "Good size, chest to head high"
    elif feet < 8:
        label = "Large, head high to overhead"
    else:
        label = "Very large, well overhead"

    return {"feet": round(feet, 1), "label": label}