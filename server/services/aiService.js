import { getStockSummary, getStockHistory } from './yahooService.js';
import { computeIndicatorsFromCandles } from './indicatorService.js';
import { generatePrediction } from './predictionService.js';

function formatAssetValue(symbol, val) {
  if (val === null || val === undefined || Number.isNaN(Number(val))) return 'N/A';
  const sym = String(symbol || '').toUpperCase();
  const formatted = Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (sym === '^NSEI') return `${formatted} pts`;
  if (sym.endsWith('.NS') || sym.endsWith('.BO')) return `₹${formatted}`;
  return `$${formatted}`;
}

export async function processAIChat(message, contextSymbol = '^NSEI') {
  const sym = (contextSymbol || '^NSEI').toUpperCase().trim();
  const apiKey = process.env.OPENAI_API_KEY;

  const [summary, history, pred] = await Promise.all([
    getStockSummary(sym),
    getStockHistory(sym, '3M'),
    generatePrediction(sym),
  ]);
  const indicators = computeIndicatorsFromCandles(history);

  const priceStr = formatAssetValue(sym, summary.price);
  const changePct = summary.changePercent;
  const chgStr = changePct != null ? `${changePct >= 0 ? '+' : ''}${changePct}%` : 'N/A';
  const rsi = indicators.rsi?.value ?? 'N/A';
  const rsiSig = indicators.rsi?.signal || 'Neutral';
  const macdSig = indicators.macd?.signal || 'Neutral';
  const sma20Str = formatAssetValue(sym, indicators.sma20?.value);

  const predSummary = pred.ml_verified
    ? `Verified Next-Session Close Prediction: ${formatAssetValue(sym, pred.predicted_next_close)} (${pred.predicted_change_percent >= 0 ? '+' : ''}${pred.predicted_change_percent}%, Model: ${pred.selected_model}, Experimental Signal: ${pred.signal})`
    : `Model Prediction Status: Unverified (${pred.message})`;

  if (apiKey) {
    try {
      const systemPrompt = `You are BullSight AI, an educational quantitative stock market intelligence assistant.
Ground your answers in real stock data for ${sym}:
Latest Observed Price: ${priceStr}, Change: ${chgStr}, RSI: ${rsi} (${rsiSig}), MACD: ${macdSig}, SMA 20: ${sma20Str}.
${predSummary}.
Be concise, factual, never invent predictions, and note that analytics are for educational purposes only.`;

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
          max_tokens: 350,
          temperature: 0.4,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content;
        if (reply) {
          return {
            reply,
            sources: ['OpenAI GPT Engine', 'Yahoo Finance v8 Feed', 'Technical Indicator & ML Engine'],
            isFallback: false,
          };
        }
      }
    } catch (err) {
      console.warn(`[AIService] OpenAI call failed: ${err.message}. Using quantitative rule engine.`);
    }
  }

  const reply = `BULLSIGHT Quantitative Analytics Snapshot for ${sym}:
• Latest Observed Close: ${priceStr} (${chgStr})
• Momentum Status: 14-day RSI is ${rsi} (${rsiSig})
• Trend Indicators: 20-period SMA is ${sma20Str}, MACD signal is ${macdSig}
• ${predSummary}
Note: Educational technical and ML analytics only — not financial advice.`;

  return {
    reply,
    sources: ['Yahoo Finance v8 Feed', 'Quantitative Technical Engine', 'ML Inference Status'],
    isFallback: true,
  };
}
