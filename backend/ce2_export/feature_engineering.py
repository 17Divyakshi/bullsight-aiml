"""BULLSIGHT shared historical-only features for training and FastAPI inference."""
import numpy as np
import pandas as pd

FEATURES = ['Open','High','Low','Close','SMA_10','SMA_20','EMA_10','EMA_20','RSI','MACD','MACD_Signal','BB_Middle','BB_Upper','BB_Lower']
SEQ_LEN = 30
MIN_HISTORY = 60  # 20-day rolling indicators + sufficient EMA/MACD warm-up

def normalize_ohlc(raw, ticker=None):
    if raw is None or raw.empty:
        raise ValueError(f'No market data for {ticker}')
    df = raw.copy()
    if isinstance(df.columns, pd.MultiIndex):
        if ticker is not None and ticker in df.columns.get_level_values(-1):
            df = df.xs(ticker, axis=1, level=-1)
        else:
            df.columns = df.columns.get_level_values(0)
    df = df.reset_index()
    if 'Datetime' in df and 'Date' not in df: df = df.rename(columns={'Datetime':'Date'})
    if 'Date' not in df: raise ValueError('Date column missing')
    df['Date'] = pd.to_datetime(df['Date'], utc=True).dt.tz_convert(None).dt.normalize()
    df = df.sort_values('Date').drop_duplicates('Date', keep='last')
    for name in ['Open','High','Low','Close']:
        if name not in df: raise ValueError(f'Missing {name}')
        df[name] = pd.to_numeric(df[name], errors='coerce')
    df = df.replace([np.inf,-np.inf],np.nan).dropna(subset=['Open','High','Low','Close'])
    df = df[(df[['Open','High','Low','Close']]>0).all(axis=1)]
    df = df[(df['High']>=df[['Open','Close','Low']].max(axis=1)) & (df['Low']<=df[['Open','Close','High']].min(axis=1))]
    if df.empty: raise ValueError('No valid OHLC rows')
    return df.reset_index(drop=True)

def make_features(raw):
    """Historical-only indicators. CE-1 simple rolling RSI, NOT Wilder smoothing.
    For stable inference supply >=60 trading rows, ideally entire history.
    Target is intentionally NOT created here; caller uses Close.shift(-1).
    """
    df = normalize_ohlc(raw)
    if len(df)<MIN_HISTORY: raise ValueError(f'Need at least {MIN_HISTORY} historical rows')
    close=df['Close']
    for n in (10,20):
        df[f'SMA_{n}']=close.rolling(n).mean()
        df[f'EMA_{n}']=close.ewm(span=n,adjust=False).mean()
    delta=close.diff();gain=delta.clip(lower=0);loss=(-delta.clip(upper=0))
    ag=gain.rolling(14).mean();al=loss.rolling(14).mean()
    rs=ag/al.replace(0,np.nan)
    df['RSI']=100-100/(1+rs)
    df.loc[(al==0)&(ag>0),'RSI']=100
    df.loc[(al==0)&(ag==0),'RSI']=50
    ema12=close.ewm(span=12,adjust=False).mean()
    ema26=close.ewm(span=26,adjust=False).mean()
    df['MACD']=ema12-ema26
    df['MACD_Signal']=df['MACD'].ewm(span=9,adjust=False).mean()
    df['BB_Middle']=close.rolling(20).mean()
    sd=close.rolling(20).std()
    df['BB_Upper']=df['BB_Middle']+2*sd
    df['BB_Lower']=df['BB_Middle']-2*sd
    return df.dropna(subset=FEATURES).reset_index(drop=True)
