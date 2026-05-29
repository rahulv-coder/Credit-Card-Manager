export const formatCurrency = (amount: number, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: number | Date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateWithTime = (date: number | Date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatCardNumber = (cardNumber: string) => {
  const last4 = cardNumber.slice(-4);
  return `•••• •••• •••• ${last4}`;
};

export const maskCardNumber = (cardNumber: string) => {
  return cardNumber.replace(/\d(?=\d{4})/g, '*');
};

export const formatPercentage = (value: number, decimals = 2) => {
  return `${value.toFixed(decimals)}%`;
};

export const getCategoryIcon = (category: string) => {
  const icons: { [key: string]: string } = {
    'Food': '🍔',
    'Travel': '✈️',
    'Shopping': '🛍️',
    'Bills': '📄',
    'Entertainment': '🎬',
    'Health': '🏥',
    'Education': '📚',
    'Utilities': '💡',
    'Groceries': '🛒',
    'Other': '📌',
  };
  return icons[category] || '📌';
};

export const getMonthName = (monthIndex: number) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[monthIndex];
};

export const getPaymentStatus = (isPaid: boolean) => {
  return isPaid ? 'Paid' : 'Pending';
};
