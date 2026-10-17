let selectedCurrency = 'USD';
let isVesToForeign = false;
let rateMode = 'today';
let customRate = parseFloat(localStorage.getItem('daycambio_custom_rate')) || 900.00;

let rates = { 
  USD: 880.12, 
  EUR: 985.73, 
  USDT: 1002.65, 
  BRL: 158.42,   
  COP: 0.21,     
  ARS: 0.73,     
  MYRATE: customRate, 
  VES: 1.0 
};

let ratesTomorrow = { USD: 885.00, EUR: 990.00 };

// Cargar temas y tasas al iniciar la app
window.addEventListener('DOMContentLoaded', () => {
  loadSavedTheme();
  fetchRates();
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});

function setTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-dot').forEach(dot => dot.classList.remove('active'));
  const activeDot = document.getElementById(`dot-${theme}`);
  if(activeDot) activeDot.classList.add('active');
  localStorage.setItem('daycambio_theme', theme);
}

function toggleLightMode() {
  document.body.classList.toggle('light-mode');
  const isLight = document.body.classList.contains('light-mode');
  localStorage.setItem('daycambio_lightmode', isLight ? 'true' : 'false');
}

function loadSavedTheme() {
  const savedTheme = localStorage.getItem('daycambio_theme') || 'purple';
  setTheme(savedTheme);

  const isLight = localStorage.getItem('daycambio_lightmode') === 'true';
  if (isLight) {
    document.body.classList.add('light-mode');
  } else {
    document.body.classList.remove('light-mode');
  }
}

async function fetchRates() {
  try {
    const res = await fetch('https://ve.dolarapi.com/v1/dolares');
    if (res.ok) {
      const data = await res.json();
      const bcv = data.find(d => d.fuente === 'oficial' || d.key === 'oficial');
      const paralelo = data.find(d => d.fuente === 'paralelo' || d.key === 'enparalelovzla' || d.titulo?.toLowerCase().includes('paralelo'));
      
      if (bcv && bcv.promedio) {
        const oldRate = rates.USD;
        rates.USD = parseFloat(bcv.promedio);
        rates.EUR = parseFloat((rates.USD * 1.12).toFixed(2));
        rates.BRL = parseFloat((rates.USD * 0.18).toFixed(2));
        rates.COP = parseFloat((rates.USD / 4150).toFixed(4));
        rates.ARS = parseFloat((rates.USD / 1200).toFixed(4));

        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Domingo, 6 = Sábado, 5 = Viernes
        if (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) {
          ratesTomorrow.USD = rates.USD;
          ratesTomorrow.EUR = rates.EUR;
        } else {
          ratesTomorrow.USD = parseFloat((rates.USD * 1.005).toFixed(2));
          ratesTomorrow.EUR = parseFloat((rates.EUR * 1.005).toFixed(2));
        }

        checkAndNotifyRateChange(oldRate, rates.USD);
      }
      if (paralelo && paralelo.promedio) {
        rates.USDT = parseFloat(paralelo.promedio);
      }
    }
  } catch (e) {
    console.log('Usando tasas de respaldo locales');
  }

  actualizarVistaTasas();
}

function actualizarVistaTasas() {
  const activeBcv = rateMode === 'tomorrow' ? ratesTomorrow.USD : rates.USD;
  const activeEur = rateMode === 'tomorrow' ? ratesTomorrow.EUR : rates.EUR;

  const topBcv = document.getElementById('rate-bcv-top');
  const topEur = document.getElementById('rate-eur-top');
  const topUsdt = document.getElementById('rate-usdt-top');

  if (topBcv) topBcv.innerText = activeBcv.toFixed(2) + ' Bs';
  if (topEur) topEur.innerText = activeEur.toFixed(2) + ' Bs';
  if (topUsdt) topUsdt.innerText = rates.USDT.toFixed(2) + ' Bs';

  const today = new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' });
  const dateText = document.getElementById('date-text');
  if (dateText) {
    dateText.innerText = `Actualizado · ${today} (${rateMode === 'tomorrow' ? 'Tasa Mañana' : 'Tasa Hoy'})`;
  }
  calculate();
}

function requestNotificationPermission() {
  if (!("Notification" in window)) {
    alert("Tu dispositivo o navegador no soporta notificaciones.");
    return;
  }
  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      alert("Notificaciones activadas. Recibirás alertas al actualizarse la tasa BCV.");
    } else {
      alert("Permiso de notificaciones denegado.");
    }
  });
}

function checkAndNotifyRateChange(oldRate, newRate) {
  if (oldRate && oldRate !== newRate && Notification.permission === "granted") {
    new Notification("DayCambio: Cambio de Tasa BCV", {
      body: `La tasa oficial del BCV se ha actualizado a: Bs. ${newRate.toFixed(2)}`,
      icon: "icon-192.png"
    });
  }
}

function selectCurrency(curr) {
  selectedCurrency = curr;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`tab-${curr}`);
  if(activeBtn) activeBtn.classList.add('active');

  updateInputSymbol();
  calculate();
}

function updateInputSymbol() {
  const symElem = document.getElementById('input-symbol');
  if (isVesToForeign) {
    symElem.innerText = 'Bs.';
    return;
  }
  switch (selectedCurrency) {
    case 'EUR': symElem.innerText = '€'; break;
    case 'BRL': symElem.innerText = 'R$'; break;
    case 'COP': symElem.innerText = 'COL$'; break;
    case 'ARS': symElem.innerText = 'ARS$'; break;
    case 'MYRATE': symElem.innerText = '⭐'; break;
    default: symElem.innerText = '$'; break;
  }
}

function toggleDirection() {
  isVesToForeign = !isVesToForeign;
  updateInputSymbol();
  calculate();
}

function setRateMode(mode) {
  rateMode = mode;
  const statusText = document.getElementById('tomorrow-status');
  if (statusText) {
    if (mode === 'tomorrow') {
      statusText.innerText = 'Modo activo: Tasa Mañana / Próxima';
    } else {
      statusText.innerText = 'Modo activo: Tasa de Hoy';
    }
  }
  actualizarVistaTasas();
  closeTomorrowModal();
}

function calculate() {
  const rawInput = document.getElementById('amount').value.replace(',', '.');
  const amount = parseFloat(rawInput) || 0;
  
  let currentRate = rates[selectedCurrency] || rates.USD;
  if (rateMode === 'tomorrow') {
    if (selectedCurrency === 'USD') currentRate = ratesTomorrow.USD;
    if (selectedCurrency === 'EUR') currentRate = ratesTomorrow.EUR;
  }

  let resultInBs = 0;
  if (isVesToForeign) {
    resultInBs = currentRate > 0 ? amount / currentRate : 0;
  } else {
    resultInBs = amount * currentRate;
  }

  const transfComm = resultInBs * 0.01;
  const pmovComm = Math.max(resultInBs * 0.005, 14.00);
  
  const igtfChecked = document.getElementById('igtf-checkbox').checked;
  let igtfAmount = 0;
  let finalTotal = resultInBs;

  if (igtfChecked && !isVesToForeign && (selectedCurrency === 'USD' || selectedCurrency === 'EUR' || selectedCurrency === 'USDT')) {
    igtfAmount = resultInBs * 0.03;
    finalTotal += igtfAmount;
  }

  document.getElementById('comm-transf-val').innerText = `Bs. ${transfComm.toFixed(2)}`;
  document.getElementById('comm-pmov-val').innerText = `Bs. ${pmovComm.toFixed(2)}`;
  document.getElementById('comm-igtf-val').innerText = `Bs. ${igtfAmount.toFixed(2)}`;

  const resSymbol = document.getElementById('result-symbol');
  const resVal = document.getElementById('result-val');

  if (isVesToForeign) {
    resSymbol.innerText = selectedCurrency === 'EUR' ? '€' : (selectedCurrency === 'USD' ? '$' : selectedCurrency);
    resVal.innerText = resultInBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else {
    resSymbol.innerText = 'Bs.';
    resVal.innerText = finalTotal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function clearInput() {
  document.getElementById('amount').value = '';
  calculate();
}

function copyResult() {
  const val = document.getElementById('result-val').innerText;
  const sym = document.getElementById('result-symbol').innerText;
  navigator.clipboard.writeText(`${sym} ${val}`).then(() => {
    alert("¡Resultado copiado al portapapeles!");
  });
}

function openChangeModal() { document.getElementById('change-modal').style.display = 'flex'; }
function closeChangeModal() { document.getElementById('change-modal').style.display = 'none'; }
function calculateChange() {
  const cost = parseFloat(document.getElementById('change-cost').value) || 0;
  const pay = parseFloat(document.getElementById('change-pay').value) || 0;
  const diff = pay - cost;
  const resDiv = document.getElementById('change-result');
  if (diff >= 0) {
    const bcv = rateMode === 'tomorrow' ? ratesTomorrow.USD : rates.USD;
    const diffBs = diff * bcv;
    resDiv.innerText = `Vuelto: $${diff.toFixed(2)} (Bs. ${diffBs.toFixed(2)})`;
  } else {
    resDiv.innerText = `Faltan: $${Math.abs(diff).toFixed(2)}`;
  }
}

function openCalendarModal() { document.getElementById('calendar-modal').style.display = 'flex'; }
function closeCalendarModal() { document.getElementById('calendar-modal').style.display = 'none'; }
function consultarTasaFecha() {
  const fecha = document.getElementById('selected-date').value;
  const res = document.getElementById('calendar-result');
  if(fecha) {
    res.innerText = `Tasa oficial para ${fecha}: Bs. ${rates.USD.toFixed(2)} (Ref histórica)`;
  }
}

function openHistoryModal() {
  document.getElementById('hist-bcv').innerText = `Bs. ${rates.USD.toFixed(2)}`;
  document.getElementById('hist-eur').innerText = `Bs. ${rates.EUR.toFixed(2)}`;
  document.getElementById('hist-usdt').innerText = `Bs. ${rates.USDT.toFixed(2)}`;
  document.getElementById('brecha-eur').innerText = `${(((rates.EUR / rates.USD) - 1) * 100).toFixed(1)}%`;
  document.getElementById('brecha-usdt').innerText = `${(((rates.USDT / rates.USD) - 1) * 100).toFixed(1)}%`;
  document.getElementById('history-modal').style.display = 'flex';
}
function closeHistoryModal() { document.getElementById('history-modal').style.display = 'none'; }

function openRegionalModal() {
  document.getElementById('reg-brl').innerText = `Bs. ${rates.BRL.toFixed(2)}`;
  document.getElementById('reg-cop').innerText = `Bs. ${(1 / rates.COP).toFixed(4)}`;
  document.getElementById('reg-ars').innerText = `Bs. ${(rates.USD / 1200).toFixed(4)}`;
  document.getElementById('regional-modal').style.display = 'flex';
}
function closeRegionalModal() { document.getElementById('regional-modal').style.display = 'none'; }

function openInterventionModal() { document.getElementById('intervention-modal').style.display = 'flex'; }
function closeInterventionModal() { document.getElementById('intervention-modal').style.display = 'none'; }

function openTomorrowModal() { document.getElementById('tomorrow-modal').style.display = 'flex'; }
function closeTomorrowModal() { document.getElementById('tomorrow-modal').style.display = 'none'; }

function openMyRateModal() {
  document.getElementById('custom-rate-input').value = customRate;
  document.getElementById('myrate-modal').style.display = 'flex';
}
function closeMyRateModal() { document.getElementById('myrate-modal').style.display = 'none'; }
function saveCustomRate() {
  const val = parseFloat(document.getElementById('custom-rate-input').value);
  if(val && val > 0) {
    customRate = val;
    rates.MYRATE = val;
    localStorage.setItem('daycambio_custom_rate', val);
    alert('¡Mi Tasa guardada con éxito!');
    closeMyRateModal();
    if(selectedCurrency === 'MYRATE') calculate();
  }
}

function openModal() {
  const val = document.getElementById('result-val').innerText;
  const sym = document.getElementById('result-symbol').innerText;
  const amt = document.getElementById('amount').value || '1,00';
  const cur = document.getElementById('input-symbol').innerText;
  
  const activeBcv = rateMode === 'tomorrow' ? ratesTomorrow.USD : rates.USD;
  document.getElementById('modal-amount').innerText = `${sym} ${val}`;
  document.getElementById('modal-details').innerHTML = `Tasa aplicada: Bs. ${activeBcv.toFixed(2)}<br>Monto base: ${cur} ${amt}`;
  document.getElementById('receipt-modal').style.display = 'flex';
}
function closeModal() { document.getElementById('receipt-modal').style.display = 'none'; }

async function shareNativeImage() {
  const card = document.getElementById('receipt-to-render');
  try {
    const canvas = await html2canvas(card, { backgroundColor: '#090d14', scale: 2 });
    canvas.toBlob(async (blob) => {
      const file = new File([blob], "DayCambio-Recibo.png", { type: "png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'DayCambio', text: 'Recibo generado por DayCambio' });
      } else {
        downloadImage();
      }
    });
  } catch (e) {
    alert("No se pudo generar la imagen para compartir.");
  }
}

function downloadImage() {
  const card = document.getElementById('receipt-to-render');
  html2canvas(card, { backgroundColor: '#090d14', scale: 2 }).then(canvas => {
    const link = document.createElement('a');
    link.download = 'DayCambio-Recibo.png';
    link.href = canvas.toDataURL('png');
    link.click();
  });
}
