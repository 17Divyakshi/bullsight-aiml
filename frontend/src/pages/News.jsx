import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { UnavailableState } from '../components/UnavailableState';
import { Footer } from '../components/Footer';
import { stockAPI } from '../services/api';
import { Newspaper, Info, Search, RefreshCw } from 'lucide-react';

export const News = () => {
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const loadNews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await stockAPI.getNews();
      setNews(data);
    } catch (e) {
      console.error('Error fetching news:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const articles = news?.articles || [];

  const filteredArticles = articles.filter(a => {
    const matchesSentiment = filter === 'ALL' || a.sentiment === filter;
    const matchesSearch =
      !search ||
      String(a.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.symbol && String(a.symbol).toLowerCase().includes(search.toLowerCase()));
    return matchesSentiment && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#070B1A] text-[#F8FAFF] flex font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title="News & Sentiment" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto min-w-0 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[rgba(125,160,255,0.18)]">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <Newspaper className="w-5 h-5 text-[#38D9F5]" />
                <h2 className="text-2xl font-extrabold font-display text-[#F8FAFF] tracking-tight">
                  Financial News &amp; Sentiment Feed
                </h2>
              </div>
              <p className="text-xs text-[#AAB7D0] mt-1">
                Market headlines with directional sentiment tags. External News API keys remain completely optional.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#7B8AA8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter headlines or ticker..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="bg-[#10182B] border border-[rgba(125,160,255,0.22)] rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono text-[#F8FAFF] placeholder-[#7B8AA8] focus:outline-none focus:border-[#38D9F5]"
                />
              </div>

              <div className="flex items-center space-x-1 bg-[#10182B] p-1 rounded-xl border border-[rgba(125,160,255,0.2)] text-xs font-mono">
                {['ALL', 'POSITIVE', 'NEUTRAL', 'NEGATIVE'].map(s => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                      filter === s
                        ? 'bg-[#31E981] text-[#070B1A]'
                        : 'text-[#7B8AA8] hover:text-[#F8FAFF]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={loadNews}
                disabled={loading}
                className="p-2 rounded-xl bg-[#10182B] border border-[rgba(125,160,255,0.22)] text-[#38D9F5] hover:border-[#31E981]/45 transition-all"
                title="Refresh Headlines"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {news && !news.configured && articles.length > 0 && (
            <div className="bull-card p-4 text-xs text-[#AAB7D0] flex items-start space-x-3">
              <div className="p-1.5 rounded-lg bg-[#38D9F5]/12 border border-[#38D9F5]/25 text-[#38D9F5] shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-[#F8FAFF]">Curated Sample Headlines Active</p>
                <p className="text-[#7B8AA8] leading-relaxed mt-0.5">
                  {news.message || 'Core equity forecasting operates independently without an external NEWS_API_KEY.'}
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bull-card p-5 h-32 animate-pulse bg-[#10182B]/70" />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <UnavailableState
              title="Market news feed is currently unavailable."
              description={news?.message || 'Could not retrieve headlines from the backend service.'}
              onRetry={loadNews}
              retrying={loading}
            />
          ) : filteredArticles.length === 0 ? (
            <div className="bull-card p-10 text-center text-xs font-mono text-[#7B8AA8]">
              No headlines match your active sentiment or search filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredArticles.map(article => {
                const isPos = article.sentiment === 'POSITIVE';
                const isNeg = article.sentiment === 'NEGATIVE';
                return (
                  <div
                    key={article.id}
                    className="bull-card bull-card-interactive p-5 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-bold text-[#F8FAFF] leading-snug">
                          {article.title}
                        </h3>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border shrink-0 tabular-nums whitespace-nowrap ${
                            isPos
                              ? 'bg-[#31E981]/10 text-[#31E981] border-[#31E981]/25'
                              : isNeg
                                ? 'bg-[#FF586A]/10 text-[#FF586A] border-[#FF586A]/25'
                                : 'bg-[#38D9F5]/10 text-[#38D9F5] border-[#38D9F5]/25'
                          }`}
                        >
                          {article.sentiment} ({Math.round((article.sentimentScore || 0.5) * 100)}%)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-[#7B8AA8] pt-2.5 border-t border-[rgba(125,160,255,0.12)]">
                      <span>
                        <strong className="text-[#AAB7D0]">{article.source}</strong> · {article.time}
                      </span>
                      {article.symbol && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#4D8DFF]/12 text-[#38D9F5] border border-[#4D8DFF]/25">
                          {article.symbol}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Footer />
        </main>
      </div>
    </div>
  );
};
