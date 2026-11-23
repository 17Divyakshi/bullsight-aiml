import Watchlist from '../models/Watchlist.js';
import { isDBConnected } from '../config/db.js';

const DEFAULT_WATCHLIST = ['AAPL', 'RELIANCE.NS', 'NVDA', 'TCS.NS'];
// In-memory fallback store when MongoDB is offline
let mockWatchlist = [...DEFAULT_WATCHLIST];

/**
 * GET /api/user/watchlist
 * Retrieves watchlist items from MongoDB (or in-memory fallback)
 */
export const getWatchlist = async (req, res, next) => {
  try {
    if (!isDBConnected()) {
      return res.status(200).json(mockWatchlist);
    }

    const userId = req.user ? req.user._id : null;
    const items = await Watchlist.find({ userId }).sort({ addedAt: -1 });

    if (!items || items.length === 0) {
      return res.status(200).json(DEFAULT_WATCHLIST);
    }

    const symbols = items.map((i) => i.symbol);
    res.status(200).json(symbols);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/user/watchlist
 * Adds a new stock symbol to MongoDB watchlist (or in-memory fallback)
 */
export const addToWatchlist = async (req, res, next) => {
  try {
    const { symbol, notes } = req.body;
    if (!symbol) {
      return res.status(400).json({ error: { message: 'Stock symbol is required', statusCode: 400 } });
    }

    const sym = symbol.toUpperCase().trim();

    if (!isDBConnected()) {
      if (mockWatchlist.includes(sym)) {
        return res.status(200).json({ status: 'already_exists', symbol: sym, id: sym });
      }
      mockWatchlist.unshift(sym);
      return res.status(201).json({ status: 'success', symbol: sym, id: sym });
    }

    const userId = req.user ? req.user._id : null;

    const existing = await Watchlist.findOne({ userId, symbol: sym });
    if (existing) {
      return res.status(200).json({ status: 'already_exists', symbol: sym, id: existing._id });
    }

    const item = await Watchlist.create({
      userId,
      symbol: sym,
      notes: notes || '',
    });

    res.status(201).json({ status: 'success', symbol: item.symbol, id: item._id });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/user/watchlist/:symbol
 * Removes a stock symbol from MongoDB watchlist (or in-memory fallback)
 */
export const deleteFromWatchlist = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    if (!symbol) {
      return res.status(400).json({ error: { message: 'Stock symbol is required' } });
    }

    const sym = symbol.toUpperCase().trim();

    if (!isDBConnected()) {
      mockWatchlist = mockWatchlist.filter((s) => s !== sym);
      return res.status(200).json({ status: 'removed', symbol: sym });
    }

    const userId = req.user ? req.user._id : null;

    const result = await Watchlist.findOneAndDelete({ userId, symbol: sym });
    if (!result) {
      // Also try deleting if userId was null or any matching symbol for guest
      await Watchlist.findOneAndDelete({ symbol: sym });
    }

    res.status(200).json({ status: 'removed', symbol: sym });
  } catch (err) {
    next(err);
  }
};

export default { getWatchlist, addToWatchlist, deleteFromWatchlist };
