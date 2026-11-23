import { generatePrediction, mockPredictionHistory } from '../services/predictionService.js';
import PredictionRecord from '../models/PredictionRecord.js';
import { isDBConnected } from '../config/db.js';

export const getPrediction = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const buyThreshold = req.query.buy_threshold;
    const sellThreshold = req.query.sell_threshold;

    if (!symbol) {
      return res.status(400).json({ error: { message: 'Stock symbol is required' } });
    }

    const prediction = await generatePrediction(symbol, { buyThreshold, sellThreshold });
    res.status(200).json(prediction);
  } catch (err) {
    next(err);
  }
};

export const getPredictionHistory = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const limit = parseInt(req.query.limit, 10) || 10;

    if (!isDBConnected()) {
      const upper = symbol ? symbol.toUpperCase() : null;
      const filtered = upper ? mockPredictionHistory.filter((r) => r.symbol === upper) : mockPredictionHistory;
      const records = filtered.slice(0, limit);
      return res.status(200).json({
        success: true,
        count: records.length,
        data: records,
      });
    }

    const query = symbol ? { symbol: symbol.toUpperCase() } : {};

    const records = await PredictionRecord.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (err) {
    next(err);
  }
};

export default { getPrediction, getPredictionHistory };
