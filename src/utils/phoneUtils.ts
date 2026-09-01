/**
 * Sanitizes and formats phone numbers for SteadFast Courier API.
 * Ensures the phone number is an 11-digit Bangladeshi mobile number (e.g., 01XXXXXXXXX).
 */
export const formatSteadfastPhone = (rawPhone: string | null | undefined): string => {
  if (!rawPhone) return '';

  // 1. Remove all non-numeric characters (+, spaces, hyphens, etc.)
  let digits = String(rawPhone).replace(/\D/g, '');

  // 2. If it starts with 880 (e.g., 88017XXXXXXXX), remove the leading 88 -> 017XXXXXXXX
  if (digits.startsWith('880')) {
    digits = digits.slice(2);
  }

  // 3. If it has 10 digits starting with 1 (e.g., 17XXXXXXXX), prepend 0 -> 017XXXXXXXX
  if (digits.length === 10 && digits.startsWith('1')) {
    digits = '0' + digits;
  }

  // 4. Try matching standard BD mobile numbers (013-019 followed by 8 digits)
  const bdMobileMatch = digits.match(/(01[3-9]\d{8})/);
  if (bdMobileMatch) {
    return bdMobileMatch[1];
  }

  // 5. If it's longer than 11 digits, extract the last 11 digits
  if (digits.length > 11) {
    digits = digits.slice(-11);
  }

  return digits;
};
