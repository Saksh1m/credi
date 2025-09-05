export const state = {
  step: 'welcome',
  mobile: '',
  pan: '',
  kycConsent: false,
  aadhaar: '',
  bureauConsent: false,
  creditLimit: 0,
  available: 0,
  outstanding: 0,
  transactions: [],
  rewards: 0,
  tier: 'Silver',
  autoPay: false,
  tab: 'home',
  dueDate: null,
  dark: false,
  loading: false
};

export function updateTier() {
  if (state.rewards >= 5000) state.tier = 'Platinum';
  else if (state.rewards >= 1000) state.tier = 'Gold';
  else state.tier = 'Silver';
}

export function calculateMinDue() {
  return 0;
}