import { state, updateTier, calculateMinDue } from './state.js';

let currentPayment = null;
let currentEmiIndex = null;
let escapeHandler = null;

function applyTheme() {
  document.documentElement.classList.toggle('dark', state.dark);
}

function showToast(msg, type = 'neutral') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const colors = {
    success: 'bg-emerald-500 text-white',
    error: 'bg-rose-500 text-white',
    neutral: 'bg-gray-800 text-white'
  };
  const toast = document.createElement('div');
  toast.className = `px-4 py-2 rounded shadow ${colors[type] || colors.neutral}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('opacity-0');
    toast.addEventListener('transitionend', () => toast.remove());
  }, 2000);
}

function render() {
  const app = document.getElementById('app');
  if (state.step !== 'app') {
    renderOnboarding(app);
  } else {
    renderMain(app);
  }
  applyTheme();
}

function renderOnboarding(app) {
  switch (state.step) {
    case 'welcome':
      app.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full p-4">
          <h1 class="text-3xl font-bold mb-4">Welcome to CrediUPI</h1>
          <button id="startBtn" class="px-4 py-2 bg-blue-600 text-white rounded">Get Started</button>
        </div>`;
      document.getElementById('startBtn').onclick = () => { state.step = 'login'; render(); };
      break;
    case 'login':
      app.innerHTML = `
        <div class="p-4 space-y-2">
          <h2 class="text-xl font-bold">Login</h2>
          <input id="mobile" class="w-full p-2 border rounded" placeholder="Mobile Number" />
          <button id="sendOtp" class="px-4 py-2 bg-blue-600 text-white rounded">Send OTP</button>
        </div>`;
      document.getElementById('sendOtp').onclick = () => {
        const m = document.getElementById('mobile').value.trim();
        if (m.length === 10) { state.mobile = m; state.step = 'otp'; render(); }
        else alert('Enter valid mobile');
      };
      break;
    case 'otp':
      app.innerHTML = `
        <div class="p-4 space-y-2">
          <h2 class="text-xl font-bold">Enter OTP</h2>
          <input id="otp" class="w-full p-2 border rounded" placeholder="123456" />
          <button id="verifyOtp" class="px-4 py-2 bg-blue-600 text-white rounded">Verify</button>
        </div>`;
      document.getElementById('verifyOtp').onclick = () => {
        const otp = document.getElementById('otp').value.trim();
        if (otp === '123456') { state.step = 'pan'; render(); }
        else alert('Incorrect OTP');
      };
      break;
    case 'pan':
      app.innerHTML = `
        <div class="p-4 space-y-2">
          <h2 class="text-xl font-bold">KYC</h2>
          <input id="pan" class="w-full p-2 border rounded" placeholder="PAN" />
          <label class="flex items-center"><input id="consent" type="checkbox" class="mr-2">I authorize KYC</label>
          <button id="submitPan" class="px-4 py-2 bg-blue-600 text-white rounded">Continue</button>
        </div>`;
      document.getElementById('submitPan').onclick = () => {
        const pan = document.getElementById('pan').value.trim();
        const consent = document.getElementById('consent').checked;
        if (pan && consent) { state.pan = pan; state.step = 'docs'; render(); }
        else alert('Enter PAN and consent');
      };
      break;
    case 'docs':
      app.innerHTML = `
        <div class="p-4 space-y-2">
          <h2 class="text-xl font-bold">Document Verification</h2>
          <input id="aadhaar" class="w-full p-2 border rounded" placeholder="Aadhaar last 4 digits" />
          <input id="selfie" type="file" class="w-full p-2 border rounded" />
          <button id="submitDocs" class="px-4 py-2 bg-blue-600 text-white rounded">Continue</button>
        </div>`;
      document.getElementById('submitDocs').onclick = () => {
        const a = document.getElementById('aadhaar').value.trim();
        if (a.length === 4) { state.aadhaar = a; state.step = 'bureau'; render(); }
        else alert('Enter Aadhaar last 4 digits');
      };
      break;
    case 'bureau':
      app.innerHTML = `
        <div class="p-4 space-y-4">
          <h2 class="text-xl font-bold">Bureau Check</h2>
          <label class="flex items-center"><input id="bureau" type="checkbox" class="mr-2">I consent to bureau check</label>
          <button id="submitBureau" class="px-4 py-2 bg-blue-600 text-white rounded">Submit</button>
        </div>`;
      document.getElementById('submitBureau').onclick = () => {
        if (document.getElementById('bureau').checked) {
          state.bureauConsent = true;
          const limit = Math.floor(Math.random() * 48001) + 2000;
          state.creditLimit = limit;
          state.available = limit;
          state.outstanding = 0;
          state.dueDate = new Date(Date.now() + 30*24*60*60*1000);
          state.step = 'result';
          render();
        } else alert('Consent required');
      };
      break;
    case 'result':
      app.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full p-4 text-center">
          <h2 class="text-2xl font-bold mb-4">Credit Approved!</h2>
          <p class="mb-2">Credit Limit: ₹${state.creditLimit}</p>
          <p class="mb-4">Available Credit: ₹${state.available}</p>
          <button id="goApp" class="px-4 py-2 bg-blue-600 text-white rounded">Go to App</button>
        </div>`;
      document.getElementById('goApp').onclick = () => {
        state.step = 'app';
        state.loading = true;
        render();
        setTimeout(() => { state.loading = false; render(); }, 700);
      };
      break;
  }
}

function renderMain(app) {
  const active = 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200';
  app.innerHTML = `
    <div class="flex flex-col h-full">
      <header class="sticky top-0 z-10 flex items-center justify-between p-4 backdrop-blur bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center space-x-2">
          <span class="text-indigo-600 font-bold">CU</span>
          <span class="font-semibold">CrediUPI</span>
        </div>
        <div class="flex items-center space-x-2">
          <button id="themeToggle" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition" aria-label="Toggle theme"><i data-lucide="${state.dark ? 'sun' : 'moon'}"></i></button>
          <button id="logoutBtn" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition" aria-label="Logout"><i data-lucide="log-out"></i></button>
        </div>
      </header>
      <main id="tabContent" class="flex-1 overflow-y-auto p-4 pb-20 md:pb-4 md:pt-4"></main>
      <nav class="fixed bottom-0 md:top-0 md:bottom-auto inset-x-0 flex justify-around backdrop-blur bg-white/70 dark:bg-gray-900/70 border-t md:border-b border-gray-200 dark:border-gray-700 p-2 z-10">
        <button data-tab="home" class="tabBtn flex-1 flex flex-col items-center py-1 rounded-2xl ${state.tab==='home'?active:''}">
          <i data-lucide="home" class="mb-0.5"></i><span class="text-xs">Home</span>
        </button>
        <button data-tab="pay" class="tabBtn flex-1 flex flex-col items-center py-1 rounded-2xl ${state.tab==='pay'?active:''}">
          <i data-lucide="send" class="mb-0.5"></i><span class="text-xs">Pay</span>
        </button>
        <button data-tab="repay" class="tabBtn flex-1 flex flex-col items-center py-1 rounded-2xl ${state.tab==='repay'?active:''}">
          <i data-lucide="wallet" class="mb-0.5"></i><span class="text-xs">Repay</span>
        </button>
        <button data-tab="rewards" class="tabBtn flex-1 flex flex-col items-center py-1 rounded-2xl ${state.tab==='rewards'?active:''}">
          <i data-lucide="gift" class="mb-0.5"></i><span class="text-xs">Rewards</span>
        </button>
        <button data-tab="profile" class="tabBtn flex-1 flex flex-col items-center py-1 rounded-2xl ${state.tab==='profile'?active:''}">
          <i data-lucide="user" class="mb-0.5"></i><span class="text-xs">Profile</span>
        </button>
      </nav>
    </div>`;
  document.getElementById('themeToggle').onclick = () => { state.dark = !state.dark; applyTheme(); render(); };
  document.getElementById('logoutBtn').onclick = () => {
    Object.assign(state, { step: 'welcome', tab: 'home', transactions: [], rewards: 0, available: 0, outstanding: 0, creditLimit: 0, tier: 'Silver' });
    render();
  };
  document.querySelectorAll('.tabBtn').forEach(btn => {
    btn.onclick = () => { state.tab = btn.dataset.tab; render(); };
  });
  renderTab();
  if (window.lucide) lucide.createIcons();
}

function renderTab() {
  const content = document.getElementById('tabContent');
  if (!content) return;
  switch (state.tab) {
    case 'home':
      content.innerHTML = renderHome();
      document.querySelectorAll('[data-emi]').forEach(btn => {
        btn.onclick = () => { currentEmiIndex = parseInt(btn.dataset.emi); showEmiModal(); };
      });
      break;
    case 'pay':
      content.innerHTML = renderPay();
      setupPayForm();
      break;
    case 'repay':
      content.innerHTML = renderRepay();
      document.querySelectorAll('.repayBtn').forEach(btn => {
        btn.onclick = () => processRepay(parseFloat(btn.dataset.repay));
      });
      const customInput = document.getElementById('customRepay');
      const customBtn = document.getElementById('customRepayBtn');
      const error = document.getElementById('repayError');
      customInput.addEventListener('input', () => {
        const amt = parseFloat(customInput.value);
        if (isNaN(amt) || amt <= 0 || amt > state.outstanding) {
          error.classList.remove('hidden');
          customBtn.disabled = true;
        } else {
          error.classList.add('hidden');
          customBtn.disabled = false;
        }
      });
      customBtn.onclick = () => {
        const amt = parseFloat(customInput.value);
        if (!isNaN(amt)) processRepay(amt);
      };
      document.getElementById('autoPayToggle').onchange = (e) => { state.autoPay = e.target.checked; };
      break;
    case 'rewards':
      content.innerHTML = renderRewards();
      document.getElementById('redeemBtn').onclick = () => {
        if (state.rewards >= 500) {
          state.rewards -= 500;
          updateTier();
          showToast('Redeemed ₹50 voucher!', 'success');
          render();
        }
      };
      break;
    case 'profile':
      content.innerHTML = renderProfile();
      break;
  }
}

function renderHome() {
  if (state.loading) {
    return `
      <div class="animate-pulse space-y-4">
        <div class="h-20 bg-gray-300 dark:bg-gray-700 rounded-2xl"></div>
        <div class="space-y-2">
          <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      </div>`;
  }
  const minDue = calculateMinDue();
  const txHtml = state.transactions.map((t,i) => `
    <div class="p-3 mb-2 rounded-2xl border border-gray-200 dark:border-gray-700">
      <div class="flex justify-between">
        <span>${t.type === 'repay' ? 'Repayment' : 'Paid to ' + t.upi}</span>
        <span>₹${t.amount + (t.fee||0)}</span>
      </div>
      <div class="text-xs">${t.date}${t.fee?` | Fee ₹${t.fee}`:''}${t.emi?` | EMI ${t.emi}m`:''}</div>
      ${t.type === 'spend' && !t.emi ? `<button data-emi="${i}" class="text-indigo-600 text-xs mt-1 underline">Convert to EMI</button>`:''}
    </div>`).join('');
  return `
    <div class="space-y-4">
      <div class="grid grid-cols-1 gap-4">
        <div class="p-4 rounded-2xl shadow bg-white/70 dark:bg-gray-800/70 backdrop-blur">
          <p class="text-sm">Available Credit</p>
          <p class="text-2xl font-bold">₹${state.available}</p>
        </div>
        <div class="p-4 rounded-2xl shadow bg-white/70 dark:bg-gray-800/70 backdrop-blur flex justify-between">
          <div>
            <p class="text-sm">Outstanding</p>
            <p class="text-xl font-bold">₹${state.outstanding}</p>
          </div>
          <div>
            <p class="text-sm">Min Due</p>
            <p class="text-xl font-bold">₹${minDue}</p>
            <p class="text-xs">Due ${state.dueDate ? state.dueDate.toLocaleDateString() : ''}</p>
          </div>
        </div>
      </div>
      <div>
        <h3 class="font-bold mb-2">Recent Transactions</h3>
        <div>${txHtml || '<p>No transactions</p>'}</div>
      </div>
    </div>`;
}

function renderPay() {
  return `
    <form id="payForm" class="space-y-4">
      <div>
        <label for="upiId" class="block text-sm font-medium">UPI ID</label>
        <input id="upiId" class="mt-1 w-full p-2 border rounded" placeholder="name@bank" />
        <p id="upiError" class="mt-1 text-sm text-rose-600 hidden">Enter valid UPI ID</p>
      </div>
      <div>
        <label for="amount" class="block text-sm font-medium">Amount</label>
        <input id="amount" type="number" class="mt-1 w-full p-2 border rounded" placeholder="Amount" />
      </div>
      <button id="payBtn" class="w-full py-2 bg-indigo-600 text-white rounded disabled:opacity-50" disabled>Pay</button>
    </form>`;
}

function setupPayForm() {
  const upiInput = document.getElementById('upiId');
  const amtInput = document.getElementById('amount');
  const btn = document.getElementById('payBtn');
  const error = document.getElementById('upiError');
  const vpaRegex = /^[\w.-]+@[\w.-]+$/;
  function validate() {
    const validVpa = vpaRegex.test(upiInput.value.trim());
    const validAmt = parseFloat(amtInput.value) > 0;
    if (!validVpa && upiInput.value) {
      error.classList.remove('hidden');
      upiInput.classList.add('border-rose-500');
    } else {
      error.classList.add('hidden');
      upiInput.classList.remove('border-rose-500');
    }
    btn.disabled = !(validVpa && validAmt);
  }
  upiInput.addEventListener('input', validate);
  amtInput.addEventListener('input', validate);
  document.getElementById('payForm').addEventListener('submit', (e) => {
    e.preventDefault();
    startPayment();
  });
}

function renderRepay() {
  const minDue = calculateMinDue();
  return `
    <div class="space-y-4">
      <p>Outstanding: ₹${state.outstanding}</p>
      <div class="flex space-x-2">
        <button data-repay="${state.outstanding}" class="repayBtn flex-1 py-2 bg-indigo-600 text-white rounded">Pay Full</button>
        <button data-repay="${minDue}" class="repayBtn flex-1 py-2 bg-indigo-600 text-white rounded">Pay Min</button>
      </div>
      <div>
        <input id="customRepay" type="number" class="w-full p-2 border rounded mb-2" placeholder="Custom amount" />
        <button id="customRepayBtn" class="w-full py-2 bg-indigo-600 text-white rounded disabled:opacity-50" disabled>Pay</button>
        <p id="repayError" class="text-sm text-rose-600 hidden">Amount exceeds outstanding</p>
      </div>
      <label class="flex items-center justify-between">
        <span>AutoPay</span>
        <input id="autoPayToggle" type="checkbox" class="w-10 h-5 rounded-full border appearance-none cursor-pointer bg-gray-300 checked:bg-indigo-600 relative transition" ${state.autoPay?'checked':''}>
      </label>
    </div>`;
}

function renderRewards() {
  const next = state.tier === 'Silver' ? 1000 : state.tier === 'Gold' ? 5000 : null;
  const progress = next ? Math.min(100, Math.floor((state.rewards / next) * 100)) : 100;
  return `
    <div class="space-y-4">
      <div>
        <p class="text-3xl font-bold">${state.rewards} pts</p>
        <p class="text-sm mb-2">Tier: ${state.tier}</p>
        <div class="w-full h-2 bg-gray-200 rounded"><div class="h-2 bg-indigo-600 rounded" style="width:${progress}%"></div></div>
        ${next ? `<p class="text-xs mt-1">${next - state.rewards} pts to next tier</p>` : ''}
      </div>
      <button id="redeemBtn" class="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50" ${state.rewards < 500 ? 'disabled' : ''}>Redeem 500 pts for ₹50 voucher</button>
    </div>`;
}

function renderProfile() {
  return `
    <div class="space-y-2">
      <p>Mobile: ${state.mobile}</p>
      <p>PAN: ${state.pan}</p>
      <p>KYC: ${state.bureauConsent ? 'Verified' : 'Pending'}</p>
      <p>Tier: ${state.tier}</p>
    </div>`;
}

function startPayment() {
  const upi = document.getElementById('upiId').value.trim();
  const amt = parseFloat(document.getElementById('amount').value);
  if (!upi || isNaN(amt)) { showToast('Enter valid details', 'error'); return; }
  const fee = Math.floor(Math.random() * 16) + 5;
  const multiplier = state.tier === 'Gold' ? 2 : state.tier === 'Platinum' ? 3 : 1;
  const rewards = Math.floor(amt / 100) * multiplier;
  currentPayment = { upi, amt, fee, rewards };
  document.getElementById('paymentDetails').innerHTML = `
    <p>Send to: ${upi}</p>
    <p>Amount: ₹${amt}</p>
    <p>Fee: ₹${fee}</p>
    <p>Rewards: ${rewards} pts</p>
    <p>Available After: ₹${state.available - amt - fee}</p>`;
  showPaymentModal();
}

function processRepay(amt) {
  if (amt <= 0) return;
  if (amt > state.outstanding) amt = state.outstanding;
  state.outstanding -= amt;
  state.available += amt;
  state.transactions.unshift({ type: 'repay', amount: amt, date: new Date().toLocaleString() });
  showToast('Repayment successful', 'success');
  render();
}

function showPaymentModal() {
  const modal = document.getElementById('paymentModal');
  modal.classList.remove('hidden');
  escapeHandler = (e) => { if (e.key === 'Escape') hidePaymentModal(); };
  document.addEventListener('keydown', escapeHandler);
}
function hidePaymentModal() {
  document.getElementById('paymentModal').classList.add('hidden');
  document.removeEventListener('keydown', escapeHandler);
  escapeHandler = null;
}
function showEmiModal() {
  const modal = document.getElementById('emiModal');
  modal.classList.remove('hidden');
  escapeHandler = (e) => { if (e.key === 'Escape') hideEmiModal(); };
  document.addEventListener('keydown', escapeHandler);
}
function hideEmiModal() {
  document.getElementById('emiModal').classList.add('hidden');
  document.removeEventListener('keydown', escapeHandler);
  escapeHandler = null;
}

// Modal event listeners
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('cancelPayment').onclick = hidePaymentModal;
  document.getElementById('confirmPayment').onclick = () => {
    if (!currentPayment) return;
    const total = currentPayment.amt + currentPayment.fee;
    if (total > state.available) { showToast('Insufficient credit', 'error'); hidePaymentModal(); return; }
    state.available -= total;
    state.outstanding += total;
      state.rewards += currentPayment.rewards;
      updateTier();
      state.transactions.unshift({ upi: currentPayment.upi, amount: currentPayment.amt, fee: currentPayment.fee, date: new Date().toLocaleString(), type: 'spend', emi: null });
      hidePaymentModal();
      showToast('Payment successful', 'success');
      render();
  };
  document.getElementById('cancelEmi').onclick = hideEmiModal;
  document.getElementById('confirmEmi').onclick = () => {
    if (currentEmiIndex !== null) {
      const months = document.getElementById('emiMonths').value;
      state.transactions[currentEmiIndex].emi = months;
    }
    hideEmiModal();
    render();
  };
  render();
});
