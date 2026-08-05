def check_period(preference, wave_period):
    if preference.period_min is None and preference.period_max is None:
        return None  # not set skip

    if preference.period_min is not None and wave_period < preference.period_min:
        return False
    if preference.period_max is not None and wave_period > preference.period_max:
        return False
    return True


def check_wind(preference, wind_speed, wind_direction):
    if (
        preference.wind_speed_max is None
        and preference.wind_direction_min is None
        and preference.wind_direction_max is None
    ):
        return None  # not set skip

    if preference.wind_speed_max is not None and wind_speed > preference.wind_speed_max:
        return False

    if preference.wind_direction_min is not None and preference.wind_direction_max is not None:
        lo, hi = preference.wind_direction_min, preference.wind_direction_max
        if lo <= hi:
            if not (lo <= wind_direction <= hi):
                return False
        else:
            # range wraps past 360/0 (e.g. 340 to 20 degrees)
            if not (wind_direction >= lo or wind_direction <= hi):
                return False

    return True


def check_tide(preference, tide_stage):
    if preference.tide_stage is None:
        return None  # not set skip

    if tide_stage is None:
        return False  # couldn't determine treat as no match

    return preference.tide_stage == tide_stage


def check_match(preference, conditions):
    results = {
        "period": check_period(preference, conditions["wave_period"]),
        "wind": check_wind(preference, conditions["wind_speed"], conditions["wind_direction"]),
        "tide": check_tide(preference, conditions["tide_stage"]),
    }

    evaluated = [v for v in results.values() if v is not None]
    overall_match = all(evaluated) if evaluated else False

    return {
        "match": overall_match,
        "factors": results,
    }