
import React, { useState, useEffect, useRef } from 'react';
import LocationInput from './components/LocationInput';
import Card from './components/Card';
import { 
  CloudIcon, 
  MapPinIcon, 
  ShoppingBagIcon, 
  CheckIcon, 
  HotelIcon, 
  HomeIcon,
  CompassIcon,
  CurrencyIcon,
  CreditCardIcon,
  CashIcon
} from './components/Icons';
import { TravelData, ActiveTab, Expense, CustomActivity, TimedListItem } from './types';
import { fetchTravelData } from './services/geminiService';

const App: React.FC = () => {
  // Refs
  const formRef = useRef<HTMLDivElement>(null);

  // Connection State
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Initialize state from localStorage
  const [location, setLocation] = useState<string>(() => localStorage.getItem('lastLocation') || '');
  const [data, setData] = useState<TravelData | null>(() => {
    const savedData = localStorage.getItem('lastTravelData');
    return savedData ? JSON.parse(savedData) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [error, setError] = useState<string | null>(null);

  // Manual Hotel State
  const [userHotelName, setUserHotelName] = useState<string>(() => localStorage.getItem('userHotelName') || '');
  const [userRoomNumber, setUserRoomNumber] = useState<string>(() => localStorage.getItem('userRoomNumber') || '');

  // Manual Plan/Itinerary State
  const [customActivities, setCustomActivities] = useState<CustomActivity[]>(() => {
    const saved = localStorage.getItem('customActivities');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Time/Form States
  const [hour, setHour] = useState<string>('09');
  const [minute, setMinute] = useState<string>('00');
  const [newActivity, setNewActivity] = useState<Partial<CustomActivity>>({ event: '', location: '', remarks: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Timed Lists State
  const [prepList, setPrepList] = useState<TimedListItem[]>(() => JSON.parse(localStorage.getItem('prepList') || '[]'));
  const [userTodoList, setUserTodoList] = useState<TimedListItem[]>(() => JSON.parse(localStorage.getItem('userTodoList') || '[]'));
  const [userShoppingList, setUserShoppingList] = useState<TimedListItem[]>(() => JSON.parse(localStorage.getItem('userShoppingList') || '[]'));
  
  const [listInputText, setListInputText] = useState({ prep: '', todo: '', shopping: '' });
  const [listInputTime, setListInputTime] = useState({ prep: '08:00', todo: '10:00', shopping: '14:00' });

  // Expenses State
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('expenses');
    return saved ? JSON.parse(saved) : [];
  });
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    item: '', amount: 0, currency: 'USD', method: 'Credit Card', payer: 'Me'
  });

  // Converter State
  const [converterAmount, setConverterAmount] = useState<number>(1);
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [conversionResult, setConversionResult] = useState<number | null>(null);

  // Sync connection status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Persistence
  useEffect(() => {
    localStorage.setItem('lastLocation', location);
    if (data) localStorage.setItem('lastTravelData', JSON.stringify(data));
    localStorage.setItem('userHotelName', userHotelName);
    localStorage.setItem('userRoomNumber', userRoomNumber);
    localStorage.setItem('customActivities', JSON.stringify(customActivities));
    localStorage.setItem('prepList', JSON.stringify(prepList));
    localStorage.setItem('userTodoList', JSON.stringify(userTodoList));
    localStorage.setItem('userShoppingList', JSON.stringify(userShoppingList));
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [location, data, userHotelName, userRoomNumber, customActivities, prepList, userTodoList, userShoppingList, expenses]);

  const handleSearch = async (searchLoc: string, coords?: { lat: number; lng: number }) => {
    if (!isOnline) {
      setError("Search requires an internet connection.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setLocation(searchLoc);
    try {
      const result = await fetchTravelData(searchLoc, coords);
      setData(result);
      setActiveTab('overview');
    } catch (err) {
      setError("Unable to reach destination info.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Lumina Itinerary: ${location || 'My Trip'}`,
      text: `Check out my travel plan for ${location || 'this trip'}! 🌍✈️\n\nStay: ${userHotelName || 'Not set'}\nActivities: ${customActivities.length} planned.\n\nView more on Lumina Travel Planner.`,
      url: window.location.href,
    };

    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) {}
    } else {
      navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      alert("Plan copied to clipboard!");
    }
  };

  const padTime = (val: string) => val.padStart(2, '0');

  const saveActivity = () => {
    if (!newActivity.event) return;
    const formattedTime = `${padTime(hour)}:${padTime(minute)}`;
    if (editingId) {
      setCustomActivities(customActivities.map(act => 
        act.id === editingId 
          ? { ...act, ...newActivity as CustomActivity, time: formattedTime } 
          : act
      ));
      setEditingId(null);
    } else {
      const activity: CustomActivity = {
        id: Date.now().toString(),
        time: formattedTime,
        event: newActivity.event!,
        location: newActivity.location || '',
        remarks: newActivity.remarks || ''
      };
      setCustomActivities([...customActivities, activity]);
    }
    setNewActivity({ event: '', location: '', remarks: '' });
    setHour('09');
    setMinute('00');
  };

  const removeActivity = (id: string) => {
    if (editingId === id) setEditingId(null);
    setCustomActivities(customActivities.filter(a => a.id !== id));
  };

  const addTimedListItem = (type: 'prep' | 'todo' | 'shopping') => {
    const text = listInputText[type].trim();
    if (!text) return;
    const item: TimedListItem = {
      id: Date.now().toString(),
      text,
      time: listInputTime[type],
      completed: false
    };
    if (type === 'prep') setPrepList([...prepList, item]);
    if (type === 'todo') setUserTodoList([...userTodoList, item]);
    if (type === 'shopping') setUserShoppingList([...userShoppingList, item]);
    setListInputText({ ...listInputText, [type]: '' });
  };

  const addExpense = () => {
    if (!newExpense.item || !newExpense.amount) return;
    const expense: Expense = {
      id: Date.now().toString(),
      item: newExpense.item!,
      amount: Number(newExpense.amount),
      currency: (newExpense.currency || 'USD').toUpperCase(),
      method: (newExpense.method as 'Cash' | 'Credit Card') || 'Credit Card',
      payer: newExpense.payer || 'Me',
      date: new Date().toLocaleDateString()
    };
    setExpenses([expense, ...expenses]);
    setNewExpense({ ...newExpense, item: '', amount: 0 });
  };

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const convertCurrency = () => {
    const mockRates: Record<string, number> = { 'USD_EUR': 0.92, 'EUR_USD': 1.09, 'USD_GBP': 0.79, 'GBP_USD': 1.27, 'USD_JPY': 150.12 };
    const key = `${fromCurrency.toUpperCase()}_${toCurrency.toUpperCase()}`;
    setConversionResult(converterAmount * (mockRates[key] || 1.1));
  };

  const NavItem = ({ tab, icon, label }: { tab: ActiveTab; icon: React.ReactElement; label: string }) => (
    <button onClick={() => setActiveTab(tab)} className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${activeTab === tab ? 'text-orange-600 scale-110' : 'text-slate-400'}`}>
      <div className={`p-1 rounded-xl transition-colors ${activeTab === tab ? 'bg-orange-50' : ''}`}>
        {React.cloneElement(icon, { className: "w-6 h-6" } as React.HTMLAttributes<HTMLElement>)}
      </div>
      <span className="text-[10px] font-bold mt-1 uppercase tracking-widest">{label}</span>
    </button>
  );

  const TimedListSection = ({ title, icon, type, items, aiItems = [] }: any) => (
    <Card title={title} icon={icon}>
      <div className="space-y-4">
        <div className="flex gap-2">
          <input type="time" value={listInputTime[type]} onChange={e => setListInputTime({...listInputTime, [type]: e.target.value})} className="w-24 bg-slate-50 border-none rounded-xl px-2 py-3 text-xs font-bold focus:ring-2 focus:ring-orange-500" />
          <input type="text" placeholder={`Add to ${title.toLowerCase()}...`} value={listInputText[type]} onChange={e => setListInputText({...listInputText, [type]: e.target.value})} className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500" />
          <button onClick={() => addTimedListItem(type)} className="bg-slate-900 text-white w-10 h-10 rounded-xl font-bold">+</button>
        </div>
        <ul className="space-y-2">
          {items.map((item: any) => (
            <li key={item.id} className={`flex items-center gap-3 p-3 rounded-2xl border ${item.completed ? 'bg-slate-50 opacity-60' : 'bg-white shadow-sm border-slate-100'}`}>
              <button onClick={() => {
                const setter = type === 'prep' ? setPrepList : type === 'todo' ? setUserTodoList : setUserShoppingList;
                setter(items.map((i: any) => i.id === item.id ? { ...i, completed: !i.completed } : i));
              }} className={`w-5 h-5 rounded-full border-2 ${item.completed ? 'bg-orange-500 border-orange-500' : 'border-slate-300'}`}>
                {item.completed && <CheckIcon className="w-3 h-3 text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${item.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>{item.text}</p>
                <p className="text-[9px] font-black text-orange-500 uppercase">{item.time}</p>
              </div>
              <button onClick={() => {
                const setter = type === 'prep' ? setPrepList : type === 'todo' ? setUserTodoList : setUserShoppingList;
                setter(items.filter((i: any) => i.id !== item.id));
              }} className="text-slate-300 hover:text-red-400 px-2">✕</button>
            </li>
          ))}
          {aiItems.map((text: string, i: number) => (
            <li key={`ai-${i}`} className="flex items-center gap-3 p-3 rounded-2xl bg-orange-50/40 border border-orange-100/50">
              <CompassIcon className="w-4 h-4 text-orange-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">{text}</p>
                <p className="text-[8px] font-black text-orange-400 uppercase tracking-widest">AI Suggestion</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="safe-top px-6 pt-12 pb-6 bg-white/70 backdrop-blur-xl sticky top-0 z-30 border-b border-slate-100">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0 pr-4">
            <span className="text-orange-600 font-black text-[10px] uppercase tracking-[0.3em] mb-1 block">Lumina Travel</span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight truncate">{location || "My Trip"}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={handleShare} className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600 border border-slate-100 active:scale-90 transition-all"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg></button>
            {data && <div className="bg-slate-100 px-3 py-2 rounded-2xl flex flex-col items-center justify-center"><span className="text-[10px] font-black text-slate-500 uppercase">{data.utcOffset}</span></div>}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pb-32">
        <div className="max-w-xl mx-auto space-y-6 pt-4">
          <LocationInput onSearch={handleSearch} isLoading={isLoading} />
          
          {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-xs font-bold">{error}</div>}
          {isLoading && (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
              <p className="text-orange-600 font-black uppercase text-xs tracking-widest animate-pulse">Building Itinerary...</p>
            </div>
          )}

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'overview' && !isLoading && (
              <div className="space-y-6">
                {!data && (
                  <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-none text-white p-8">
                    <h2 className="text-2xl font-black mb-2">Adventure awaits.</h2>
                    <p className="text-orange-100 text-sm font-medium mb-6">Enter a destination to get an AI-curated guide, weather insights, and local tips.</p>
                    <CompassIcon className="w-24 h-24 opacity-20 absolute -bottom-4 -right-4" />
                  </Card>
                )}
                {data && (
                  <>
                    <Card title="Current Weather" icon={<CloudIcon />}><p className="text-slate-600 text-sm leading-relaxed font-medium">{data.weather}</p></Card>
                    <div className="grid grid-cols-2 gap-4">
                      <Card title="Open Tasks" icon={<CheckIcon />} className="flex flex-col items-center">
                         <span className="text-4xl font-black text-slate-900">{userTodoList.filter(t => !t.completed).length + (data?.todoList.length || 0)}</span>
                         <span className="text-[10px] text-slate-400 font-black uppercase mt-1">Pending</span>
                      </Card>
                      <Card title="Shopping" icon={<ShoppingBagIcon />} className="flex flex-col items-center">
                         <span className="text-4xl font-black text-slate-900">{userShoppingList.filter(s => !s.completed).length + (data?.shoppingList.length || 0)}</span>
                         <span className="text-[10px] text-slate-400 font-black uppercase mt-1">To Buy</span>
                      </Card>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'itinerary' && (
              <div className="space-y-6">
                <Card title="Add to Schedule" icon={<MapPinIcon />}>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <select value={hour} onChange={e => setHour(e.target.value)} className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-lg font-black focus:ring-2 focus:ring-orange-500 appearance-none">
                        {Array.from({length: 24}).map((_, i) => <option key={i} value={padTime(i.toString())}>{padTime(i.toString())}</option>)}
                      </select>
                      <select value={minute} onChange={e => setMinute(e.target.value)} className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-lg font-black focus:ring-2 focus:ring-orange-500 appearance-none">
                        {Array.from({length: 60}).map((_, i) => <option key={i} value={padTime(i.toString())}>{padTime(i.toString())}</option>)}
                      </select>
                    </div>
                    <input type="text" placeholder="Event Name" value={newActivity.event} onChange={e => setNewActivity({...newActivity, event: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500" />
                    <input type="text" placeholder="Location" value={newActivity.location} onChange={e => setNewActivity({...newActivity, location: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500" />
                    <textarea placeholder="Notes / Remarks" value={newActivity.remarks} onChange={e => setNewActivity({...newActivity, remarks: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500 min-h-[80px]" />
                    <button onClick={saveActivity} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">Add Entry</button>
                  </div>
                </Card>

                <div className="space-y-4">
                  {customActivities.sort((a,b) => a.time.localeCompare(b.time)).map(act => (
                    <Card key={act.id} title={`${act.time} — ${act.event}`} icon={<MapPinIcon />}>
                      <div className="space-y-3">
                        {act.remarks && <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl italic">"{act.remarks}"</p>}
                        {act.location && (
                          <div className="rounded-2xl overflow-hidden border border-slate-100 h-40 group relative">
                            {isOnline ? <iframe title={act.event} width="100%" height="100%" frameBorder="0" src={`https://www.google.com/maps?q=${encodeURIComponent(act.location)}&output=embed`} /> : <div className="w-full h-full bg-slate-50 flex items-center justify-center font-bold text-slate-400">Map Offline</div>}
                          </div>
                        )}
                        <button onClick={() => removeActivity(act.id)} className="text-[10px] font-black text-red-400 uppercase tracking-widest pt-2">Delete Activity</button>
                      </div>
                    </Card>
                  ))}
                  {data && <Card title="AI Suggestion" icon={<CompassIcon />}>
                    <div className="space-y-3">
                      <div className="p-4 bg-orange-50/50 rounded-2xl"><span className="font-black text-slate-900 text-[10px] uppercase block mb-1">Morning</span> {data.itineraryTable.morning}</div>
                      <div className="p-4 bg-orange-50/50 rounded-2xl"><span className="font-black text-slate-900 text-[10px] uppercase block mb-1">Afternoon</span> {data.itineraryTable.afternoon}</div>
                      <div className="p-4 bg-orange-50/50 rounded-2xl"><span className="font-black text-slate-900 text-[10px] uppercase block mb-1">Evening</span> {data.itineraryTable.evening}</div>
                    </div>
                  </Card>}
                </div>
              </div>
            )}

            {activeTab === 'hotel' && (
              <div className="space-y-6">
                <Card title="Accommodation" icon={<HotelIcon />}>
                  <div className="space-y-4">
                    <input type="text" value={userHotelName} onChange={e => setUserHotelName(e.target.value)} placeholder="Hotel Name" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500" />
                    <input type="text" value={userRoomNumber} onChange={e => setUserRoomNumber(e.target.value)} placeholder="Room #" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500" />
                    {userHotelName && <div className="h-64 rounded-3xl overflow-hidden border border-slate-100 shadow-inner">
                      {isOnline ? <iframe title="Hotel Map" width="100%" height="100%" frameBorder="0" src={`https://www.google.com/maps?q=${encodeURIComponent(userHotelName + (location ? " " + location : ""))}&output=embed`} /> : <div className="w-full h-full bg-slate-50 flex items-center justify-center font-bold text-slate-400">Offline Map</div>}
                    </div>}
                  </div>
                </Card>
                {data && <Card title="Neighborhood Recs" icon={<CompassIcon />}><div className="text-sm leading-relaxed text-slate-600 font-medium whitespace-pre-wrap">{data.hotelInfo}</div></Card>}
              </div>
            )}

            {activeTab === 'lists' && (
              <div className="space-y-6">
                <TimedListSection title="Preparation" icon={<CheckIcon />} type="prep" items={prepList} />
                <TimedListSection title="Checklist" icon={<CheckIcon />} type="todo" items={userTodoList} aiItems={data?.todoList} />
                <TimedListSection title="Shopping List" icon={<ShoppingBagIcon />} type="shopping" items={userShoppingList} aiItems={data?.shoppingList} />
              </div>
            )}

            {activeTab === 'expenses' && (
              <div className="space-y-6">
                <Card title="Log Expense" icon={<CurrencyIcon />}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Item (e.g., Dinner)" value={newExpense.item} onChange={e => setNewExpense({...newExpense, item: e.target.value})} className="col-span-2 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold" />
                      <input type="number" placeholder="Amount" value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} className="bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold" />
                      <input type="text" placeholder="CCY" value={newExpense.currency} onChange={e => setNewExpense({...newExpense, currency: e.target.value.toUpperCase()})} className="bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-black text-center" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setNewExpense({...newExpense, method: 'Credit Card'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${newExpense.method === 'Credit Card' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'}`}>
                        <CreditCardIcon className="w-3 h-3" /> CC
                      </button>
                      <button onClick={() => setNewExpense({...newExpense, method: 'Cash'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${newExpense.method === 'Cash' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'}`}>
                        <CashIcon className="w-3 h-3" /> Cash
                      </button>
                    </div>
                    <button onClick={addExpense} className="w-full bg-orange-600 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg">Add to Ledger</button>
                  </div>
                </Card>

                {expenses.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Transactions</h4>
                    {expenses.map(exp => (
                      <div key={exp.id} className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-sm group">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${exp.method === 'Cash' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                          {exp.method === 'Cash' ? <CashIcon className="w-5 h-5" /> : <CreditCardIcon className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 truncate">{exp.item}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase">{exp.date} • {exp.method}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-slate-900">{exp.amount} <span className="text-[10px] text-orange-500">{exp.currency}</span></p>
                          <button onClick={() => removeExpense(exp.id)} className="text-[8px] font-black text-red-300 uppercase hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Card title="Quick Converter" icon={<CurrencyIcon />}>
                  <div className="space-y-4">
                    <div className="flex gap-2 items-center">
                      <input type="number" value={converterAmount} onChange={e => setConverterAmount(Number(e.target.value))} className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold" />
                      <input type="text" value={fromCurrency} onChange={e => setFromCurrency(e.target.value.toUpperCase())} className="w-20 bg-slate-50 border-none rounded-xl px-4 py-3 text-center font-black" />
                      <span className="text-slate-300">→</span>
                      <input type="text" value={toCurrency} onChange={e => setToCurrency(e.target.value.toUpperCase())} className="w-20 bg-slate-50 border-none rounded-xl px-4 py-3 text-center font-black" />
                    </div>
                    <button onClick={convertCurrency} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest">Calculate</button>
                    {conversionResult !== null && <div className="text-center p-4 bg-orange-50 rounded-2xl font-black text-2xl text-orange-600">{conversionResult.toFixed(2)} {toCurrency}</div>}
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 ios-blur safe-bottom border-t border-slate-100 z-50">
        <div className="max-w-xl mx-auto flex justify-around px-2 py-3">
          <NavItem tab="overview" icon={<HomeIcon />} label="Home" />
          <NavItem tab="itinerary" icon={<MapPinIcon />} label="Plan" />
          <NavItem tab="hotel" icon={<HotelIcon />} label="Hotel" />
          <NavItem tab="expenses" icon={<CurrencyIcon />} label="Money" />
          <NavItem tab="lists" icon={<CheckIcon />} label="Lists" />
        </div>
      </nav>
    </div>
  );
};

export default App;
