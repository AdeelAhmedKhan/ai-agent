import { ValidationError } from './errors.js';

/** Strip to digits; accept 10-digit or 11-digit leading-1 US numbers. */
export function normalizeUsPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.slice(1);
  }
  if (digits.length === 10) {
    return digits;
  }
  throw new ValidationError('Phone number must be a valid U.S. 10-digit number', {
    field: 'phone_number',
    value: input,
  });
}

export function tryNormalizeUsPhone(input: string): string | null {
  try {
    return normalizeUsPhone(input);
  } catch {
    return null;
  }
}

/**
 * Parse DOB from MM/DD/YYYY or YYYY-MM-DD into ISO date string (YYYY-MM-DD).
 * Rejects invalid calendars and future dates.
 */
export function normalizeDateOfBirth(input: string): string {
  const trimmed = input.trim();
  let year: number;
  let month: number;
  let day: number;

  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);

  if (us) {
    month = Number(us[1]);
    day = Number(us[2]);
    year = Number(us[3]);
  } else if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]);
    day = Number(iso[3]);
  } else {
    throw new ValidationError('date_of_birth must be MM/DD/YYYY or YYYY-MM-DD', {
      field: 'date_of_birth',
      value: input,
    });
  }

  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) {
    throw new ValidationError('date_of_birth is not a valid date', {
      field: 'date_of_birth',
      value: input,
    });
  }

  const dt = new Date(Date.UTC(year, month - 1, day));
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() !== month - 1 ||
    dt.getUTCDate() !== day
  ) {
    throw new ValidationError('date_of_birth is not a valid calendar date', {
      field: 'date_of_birth',
      value: input,
    });
  }

  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  if (dt.getTime() > todayUtc) {
    throw new ValidationError('date_of_birth cannot be in the future', {
      field: 'date_of_birth',
      value: input,
    });
  }

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function formatDobUs(isoDate: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!m) return isoDate;
  return `${m[2]}/${m[3]}/${m[1]}`;
}
