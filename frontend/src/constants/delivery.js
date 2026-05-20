export const JAIPUR_ZONES = [
  'Mansarovar',
  'Sanganer',
  'Malviya Nagar',
  'Vaishali Nagar',
  'Jagatpura',
  'Pratap Nagar',
  'Haldi Ghati',
  'Raja Park',
];

export const formatAddress = (addr) => {
  if (!addr) return '—';
  if (typeof addr === 'string') return addr;
  const parts = [
    addr.street,
    addr.landmark,
    addr.zone,
    addr.city,
    addr.pincode,
  ].filter(Boolean);
  return parts.join(', ') || '—';
};

export const mapsLink = (addr) => {
  const q = encodeURIComponent(formatAddress(addr));
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
};
