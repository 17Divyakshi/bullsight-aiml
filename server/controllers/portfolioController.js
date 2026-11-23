import crypto from 'crypto';
import Portfolio from '../models/Portfolio.js';
import Holding from '../models/Holding.js';
import { getStockSummary } from '../services/yahooService.js';
import { getStockBySymbol } from '../utils/stockUniverse.js';
import { isDBConnected } from '../config/db.js';

const INITIAL_DEFAULT_HOLDINGS = [
  { symbol: 'AAPL', name: 'Apple Inc.', quantity: 15.0, buyPrice: 180.0 },
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd.', quantity: 50.0, buyPrice: 2850.0 },
  { symbol: 'NVDA', name: 'NVIDIA Corp', quantity: 10.0, buyPrice: 110.0 },
];

// In-memory fallback store when MongoDB is offline
let mockHoldings = INITIAL_DEFAULT_HOLDINGS.map((h) => ({
  _id: crypto.randomUUID(),
  symbol: h.symbol,
  name: h.name,
  quantity: h.quantity,
  buyPrice: h.buyPrice,
  buyDate: new Date().toISOString(),
  notes: '',
}));

/**
 * Helper to ensure a default portfolio exists in MongoDB.
 */
async function getOrCreateDefaultPortfolio(userId = null) {
  let portfolio = await Portfolio.findOne({ userId });
  if (!portfolio) {
    portfolio = await Portfolio.create({
      userId,
      name: 'Main Trading Portfolio',
      description: 'Primary quantitative equity portfolio',
    });

    // Seed default holdings if new
    for (const h of INITIAL_DEFAULT_HOLDINGS) {
      await Holding.create({
        portfolioId: portfolio._id,
        symbol: h.symbol,
        name: h.name,
        quantity: h.quantity,
        buyPrice: h.buyPrice,
      });
    }
  }
  return portfolio;
}

/**
 * GET /api/user/portfolio
 * Retrieves portfolio holdings from MongoDB (or in-memory fallback).
 */
export const getPortfolio = async (req, res, next) => {
  try {
    let holdings;
    if (!isDBConnected()) {
      holdings = mockHoldings;
    } else {
      const userId = req.user ? req.user._id : null;
      const portfolio = await getOrCreateDefaultPortfolio(userId);
      holdings = await Holding.find({ portfolioId: portfolio._id }).sort({ createdAt: -1 });
    }

    const formatted = holdings.map((h) => ({
      id: h._id,
      _id: h._id,
      symbol: h.symbol,
      name: h.name,
      quantity: h.quantity,
      qty: h.quantity,
      buy_price: h.buyPrice,
      buyPrice: h.buyPrice,
      totalCost: Number((h.quantity * h.buyPrice).toFixed(2)),
      buyDate: h.buyDate,
    }));

    res.status(200).json(formatted);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/user/portfolio
 * Adds a new stock holding to MongoDB (or in-memory fallback)
 */
export const addHolding = async (req, res, next) => {
  try {
    const { symbol, name, quantity, qty, buy_price, buyPrice } = req.body;

    if (!symbol) {
      return res.status(400).json({ error: { message: 'Stock symbol is required' } });
    }

    const q = Number(quantity || qty);
    const p = Number(buy_price || buyPrice);

    if (isNaN(q) || q <= 0) {
      return res.status(400).json({ error: { message: 'Quantity must be a positive number' } });
    }
    if (isNaN(p) || p < 0) {
      return res.status(400).json({ error: { message: 'Buy price must be a non-negative number' } });
    }

    const sym = symbol.toUpperCase().trim();
    const meta = getStockBySymbol(sym);
    const stockName = name || meta.name || sym;

    if (!isDBConnected()) {
      const holding = {
        _id: crypto.randomUUID(),
        symbol: sym,
        name: stockName,
        quantity: q,
        buyPrice: p,
        buyDate: new Date().toISOString(),
        notes: '',
      };
      mockHoldings.unshift(holding);
      return res.status(201).json({
        status: 'holding_added',
        id: holding._id,
        holding: {
          id: holding._id,
          symbol: holding.symbol,
          name: holding.name,
          quantity: holding.quantity,
          buyPrice: holding.buyPrice,
        },
      });
    }

    const userId = req.user ? req.user._id : null;
    const portfolio = await getOrCreateDefaultPortfolio(userId);

    const holding = await Holding.create({
      portfolioId: portfolio._id,
      symbol: sym,
      name: stockName,
      quantity: q,
      buyPrice: p,
    });

    res.status(201).json({
      status: 'holding_added',
      id: holding._id,
      holding: {
        id: holding._id,
        symbol: holding.symbol,
        name: holding.name,
        quantity: holding.quantity,
        buyPrice: holding.buyPrice,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/user/portfolio/:id
 * Updates an existing holding in MongoDB (or in-memory fallback)
 */
export const updateHolding = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity, qty, buyPrice, buy_price, notes } = req.body;

    const updates = {};
    if (quantity !== undefined || qty !== undefined) {
      const q = Number(quantity !== undefined ? quantity : qty);
      if (isNaN(q) || q <= 0) {
        return res.status(400).json({ error: { message: 'Quantity must be a positive number' } });
      }
      updates.quantity = q;
    }

    if (buyPrice !== undefined || buy_price !== undefined) {
      const p = Number(buyPrice !== undefined ? buyPrice : buy_price);
      if (isNaN(p) || p < 0) {
        return res.status(400).json({ error: { message: 'Buy price must be a non-negative number' } });
      }
      updates.buyPrice = p;
    }

    if (notes !== undefined) {
      updates.notes = notes;
    }

    if (!isDBConnected()) {
      const idx = mockHoldings.findIndex((h) => h._id === id);
      if (idx === -1) {
        return res.status(404).json({ error: { message: 'Holding not found' } });
      }
      mockHoldings[idx] = { ...mockHoldings[idx], ...updates };
      return res.status(200).json({ status: 'updated', holding: mockHoldings[idx] });
    }

    const holding = await Holding.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!holding) {
      return res.status(404).json({ error: { message: 'Holding not found' } });
    }

    res.status(200).json({
      status: 'updated',
      holding,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/user/portfolio/:identifier
 * Deletes a holding by ID or symbol from MongoDB (or in-memory fallback)
 */
export const deleteHolding = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    if (!identifier) {
      return res.status(400).json({ error: { message: 'Holding identifier is required' } });
    }

    if (!isDBConnected()) {
      const upper = identifier.toUpperCase().trim();
      const idx = mockHoldings.findIndex((h) => h._id === identifier || h.symbol === upper);
      if (idx !== -1) {
        mockHoldings.splice(idx, 1);
        return res.status(200).json({ status: 'removed', identifier });
      }
      return res.status(404).json({ status: 'not_found', identifier });
    }

    let deleted = null;
    // Check if identifier is a valid MongoDB ObjectId (24 hex chars)
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      deleted = await Holding.findByIdAndDelete(identifier);
    }

    if (!deleted) {
      // Fallback: delete by stock symbol
      deleted = await Holding.findOneAndDelete({ symbol: identifier.toUpperCase().trim() });
    }

    if (deleted) {
      return res.status(200).json({ status: 'removed', identifier });
    }

    res.status(404).json({ status: 'not_found', identifier });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/user/portfolio/analytics
 * Portfolio Analytics (MongoDB Aggregation or in-memory computation)
 */
export const getPortfolioAnalytics = async (req, res, next) => {
  try {
    let portfolioName = 'Main Trading Portfolio';
    let holdings;
    let totalCost = 0;

    if (!isDBConnected()) {
      holdings = mockHoldings;
      totalCost = holdings.reduce((acc, h) => acc + h.quantity * h.buyPrice, 0);
    } else {
      const userId = req.user ? req.user._id : null;
      const portfolio = await getOrCreateDefaultPortfolio(userId);
      portfolioName = portfolio.name;

      const pipelineResult = await Holding.aggregate([
        { $match: { portfolioId: portfolio._id } },
        {
          $group: {
            _id: null,
            totalInvestment: { $sum: { $multiply: ['$quantity', '$buyPrice'] } },
            totalHoldingsCount: { $sum: 1 },
            symbols: { $push: '$symbol' },
          },
        },
      ]);

      const aggregate = pipelineResult[0] || { totalInvestment: 0, totalHoldingsCount: 0, symbols: [] };
      totalCost = aggregate.totalInvestment || 0;
      holdings = await Holding.find({ portfolioId: portfolio._id });
    }

    // Fetch live market prices for marked-to-market valuation
    let currentTotalValue = 0;
    const enrichedHoldings = [];

    for (const h of holdings) {
      const summary = await getStockSummary(h.symbol);
      const currentPrice = summary.price || h.buyPrice;
      const currentValue = Number((h.quantity * currentPrice).toFixed(2));
      const costBasis = Number((h.quantity * h.buyPrice).toFixed(2));
      const pnl = Number((currentValue - costBasis).toFixed(2));
      const pnlPercent = costBasis > 0 ? Number(((pnl / costBasis) * 100).toFixed(2)) : 0;

      currentTotalValue += currentValue;
      enrichedHoldings.push({
        id: h._id,
        symbol: h.symbol,
        name: h.name,
        quantity: h.quantity,
        buyPrice: h.buyPrice,
        currentPrice,
        costBasis,
        currentValue,
        pnl,
        pnlPercent,
      });
    }

    const totalCostRounded = Number(totalCost.toFixed(2));
    const totalCurrent = Number(currentTotalValue.toFixed(2));
    const totalPnl = Number((totalCurrent - totalCostRounded).toFixed(2));
    const totalPnlPercent = totalCostRounded > 0 ? Number(((totalPnl / totalCostRounded) * 100).toFixed(2)) : 0;

    res.status(200).json({
      portfolioName,
      totalHoldingsCount: holdings.length,
      totalCostBasis: totalCostRounded,
      currentMarketValue: totalCurrent,
      totalProfitLoss: totalPnl,
      totalProfitLossPercent: totalPnlPercent,
      holdings: enrichedHoldings,
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getPortfolio,
  addHolding,
  updateHolding,
  deleteHolding,
  getPortfolioAnalytics,
};
