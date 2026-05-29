/** Card number formatting and validation */
export const formatCardNumber = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  // Add space after every 4 digits
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
};

export const validateCardNumber = (value: string): boolean => {
  const digits = value.replace(/\D/g, '');
  return digits.length === 16;
};

/** Expiry date validation and formatting */
export const formatExpiryDate = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
};

export const validateExpiryDate = (value: string): boolean => {
  const parts = value.split('/');
  if (parts.length !== 2) return false;
  
  const month = parseInt(parts[0], 10);
  const year = parseInt(parts[1], 10);
  
  // Month must be between 01 and 12
  if (month < 1 || month > 12) return false;
  
  // Year must be 2 digits and not in the past
  if (parts[1].length !== 2) return false;
  
  const currentYear = new Date().getFullYear() % 100;
  const currentMonth = new Date().getMonth() + 1;
  
  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  
  return true;
};

export const validateMonth = (month: string): boolean => {
  const m = parseInt(month, 10);
  return m >= 1 && m <= 12;
};

/** Amount validation */
export const validateAmount = (value: number | string): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num > 0;
};

/** Field validation helpers */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateCardholderName = (name: string): boolean => {
  return name.trim().length >= 2 && /^[a-zA-Z\s]*$/.test(name);
};

export const validateLoanAmount = (amount: number | string): boolean => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) && num > 0 && num <= 10000000; // Max 1 crore
};

export const validateInterestRate = (rate: number | string): boolean => {
  const num = typeof rate === 'string' ? parseFloat(rate) : rate;
  return !isNaN(num) && num >= 0 && num <= 50;
};

export const validateTenure = (months: number): boolean => {
  return months >= 1 && months <= 360;
};

export const formatTenureDisplay = (months: number): string => {
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''}`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `${years} year${years !== 1 ? 's' : ''}`;
  return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
};
