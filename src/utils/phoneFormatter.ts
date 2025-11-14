export function formatPhoneNumber(value: string): string {
  const cleaned = value.replace(/\D/g, '');

  if (cleaned.length === 0) return '';

  if (cleaned.length <= 3) {
    return `(${cleaned}`;
  }

  if (cleaned.length <= 6) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  }

  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
}

export function validatePhoneNumber(value: string): boolean {
  const cleaned = value.replace(/\D/g, '');
  return cleaned.length === 0 || cleaned.length === 10;
}

export function cleanPhoneNumber(value: string): string {
  return value.replace(/\D/g, '');
}
