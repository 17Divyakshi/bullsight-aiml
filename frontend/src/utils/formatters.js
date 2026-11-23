// Currency and metric formatting helpers for BULLSIGHT

export function isIndianAsset(symbol = '') {
  const sym = String(symbol).toUpperCase().trim();
  return sym === '^NSEI' || sym.endsWith('.NS') || sym.endsWith('.BO');
}

export function isIndexSymbol(symbol = '') {
  return String(symbol).toUpperCase().trim() === '^NSEI';
}

export function getCurrencyPrefix(symbol = '') {
  const sym = String(symbol).toUpperCase().trim();
  if (sym === '^NSEI') return '';
  if (sym.endsWith('.NS') || sym.endsWith('.BO')) return '₹';
  return '$';
}

export function formatAssetPrice(value, symbol = '', { includeUnit = true } = {}) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'Unavailable';
  }
  const num = Number(value);
  const sym = String(symbol).toUpperCase().trim();
  const locale = isIndianAsset(sym) ? 'en-IN' : 'en-US';
  const formatted = num.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (sym === '^NSEI') {
    return includeUnit ? `${formatted} pts` : formatted;
  }
  return `${getCurrencyPrefix(sym)}${formatted}`;
}

export function formatShortTick(value, symbol = '') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '';
  }
  const num = Number(value);
  const sym = String(symbol).toUpperCase().trim();
  const locale = isIndianAsset(sym) ? 'en-IN' : 'en-US';
  const formatted = num.toLocaleString(locale, { maximumFractionDigits: 0 });
  if (sym === '^NSEI') return formatted;
  return `${getCurrencyPrefix(sym)}${formatted}`;
}

export function formatSignedPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'N/A';
  }
  const num = Number(value);
  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
}

export function formatTimestamp(isoOrStr) {
  if (!isoOrStr) return 'Unavailable';
  const dt = new Date(isoOrStr);
  if (Number.isNaN(dt.getTime())) return String(isoOrStr);
  return dt.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
