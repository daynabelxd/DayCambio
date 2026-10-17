import React, { useState, useEffect } from 'react';
import ResultCard from '@/components/daycambio/ResultCard';
import ReceiptModal from '@/components/daycambio/ReceiptModal';
import { formatBs, formatNumber } from '@/lib/daycambio';

export default function App() {
  const [rates, setRates] = useState({
    USD: 880.12,
    EUR: 985.73,
    USDT: 1002.65,
  });
  const [amount, setAmount] = useState('1');
  const [currency, setCurrency] = useState('USD');
  const [igtf, setIgtf] = useState(false);
  const [openModal, setOpenModal] = useState(null);

  const activeRate = rates[currency] || rates.USD;
  const numericAmount = parseFloat(amount) || 0;
  const baseBs = numericAmount * activeRate;
  
  const transfer = baseBs * 0.01;
  const pmovil = Math.max(baseBs * 0.005, 14.00);
  const igtfVal = igtf ? baseBs * 0.03 : 0;
  const total = baseBs + igtfVal;

  const theme = {
    bg: '#070d14',
    bg2: '#121a26',
    text: '#f0f6fc',
    muted: '#8b949e',
    accent: '#a855f7',
  };

  return (
    <div className="min-h-screen bg-[#070d14] text-[#f0f6fc] flex flex-col items-center p-4 font-sans">
      <div className="w-full max-full max-w-md space-y-4">
        {/* Encabezado */}
        <header className="flex justify-between items-center py-2">
          <div className="flex items-center gap-3">
            <img src="/icon-192.png" alt="Logo" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-xl font-bold leading-tight">DayCambio</h1>
              <p className="text-[10px] uppercase tracking-widest text-[#8b949e] font-semibold">Conversor & Comisiones</p>
            </div>
          </div>
        </header>

        {/* Tarjeta Principal */}
        <div className="bg-[#121a26] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
          {/* Selector de Moneda */}
          <div className="flex bg-[#0a101a] p-1 rounded-2xl border border-white/5 gap-1">
            {['USD', 'EUR', 'USDT'].map((curr) => (
              <button
                key={curr}
                onClick={() => setCurrency(curr)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  currency === curr ? 'bg-purple-600 text-black shadow-lg' : 'text-[#8b949e]'
                }`}
              >
                {curr}
              </button>
            ))}
          </div>

          {/* Input de Monto */}
          <div className="bg-[#0a101a] border-2 border-purple-500/80 rounded-2xl p-3 flex items-center gap-3">
            <span className="text-xl font-extrabold text-purple-400">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-transparent w-full text-2xl font-bold text-white outline-none"
              placeholder="0.00"
            />
          </div>

          {/* Componente de Resultado de tu amigo */}
          <ResultCard
            label="Bs."
            value={formatNumber(baseBs)}
            meta={`Actualizado · ${new Date().toLocaleDateString('es-VE')}`}
            rateLine={`Tasa de referencia: ${activeRate.toFixed(2)} Bs/${currency}`}
          />

          {/* Botón Abrir Recibo */}
          <button
            onClick={() => setOpenModal('recibo')}
            className="w-full py-3 bg-purple-600 text-black font-bold rounded-xl text-sm hover:bg-purple-500 transition-colors"
          >
            Ver y Compartir Recibo
          </button>
        </div>
      </div>

      {/* Modal Recibo de tu amigo */}
      <ReceiptModal
        open={openModal === 'recibo'}
        onClose={() => setOpenModal(null)}
        theme={theme}
        currencyText={`${currency} · Oficial`}
        amountText={`$ ${formatNumber(numericAmount)}`}
        rateText={`Tasa aplicada: ${activeRate.toFixed(2)} Bs/${currency}`}
        metaText={`Actualizado · ${new Date().toLocaleDateString('es-VE')}`}
        totals={{ baseBs, transfer, pmovil, igtf: igtfVal }}
        igtf={igtf}
        total={total}
      />
    </div>
  );
}
