import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal, Settings, Globe, Wifi, BatteryFull, Mail, Inbox, Send, Edit, Trash2, ArrowLeft, ChevronRight, KeyRound, UserPlus, LogOut, Image as ImageIcon, Store, ShoppingCart, PlusCircle, MinusCircle, Package, Search, ChevronDown } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// --- NUI Communication Functions ---

const isFiveM = typeof window.GetParentResourceName === 'function';

const mockMails = [
    { id: 1, sender_name: 'Browser Test Admin', subject: 'Welcome!', message: 'This is a test email for browser mode. <b>You can now use rich text!</b>', timestamp: new Date().toISOString(), is_read: false },
    { id: 2, sender_name: 'John Doe', subject: 'Meeting', message: 'Just a reminder about our meeting. <img src="https://picsum.photos/100/100" alt="example image" />', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), is_read: true },
];

const mockSystemItems = [
    { name: 'thermite', label: 'Thermite', price: 500, type: 'item', currency: 'PYC', stock: 20, image: 'https://cdn.nopixel.online/ext-images/inventory/images/thermite.png' },
    { name: 'weapon_pistol', label: 'Pistol', price: 8000, type: 'weapon', currency: 'Cash', stock: 20, image: 'https://cdn.nopixel.online/ext-images/inventory/images/weapon_pistol.png' },
    { name: 'trojan_usb', label: 'Trojan USB', price: 7500, type: 'item', currency: 'PYC', stock: 15, image: 'https://cdn.nopixel.online/ext-images/inventory/images/usb_device.png' },
    { name: 'advancedlockpick', label: 'Adv. Lockpick', price: 200, type: 'item', currency: 'PYC', stock: 50, image: 'https://cdn.nopixel.online/ext-images/inventory/images/advancedlockpick.png' },
];

const mockPlayerListedItems = [
     { listingId: 101, name: 'weapon_microsmg', label: 'Micro SMG', price: 35000, currency: 'Cash', image: 'https://cdn.nopixel.online/ext-images/inventory/images/weapon_microsmg.png', stock: 5, isPlayerListing: true, type: 'item' },
     { listingId: 102, name: 'weapon_pumpshotgun', label: 'Pump Shotgun', price: 28000, currency: 'Cash', image: 'https://cdn.nopixel.online/ext-images/inventory/images/weapon_pumpshotgun.png', stock: 1, isPlayerListing: true, type: 'item' },
];

const mockUserListings = [
    { id: 101, item: 'weapon_microsmg', seller_name: 'You', label: 'Micro SMG', price: 35000, currency: 'Cash', stock: 5, image: 'https://cdn.nopixel.online/ext-images/inventory/images/weapon_microsmg.png' },
    { id: 102, item: 'weapon_pumpshotgun', seller_name: 'You', label: 'Pump Shotgun', price: 28000, currency: 'Cash', stock: 1, image: 'https://cdn.nopixel.online/ext-images/inventory/images/weapon_pumpshotgun.png' },
];

const mockPlayerInventory = [
    { name: 'weapon_appistol', label: 'AP Pistol', count: 5, metadata: { quality: 100 }, image: 'https://cdn.nopixel.online/ext-images/inventory/images/weapon_appistol.png' },
    { name: 'lockpick', label: 'Lockpick', count: 50, metadata: {}, image: 'https://cdn.nopixel.online/ext-images/inventory/images/lockpick.png' },
    { name: 'radio', label: 'Radio', count: 1, metadata: {}, image: 'https://cdn.nopixel.online/ext-images/inventory/images/radio.png' },
];

const fetchNui = async (eventName, data = {}) => {
  if (!isFiveM) {
    console.log(`[BROWSER MODE] NUI Call: ${eventName}`, data);
    if (eventName === 'checkRegistration') {
        setTimeout(() => window.dispatchEvent(new MessageEvent('message', { data: { action: 'setAuthStatus', data: { isRegistered: true } } })), 500);
    } else if (eventName === 'loginAccount') {
        if (data.email === 'admin@pandamail.com' && data.password === 'admin') {
             setTimeout(() => window.dispatchEvent(new MessageEvent('message', { data: { action: 'loginSuccess', data: { email: data.email } } })), 1000);
        } else {
             setTimeout(() => window.dispatchEvent(new MessageEvent('message', { data: { action: 'authResponse', data: { success: false, message: 'Invalid credentials.' } } })), 1000);
        }
    } else if (eventName === 'registerAccount') {
         setTimeout(() => window.dispatchEvent(new MessageEvent('message', { data: { action: 'authResponse', data: { success: true, message: 'Registration successful!' } } })), 1000);
    } else if (eventName === 'getMails') {
        setTimeout(() => window.dispatchEvent(new MessageEvent('message', { data: { action: 'setMails', data: mockMails } })), 500);
    } else if (eventName === 'getMarketData') {
        const combinedListings = [...mockSystemItems, ...mockPlayerListedItems];
        
        setTimeout(() => window.dispatchEvent(new MessageEvent('message', {
            data: {
                action: 'setMarketData',
                data: {
                    listings: combinedListings,
                    userListings: mockUserListings, 
                    playerInventory: mockPlayerInventory,
                    balance: 263,
                    cash_balance: 1725592,
                    currency: 'PYC'
                }
            }
        })), 500);
    }
    return;
  }
  const resourceName = 'panda_laptop';
  await fetch(`https://${resourceName}/${eventName}`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(data),
  });
};

const closeNui = () => {
    if (!isFiveM) return;
    fetch(`https://panda_laptop/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({})
    });
};


// --- App Components (All defined in one file) ---

const TerminalApp = () => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([
    'Initializing PandaOS...',
    'Connection established.',
    'Welcome, user. Type "help" for a list of commands.',
  ]);
  const endOfHistory = useRef(null);
  const commands = {
    help: 'Available commands: help, clear, date, whoami',
    clear: () => { setHistory([]); return ''; },
    date: new Date().toLocaleString(),
    whoami: 'guest_user',
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      const newHistory = [...history, `> ${input}`];
      const command = input.toLowerCase().trim();
      if (command in commands) {
        const output = typeof commands[command] === 'function' ? commands[command]() : commands[command];
        if (output) newHistory.push(output);
      } else if (command !== '') {
        newHistory.push(`-bash: command not found: ${command}`);
      }
      setHistory(newHistory);
      setInput('');
    }
  };

  useEffect(() => {
    endOfHistory.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  return (
    <div className="bg-black/80 text-green-400 font-mono text-sm h-full p-2 flex flex-col" onClick={() => document.getElementById('terminal-input')?.focus()}>
      <div className="flex-grow overflow-y-auto">
        {history.map((line, index) => <p key={index} className="whitespace-pre-wrap">{line}</p>)}
        <div ref={endOfHistory} />
      </div>
      <div className="flex items-center">
        <span className="text-green-400 mr-2">&gt;</span>
        <input id="terminal-input" type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleInputKeyDown} className="bg-transparent border-none text-green-400 focus:outline-none w-full" autoFocus />
      </div>
    </div>
  );
};

const SettingsApp = () => {
    const [wifi, setWifi] = useState(true);
    return (
        <div className="bg-slate-900/80 backdrop-blur-sm text-white p-6 h-full text-sm">
            <h2 className="text-xl font-bold mb-6">System Settings</h2>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-3">
                        <Wifi size={20} className={wifi ? 'text-blue-400' : 'text-gray-500'}/>
                        <span>Wi-Fi</span>
                    </label>
                    <button onClick={() => setWifi(!wifi)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${wifi ? 'bg-blue-600' : 'bg-gray-700'}`}>
                         <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${wifi ? 'translate-x-6' : 'translate-x-1'}`}/>
                    </button>
                </div>
            </div>
        </div>
    );
};

const BrowserApp = () => {
  return (
    <div className="h-full flex flex-col bg-gray-800">
        <div className="bg-gray-900 p-2 flex items-center">
             <input type="text" value="https://www.google.com/webhp?igu=1" readOnly className="bg-gray-700 text-white rounded-md px-3 py-1 text-sm w-full focus:outline-none" />
        </div>
      <iframe src="https://www.google.com/webhp?igu=1" className="w-full h-full border-none" title="Browser"></iframe>
    </div>
  );
};

// *** NEW COMPONENT ***
// This is the modal for removing a partial quantity of an item
const RemoveQuantityModal = ({ isOpen, onClose, item, onConfirm }) => {
    const [quantity, setQuantity] = useState(1);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setQuantity(1); // Reset to 1 every time it opens
            const timeoutId = setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [isOpen]);

    const handleConfirm = () => {
        const numQuantity = Number(quantity);
        if (numQuantity > 0 && numQuantity <= item.stock) {
            onConfirm(item.id, numQuantity);
            onClose();
        }
    };

    if (!isOpen || !item) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-md w-full border border-gray-700">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                    Remove Stock
                </h3>
                <p className="text-gray-300 mb-4">How many <span className="font-bold text-white">{item.label}</span> do you want to remove from this listing?</p>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="removeQuantity" className="block text-sm font-medium text-gray-300 mb-1">
                            Quantity (Max: {item.stock})
                        </label>
                        <input
                            id="removeQuantity"
                            ref={inputRef}
                            type="number"
                            value={quantity}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                if (val > item.stock) {
                                    setQuantity(item.stock);
                                } else if (val < 1) {
                                    setQuantity(1);
                                } else {
                                    setQuantity(val);
                                }
                            }}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
                            min="1"
                            max={item.stock}
                            className="w-full p-2 bg-gray-900 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500 text-white"
                        />
                    </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white font-semibold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-semibold transition-colors"
                    >
                        Remove {quantity}
                    </button>
                </div>
            </div>
        </div>
    );
};


const BlackMarketApp = () => {
    const [view, setView] = useState('market');
    const [previousView, setPreviousView] = useState('market');
    const [marketItems, setMarketItems] = useState([]);
    const [userListings, setUserListings] = useState([]);
    const [playerInventory, setPlayerInventory] = useState([]);
    const [itemsToSell, setItemsToSell] = useState([]);
    const [cart, setCart] = useState({});
    const [balance, setBalance] = useState(0);
    const [cashBalance, setCashBalance] = useState(0);
    const [currency, setCurrency] = useState('PYC');
    const [searchTerm, setSearchTerm] = useState('');
    const [isOverflowing, setIsOverflowing] = useState(false);
    const scrollContainerRef = useRef(null);
    
    // *** NEW STATE ***
    const [itemToRemove, setItemToRemove] = useState(null); // This will hold the item for the modal

    const filteredItems = marketItems.filter(item => 
        item && item.label && item.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const checkOverflow = () => {
            const element = scrollContainerRef.current;
            if (element) setIsOverflowing(element.scrollHeight > element.clientHeight);
        };
        const timer = setTimeout(checkOverflow, 50);
        return () => clearTimeout(timer);
    }, [filteredItems]);

    const handleNuiMessage = useCallback((event) => {
        const { action, data, balances } = event.data;
        if (action === 'setMarketData') {
            setMarketItems(data.listings || []);
            setUserListings(data.userListings || []);
            setPlayerInventory(data.playerInventory || []);
            setBalance(data.balance || 0);
            setCashBalance(data.cash_balance || 0);
            setCurrency(data.currency || 'PYC');
        } else if (action === 'updateBalances') {
            setBalance(balances.pyc || 0);
            setCashBalance(balances.cash || 0);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('message', handleNuiMessage);
        fetchNui('getMarketData');
        return () => window.removeEventListener('message', handleNuiMessage);
    }, [handleNuiMessage]);

    const navigateTo = (newView) => {
        setPreviousView(view);
        setView(newView);
    }

    const handleAddItemToSell = (item) => setItemsToSell(prev => [...prev, { ...item, price: 1, quantity: 1, currency: 'PYC', uniqueId: Date.now() }]);
    const handleRemoveItemFromSell = (uniqueId) => setItemsToSell(prev => prev.filter(p => p.uniqueId !== uniqueId));

    const updateSellItem = (uniqueId, field, value) => {
        setItemsToSell(prev => prev.map(item => {
            if (item.uniqueId === uniqueId) {
                let updatedValue = value;
                if (field === 'quantity') updatedValue = Math.max(1, Math.min(Number(value) || 0, item.count));
                else if (field === 'price') updatedValue = Math.max(1, Number(value) || 0);
                return { ...item, [field]: updatedValue };
            }
            return item;
        }));
    };

    const handlePostListings = async () => {
        const itemsToPost = itemsToSell.map(item => ({
            name: item.name,
            label: item.label,
            price: item.price,
            quantity: item.quantity,
            currency: item.currency,
            metadata: item.metadata,
        }));
        await fetchNui('postNewListings', { items: itemsToPost });
        setItemsToSell([]);
        navigateTo('market');
    };

    const getCartKey = (item) => {
        if (item.isPlayerListing) {
            return `player-${item.listingId}`;
        }
        return `system-${item.name}-${JSON.stringify(item.metadata || {})}`;
    };

    const addToCart = (item) => {
        const cartKey = getCartKey(item);
        const currentQuantityInCart = cart[cartKey]?.quantity || 0;
        if (currentQuantityInCart >= item.stock) return;
        setCart(prev => ({ ...prev, [cartKey]: { ...item, quantity: currentQuantityInCart + 1 } }));
    };
    
    const updateCartQuantity = (item, amount) => {
        const cartKey = getCartKey(item);
        const itemInMarket = marketItems.find(i => getCartKey(i) === cartKey);
        const stockLimit = itemInMarket ? itemInMarket.stock : item.quantity;

        setCart(prev => {
            const newCart = { ...prev };
            const currentQuantity = newCart[cartKey]?.quantity || 0;
            const newQuantity = Math.max(0, Math.min(stockLimit, currentQuantity + amount));
            if (newQuantity === 0) delete newCart[cartKey];
            else newCart[cartKey].quantity = newQuantity;
            return newCart;
        });
    };

    const handlePurchase = () => {
        fetchNui('buyMarketItems', Object.values(cart)).then(() => setCart({}));
    };

    const handleRemoveListingClick = (item) => {
        if (item.stock > 1) {
            setItemToRemove(item); 
        } else {
            fetchNui('removeUserListing', { id: item.id, quantity: 1, removeAll: true });
        }
    };

    const handleConfirmPartialRemove = (listingId, quantity) => {
        fetchNui('removeUserListing', { id: listingId, quantity: quantity, removeAll: false });
        setItemToRemove(null); // Close the modal
    };
    
    // *** END OF NEW/CHANGED FUNCTIONS ***

    const renderMarket = () => (
        <div className="flex flex-col h-full bg-slate-900 text-white">
            <header className="flex-shrink-0 grid grid-cols-3 items-center p-3 border-b border-gray-700">
                <div className="text-left flex items-center space-x-4">
                    <p className="text-sm font-semibold">
                        <span className="text-gray-400">PYC: </span>
                        <span className="text-blue-400">{balance.toLocaleString()}</span>
                    </p>
                    <p className="text-sm font-semibold">
                        <span className="text-gray-400">Cash: </span>
                        <span className="text-green-400">${cashBalance.toLocaleString()}</span>
                    </p>
                </div>
                <div className="flex justify-center items-center bg-gray-800 rounded-md px-2">
                    <Search size={18} className="text-gray-500"/>
                    <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-transparent w-full p-1.5 text-sm focus:outline-none"/>
                </div>
                <div className="flex items-center justify-end space-x-3">
                    <button onClick={() => navigateTo('manage')} className="bg-gray-700/50 px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-gray-600/50">Manage</button>
                    <button onClick={() => navigateTo('cart')} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-3 rounded-md transition-colors">
                        <ShoppingCart className="mr-2" size={16}/> Cart ({Object.values(cart).length})
                    </button>
                </div>
            </header>
            <main ref={scrollContainerRef} className={`flex-grow overflow-y-auto p-4 ${!isOverflowing ? 'relative' : ''}`}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filteredItems.map(item => {
                        const isOwnItem = item.isPlayerListing && userListings.some(ownListing => ownListing.id === item.listingId);

                        return (
                            <div key={getCartKey(item)} className="bg-gray-800/80 rounded-lg flex flex-col border border-gray-700/50 group">
                                <div className="w-full h-28 bg-gray-900/50 rounded-t-lg flex items-center justify-center p-2 relative">
                                    <img src={item.image} alt={item.label} className="max-w-full max-h-full object-contain" onError={(e) => { e.target.style.display = 'none' }}/>
                                    <button 
                                        onClick={() => addToCart(item)} 
                                        disabled={isOwnItem || !item.stock || item.stock <= (cart[getCartKey(item)]?.quantity || 0)} 
                                        className="absolute top-2 right-2 p-1.5 rounded-full bg-green-500/80 hover:bg-green-600 text-white transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 disabled:bg-gray-500 disabled:cursor-not-allowed" 
                                        title={isOwnItem ? "You cannot buy your own item" : "Add to Cart"}
                                    >
                                        <PlusCircle size={16} />
                                    </button>
                                </div>
                                <div className="p-3">
                                    <h3 className="font-bold text-base truncate">{item.label}</h3>
                                    <p className="text-sm text-gray-400">{item.currency === 'Cash' ? '$' : ''}{item.price.toLocaleString()} {item.currency !== 'Cash' ? item.currency : ''}</p>
                                    <p className={`text-xs font-bold mt-1 ${!item.stock ? 'text-red-500' : item.stock > 10 ? 'text-green-400' : 'text-yellow-400'}`}>
                                        {item.stock > 0 ? `Stock: ${item.stock}` : 'Out of Stock'}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
                {!isOverflowing && (
                    <button onClick={() => navigateTo('sell')} className="absolute bottom-6 right-6 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700 transition-transform hover:scale-105">
                        <PlusCircle size={24}/>
                    </button>
                )}
            </main>
        </div>
    );

    const renderCartView = () => {
        const subtotalPYC = Object.values(cart).filter(item => item.currency === 'PYC').reduce((total, item) => total + (item.price * item.quantity), 0);
        const subtotalCash = Object.values(cart).filter(item => item.currency === 'Cash').reduce((total, item) => total + (item.price * item.quantity), 0);
        
        const marketFeePYC = Math.ceil(Object.values(cart).filter(item => item.currency === 'PYC').reduce((total, item) => total + (item.price * item.quantity * 0.05), 0));
        const marketFeeCash = Math.ceil(Object.values(cart).filter(item => item.currency === 'Cash').reduce((total, item) => total + (item.price * item.quantity * 0.05), 0));

        const finalTotalPYC = subtotalPYC + marketFeePYC;
        const finalTotalCash = subtotalCash + marketFeeCash;
        const cartItems = Object.values(cart);

        return (
            <div className="flex flex-col h-full bg-slate-900 text-white">
                <header className="flex items-center p-3 border-b border-gray-700">
                    <button onClick={() => navigateTo('market')} className="p-2 rounded-full hover:bg-gray-700/50 mr-4"> <ArrowLeft size={20}/> </button>
                    <h2 className="text-xl font-bold flex items-center"><ShoppingCart className="mr-3" size={24}/> Your Cart</h2>
                    <button onClick={() => setCart({})} className="ml-auto bg-red-600/80 hover:bg-red-600 text-white font-semibold py-1.5 px-3 rounded-md transition-colors">Empty Cart</button>
                </header>
                <div className="flex-grow flex p-4 overflow-hidden">
                    <div className="w-2/3 pr-4 overflow-y-auto">
                        {cartItems.length === 0 ? ( <p className="text-center text-gray-400 p-8">Your cart is empty.</p> ) : (
                            cartItems.map(item => (
                                <div key={getCartKey(item)} className="flex items-center justify-between p-3 bg-gray-800/80 rounded-lg mb-3 border border-gray-700/50">
                                    <div className="flex items-center">
                                        <img src={item.image} alt={item.label} className="w-14 h-14 object-contain mr-4 bg-gray-900/50 p-1 rounded-md" />
                                        <div>
                                            <p className="font-bold">{item.label}</p>
                                            <p className="text-sm text-gray-400">{item.currency === 'Cash' ? '$' : ''}{item.price.toLocaleString()} {item.currency !== 'Cash' ? item.currency : ''}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <button onClick={() => updateCartQuantity(item, -1)} className="p-1 rounded-full bg-gray-600 hover:bg-gray-700"><MinusCircle size={18}/></button>
                                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                                        <button onClick={() => updateCartQuantity(item, 1)} className="p-1 rounded-full bg-gray-600 hover:bg-gray-700"><PlusCircle size={18}/></button>
                                        <button onClick={() => updateCartQuantity(item, -item.quantity)} className="p-2 rounded-full text-red-400 hover:bg-red-500 hover:text-white"><Trash2 size={18}/></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="w-1/3 pl-4 border-l border-gray-700">
                         <div className="bg-gray-800/80 rounded-lg p-4">
                             <h3 className="text-lg font-bold mb-4">Order Summary</h3>
                             <div className="space-y-2 text-sm">
                                {subtotalCash > 0 && (<>
                                    <div className="flex justify-between"><span>Subtotal (Cash)</span> <span>${subtotalCash.toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span>Market Fee (Cash)</span> <span>${marketFeeCash.toLocaleString()}</span></div>
                                </>)}
                                {subtotalPYC > 0 && (<>
                                    <div className="flex justify-between"><span>Subtotal (PYC)</span> <span>{subtotalPYC.toLocaleString()} PYC</span></div>
                                    <div className="flex justify-between"><span>Market Fee (PYC)</span> <span>{marketFeePYC.toLocaleString()} PYC</span></div>
                                </>)}
                                <div className="border-t border-gray-600 pt-2 mt-2"></div>
                                {finalTotalCash > 0 && <div className="flex justify-between font-bold text-base"><span>Total (Cash)</span> <span>${finalTotalCash.toLocaleString()}</span></div>}
                                {finalTotalPYC > 0 && <div className="flex justify-between font-bold text-base"><span>Total (PYC)</span> <span>{finalTotalPYC.toLocaleString()} PYC</span></div>}
                             </div>
                             <button onClick={handlePurchase} disabled={cartItems.length === 0} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                                 Checkout now
                             </button>
                          </div>
                    </div>
                </div>
            </div>
    )};
    
    const renderManageView = () => (
        <div className="flex flex-col h-full bg-slate-900 text-white">
            <header className="flex items-center justify-between p-3 border-b border-gray-700 flex-shrink-0">
                <div className="flex items-center">
                    <button onClick={() => navigateTo('market')} className="p-2 rounded-full hover:bg-gray-700/50 mr-4">
                        <ArrowLeft size={20}/>
                    </button>
                    <h2 className="text-xl font-bold">Manage items <span className="text-gray-400">{userListings.length}</span></h2>
                </div>
                <p className="font-semibold">{currency}: {balance.toLocaleString()}</p>
            </header>
            <main className="flex-grow overflow-y-auto p-4">
                <div className="space-y-3">
                    {userListings.length > 0 ? userListings.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-800/80 rounded-lg border border-gray-700/50">
                            <div className="flex items-center">
                                <img src={item.image} alt={item.label} className="w-14 h-14 object-contain mr-4 bg-gray-900/50 p-1 rounded-md" />
                                <div>
                                    <p className="font-bold">{item.label} <span className='text-sm text-gray-400'>x{item.stock}</span></p> 
                                    <p className="text-sm text-gray-400">{item.seller_name || 'Unknown Seller'}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-6">
                                <p className="font-semibold">{item.price.toLocaleString()} {item.currency} <span className="text-xs text-gray-400">(each)</span></p>
                                
                                {/* *** THIS BUTTON IS NOW FIXED *** */}
                                <button onClick={() => handleRemoveListingClick(item)} className="bg-red-500/80 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-md transition-colors text-sm">
                                    Remove
                                </button>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-gray-400 p-8">You have no items listed for sale.</p>
                    )}
                </div>
            </main>
        </div>
    );
    
    const renderSellView = () => {
            const availableInventory = playerInventory.filter(invItem => 
                !itemsToSell.some(sellItem => 
                    sellItem.name === invItem.name && 
                    JSON.stringify(sellItem.metadata || {}) === JSON.stringify(invItem.metadata || {})
                )
            );
            
            const pycFee = itemsToSell.filter(item => item.currency === 'PYC').reduce((acc, item) => acc + (item.price * item.quantity * 0.05), 0);
            const cashFee = itemsToSell.filter(item => item.currency === 'Cash').reduce((acc, item) => acc + (item.price * item.quantity * 0.05), 0);

            return (
                <div className="flex flex-col h-full bg-slate-900 text-white">
                    <header className="flex items-center justify-between p-3 border-b border-gray-700 flex-shrink-0">
                        <div className="flex items-center">
                            <button onClick={() => navigateTo(previousView)} className="p-2 rounded-full hover:bg-gray-700/50 mr-4"><ArrowLeft size={20}/></button>
                            <h2 className="text-xl font-bold">Sell your items <span className="text-gray-400">{itemsToSell.length}</span></h2>
                        </div>
                        <p className="font-semibold">Balance: {balance.toLocaleString()}</p>
                    </header>
                    <main className="flex-grow flex p-4 overflow-hidden gap-4">
                    <div className="w-2/3 flex flex-col space-y-3 pr-2 overflow-y-auto">
                        {itemsToSell.map(item => (
                            <div key={item.uniqueId} className="flex items-center justify-between p-3 bg-gray-800/80 rounded-lg border border-gray-700/50">
                                <div className="flex items-center">
                                    <img src={item.image || './images/default.png'} alt={item.label} className="w-14 h-14 object-contain mr-4 bg-gray-900/50 p-1 rounded-md" />
                                    <div>
                                        <p className="font-bold">{item.label}</p>
                                        {item.metadata?.quality && <p className="text-sm text-gray-400">Quality: {item.metadata.quality}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <input type="number" value={item.price} onChange={e => updateSellItem(item.uniqueId, 'price', e.target.value)} className="w-24 p-2 bg-black/30 rounded-md border border-white/20 text-center" placeholder="Price"/>
                                        <div className="flex rounded-md bg-black/30 border border-white/20 p-0.5">
                                            <button onClick={() => updateSellItem(item.uniqueId, 'currency', 'PYC')} className={`px-2 py-1 text-xs font-bold rounded ${item.currency === 'PYC' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>PYC</button>
                                            <button onClick={() => updateSellItem(item.uniqueId, 'currency', 'Cash')} className={`px-2 py-1 text-xs font-bold rounded ${item.currency === 'Cash' ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>Cash</button>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <button onClick={() => updateSellItem(item.uniqueId, 'quantity', item.quantity - 1)} className="p-1 rounded-full bg-gray-600 hover:bg-gray-700"><MinusCircle size={18}/></button>
                                        <div className="relative w-20 text-center">
                                            <input type="number" value={item.quantity} onChange={e => updateSellItem(item.uniqueId, 'quantity', e.target.value)} className="w-full bg-transparent text-center font-semibold pr-4"/>
                                            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-gray-500">/ {item.count}</span>
                                        </div>
                                        <button onClick={() => updateSellItem(item.uniqueId, 'quantity', item.quantity + 1)} className="p-1 rounded-full bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled={item.quantity >= item.count}><PlusCircle size={18}/></button>
                                    </div>
                                    <button onClick={() => handleRemoveItemFromSell(item.uniqueId)} className="p-2 rounded-full text-red-400 hover:bg-red-500 hover:text-white"><Trash2 size={18}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="w-1/3 flex flex-col border-l border-gray-700 pl-4">
                        <h3 className="text-lg font-bold mb-3">Items available to sell <span className="text-gray-400">{availableInventory.length}</span></h3>
                        <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                            {availableInventory.map(item => (
                                <div key={`${item.name}-${JSON.stringify(item.metadata || {})}`} className="flex items-center justify-between p-2 bg-gray-800/80 rounded-lg">
                                    <div className="flex items-center">
                                        <img src={item.image || './images/default.png'} alt={item.label} className="w-12 h-12 object-contain mr-3 bg-gray-900/50 p-1 rounded-md" />
                                        <div>
                                            <p className="font-semibold">{item.label} <span className='text-sm text-gray-400'>x{item.count}</span></p> 
                                            {item.metadata?.quality && <p className="text-xs text-gray-400">Quality: {item.metadata.quality}</p>}
                                        </div>
                                    </div>
                                    <button onClick={() => handleAddItemToSell(item)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-md text-sm">+ Add</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
                <footer className="flex justify-end items-center p-3 border-t border-gray-700">
                    <div className="flex items-center space-x-4">
                        {itemsToSell.length > 0 && (
                            <p className="text-sm">
                                <span className="text-gray-400">Market Fee:</span>
                                {pycFee > 0 && <span className="font-bold text-blue-400 ml-2">{pycFee.toFixed(0)} PYC</span>}
                                {cashFee > 0 && <span className="font-bold text-green-400 ml-2">${cashFee.toFixed(0)}</span>}
                            </p>
                        )}
                        <button onClick={handlePostListings} disabled={itemsToSell.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                            List Items
                        </button>
                    </div>
                </footer>
            </div>
        );
    };
    
    return (
        <div className="h-full relative">
            {view === 'market' && renderMarket()}
            {view === 'cart' && renderCartView()}
            {view === 'manage' && renderManageView()}
            {view === 'sell' && renderSellView()}

            {/* *** THIS IS THE NEW MODAL *** */}
            <RemoveQuantityModal
                isOpen={!!itemToRemove}
                onClose={() => setItemToRemove(null)}
                item={itemToRemove}
                onConfirm={handleConfirmPartialRemove}
            />
        </div>
    );
};

const MailApp = ({ mailDomain }) => { // <-- Receive mailDomain as a prop
  const [authState, setAuthState] = useState('loading');
  const [userEmail, setUserEmail] = useState('');
  const [authMessage, setAuthMessage] = useState({ text: '', type: '' });

  const handleNuiMessage = (event) => {
    const { action, data } = event.data;
    switch(action) {
      case 'setAuthStatus':
        setAuthState(data.isRegistered ? 'login' : 'register');
        break;
      case 'loginSuccess':
        setUserEmail(data.email);
        setAuthState('mail_client');
        setAuthMessage({ text: '', type: '' });
        break;
      case 'authResponse':
        setAuthMessage({
            text: data.message,
            type: data.success ? 'success' : 'error'
        });
        if (data.success) { // If registration is successful, switch to login screen
            setTimeout(() => {
                setAuthState('login');
                setAuthMessage({ text: data.message, type: 'success' }); // Keep message for login screen
            }, 1500);
        }
        break;
    }
  };

  useEffect(() => {
    window.addEventListener('message', handleNuiMessage);
    fetchNui('checkRegistration');
    return () => window.removeEventListener('message', handleNuiMessage);
  }, []);
  
  const handleLogout = () => {
      setAuthState('login');
      setUserEmail('');
      setAuthMessage({ text: '', type: '' });
  }

  const renderContent = () => {
    switch(authState) {
        case 'loading':
            return <div className="h-full flex items-center justify-center"><p>Loading Account...</p></div>;
        case 'login':
            return <AuthScreen authView="login" setAuthView={setAuthState} authMessage={authMessage} setAuthMessage={setAuthMessage} mailDomain={mailDomain} />;
        case 'register':
            return <AuthScreen authView="register" setAuthView={setAuthState} authMessage={authMessage} setAuthMessage={setAuthMessage} mailDomain={mailDomain} />;
        case 'mail_client':
            return <MailClient userEmail={userEmail} onLogout={handleLogout} />;
        default:
            return null;
    }
  }

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm text-white h-full text-sm">
      {renderContent()}
    </div>
  );
}

const AuthScreen = ({ authView, setAuthView, authMessage, setAuthMessage, mailDomain }) => {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8">
            <Mail size={48} className="text-blue-400 mb-6" />
            {authView === 'login' ? 
                <LoginForm setAuthView={setAuthView} authMessage={authMessage} setAuthMessage={setAuthMessage} /> : 
                <RegisterForm setAuthView={setAuthView} authMessage={authMessage} setAuthMessage={setAuthMessage} mailDomain={mailDomain} />}
        </div>
    );
};

const LoginForm = ({ setAuthView, authMessage, setAuthMessage }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        setAuthMessage({ text: '', type: '' });
        if (!email || !password) {
            setAuthMessage({ text: 'Please enter both email and password.', type: 'error' });
            return;
        }
        setAuthMessage({ text: 'Verifying...', type: 'info' });
        fetchNui('loginAccount', { email, password });
    };

    const handleEmailChange = (e) => {
        if (authMessage.text) setAuthMessage({ text: '', type: '' });
        setEmail(e.target.value);
    }
    const handlePasswordChange = (e) => {
        if (authMessage.text) setAuthMessage({ text: '', type: '' });
        setPassword(e.target.value);
    }

    return (
        <div className="w-full max-w-sm text-center">
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-white/60 mb-8">Log in to your Panda Mail account.</p>
            <form onSubmit={handleLogin} className="space-y-4">
                <input type="email" placeholder="Email Address" value={email} onChange={handleEmailChange} className="w-full p-3 bg-black/30 rounded-md border border-white/20 focus:outline-none focus:border-blue-500" />
                <input type="password" placeholder="Password" value={password} onChange={handlePasswordChange} className="w-full p-3 bg-black/30 rounded-md border border-white/20 focus:outline-none focus:border-blue-500" />
                <button type="submit" className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                    <KeyRound className="mr-2" size={16}/> Log In
                </button>
                {authMessage.text && <p className={`text-sm mt-2 ${authMessage.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{authMessage.text}</p>}
            </form>
            <p className="mt-6 text-sm text-white/60">
                Don't have an account?{' '}
                <button onClick={() => { setAuthView('register'); setAuthMessage({ text: '', type: ''}); }} className="font-semibold text-blue-400 hover:underline">Register here</button>
            </p>
        </div>
    );
};

const RegisterForm = ({ setAuthView, authMessage, setAuthMessage, mailDomain }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleRegister = (e) => {
        e.preventDefault();
        setAuthMessage({ text: '', type: '' });
        if (!email || !password || !confirmPassword) {
            setAuthMessage({ text: 'Please fill out all fields.', type: 'error' }); return;
        }
        if (!email.includes(mailDomain)) {
            setAuthMessage({ text: `Email must end with ${mailDomain}`, type: 'error' }); return;
        }
        if (password !== confirmPassword) {
            setAuthMessage({ text: 'Passwords do not match.', type: 'error' }); return;
        }
        setAuthMessage({ text: 'Creating account...', type: 'info' });
        fetchNui('registerAccount', { email, password });
    };
    
    const onInputChange = (setter) => (e) => {
        if (authMessage.text) setAuthMessage({ text: '', type: '' });
        setter(e.target.value);
    }

    return (
        <div className="w-full max-w-sm text-center">
            <h1 className="text-3xl font-bold mb-2">Create Account</h1>
            <p className="text-white/60 mb-8">Emails must end with <span className='font-bold text-white'>{mailDomain}</span></p>
            <form onSubmit={handleRegister} className="space-y-4">
                <input type="email" placeholder={`your-name${mailDomain}`} value={email} onChange={onInputChange(setEmail)} className="w-full p-3 bg-black/30 rounded-md border border-white/20 focus:outline-none focus:border-blue-500" />
                <input type="password" placeholder="Password" value={password} onChange={onInputChange(setPassword)} className="w-full p-3 bg-black/30 rounded-md border border-white/20 focus:outline-none focus:border-blue-500" />
                <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={onInputChange(setConfirmPassword)} className="w-full p-3 bg-black/30 rounded-md border border-white/20 focus:outline-none focus:border-blue-500" />
                <button type="submit" className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                    <UserPlus className="mr-2" size={16}/> Create Account
                </button>
                {authMessage.text && <p className={`text-sm mt-2 ${authMessage.type === 'error' ? 'text-red-400' : authMessage.type === 'success' ? 'text-green-400' : 'text-white/60'}`}>{authMessage.text}</p>}
            </form>
            <p className="mt-6 text-sm text-white/60">
                Already have an account?{' '}
                <button onClick={() => { setAuthView('login'); setAuthMessage({ text: '', type: ''}); }} className="font-semibold text-blue-400 hover:underline">Log in here</button>
            </p>
        </div>
    );
}

const ImageUrlModal = ({ isOpen, onClose, onConfirm }) => {
    const [url, setUrl] = useState('');
    const [altText, setAltText] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setUrl('');
            setAltText('');
            const timeoutId = setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (url.trim()) {
            onConfirm(url.trim(), altText.trim());
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-md w-full border border-gray-700">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                    <ImageIcon size={20} className="mr-2"/> Insert Image
                </h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-300 mb-1">Image URL</label>
                        <input
                            id="imageUrl"
                            ref={inputRef}
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
                            placeholder="e.g., https://example.com/image.jpg"
                            className="w-full p-2 bg-gray-900 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500 text-white"
                        />
                    </div>
                    <div>
                        <label htmlFor="altText" className="block text-sm font-medium text-gray-300 mb-1">Alt Text (Optional)</label>
                        <input
                            id="altText"
                            type="text"
                            value={altText}
                            onChange={(e) => setAltText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
                            placeholder="Description for accessibility"
                            className="w-full p-2 bg-gray-900 rounded-md border border-gray-700 focus:outline-none focus:border-blue-500 text-white"
                        />
                    </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white font-semibold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-semibold transition-colors"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

const MailClient = ({ userEmail, onLogout }) => {
  const [mails, setMails] = useState([]);
  const [currentView, setCurrentView] = useState('inbox');
  const [selectedMail, setSelectedMail] = useState(null);
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
  const quillRef = useRef(null);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const imageHandler = useCallback(() => {
    setIsImageModalOpen(true);
  }, []);

  const quillModules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler,
      },
    },
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image'
  ];

  const handleNuiMessage = (event) => {
    const { action, data } = event.data;
    if (action === 'setMails') {
      setMails(data || []);
    } else if (action === 'mailSendStatus') {
        setStatusMessage({ text: data.message, type: data.success ? 'success' : 'error' });
        if (data.success) {
            setTimeout(() => {
                setCurrentView('inbox');
                resetComposeForm();
                fetchNui('getMails');
            }, 2000);
        }
    }
  };
  
  useEffect(() => {
    window.addEventListener('message', handleNuiMessage);
    fetchNui('getMails');
    return () => window.removeEventListener('message', handleNuiMessage);
  }, []);
  
  const resetComposeForm = () => {
      setRecipient(''); 
      setSubject(''); 
      setMessage(''); 
      setStatusMessage({ text: '', type: '' });
  };

  const openMail = (mail) => {
    setSelectedMail(mail); setCurrentView('read');
    if (!mail.is_read) {
        fetchNui('markAsRead', { id: mail.id });
        setMails(mails.map(m => m.id === mail.id ? { ...m, is_read: true } : m));
    }
  };
  
  const handleDeleteMail = (mailId) => {
      fetchNui('deleteMail', { id: mailId });
      setMails(prev => prev.filter(m => m.id !== mailId));
      setCurrentView('inbox');
  };

  const handleSendMail = (e) => {
      e.preventDefault();
      if (!recipient || !subject || !message) {
          setStatusMessage({ text: 'Recipient, Subject, and Message are required.', type: 'error' }); return;
      }
      setStatusMessage({ text: 'Sending...', type: 'info' });
      fetchNui('sendMail', { recipient_email: recipient, subject, message });
  };

  const insertImageIntoEditor = (url, altText = '') => {
    const editor = quillRef.current?.getEditor();
    if (editor) {
        const range = editor.getSelection(true);
        editor.insertEmbed(range.index, 'image', url);
        // Set alt text if provided
        if (altText) {
            const [imageNode] = editor.getLeaf(range.index + 1);
            if (imageNode && imageNode.domNode.tagName === 'IMG') {
                imageNode.domNode.setAttribute('alt', altText);
            }
        }
        editor.setSelection(range.index + 1);
    }
  };


  const renderInbox = () => (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b border-white/10">
        <div className='flex items-center'>
            <Inbox className="mr-3" size={24}/>
            <div>
                <h2 className="text-xl font-bold">Inbox</h2>
                <p className='text-xs text-white/50'>{userEmail}</p>
            </div>
        </div>
        <div className="flex items-center space-x-4">
            <button onClick={() => setCurrentView('compose')} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                <Edit className="mr-2" size={16}/> Compose
            </button>
            <button onClick={onLogout} className="text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/10">
                <LogOut size={20}/>
            </button>
        </div>
      </header>
      <div className="flex-grow overflow-y-auto">
        {mails.length === 0 ? <p className="text-center text-gray-400 p-8">Your inbox is empty.</p> : (
            <ul>
                {mails.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(mail => (
                    <li key={mail.id} onClick={() => openMail(mail)} className={`flex items-center justify-between p-4 border-b border-white/10 cursor-pointer hover:bg-white/5 ${mail.is_read ? 'text-gray-400' : 'text-white font-bold'}`}>
                        <div className="flex items-center overflow-hidden">
                           <div className={`w-2 h-2 rounded-full flex-shrink-0 mr-4 ${mail.is_read ? 'bg-transparent' : 'bg-blue-500'}`}></div>
                            <p className="w-48 truncate flex-shrink-0">{mail.sender_name}</p>
                            <p className="flex-grow truncate px-4">{mail.subject}</p>
                        </div>
                        <div className="flex items-center text-gray-500 text-sm flex-shrink-0">
                            <span>{new Date(mail.timestamp).toLocaleDateString()}</span> <ChevronRight size={20} />
                        </div>
                    </li>
                ))}
            </ul>
        )}
      </div>
    </div>
  );

  const renderReadMail = () => (
    <div className="flex flex-col h-full">
      <header className="flex items-center p-4 border-b border-white/10">
        <button onClick={() => setCurrentView('inbox')} className="p-2 rounded-full hover:bg-white/10"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-bold ml-4 truncate">{selectedMail.subject}</h2>
      </header>
      <div className="p-4 border-b border-white/10">
          <p><strong>From:</strong> {selectedMail.sender_name} ({selectedMail.sender_email})</p>
          <p className="text-gray-400 text-sm"><strong>To:</strong> You ({userEmail})</p>
      </div>
      <div className="flex-grow p-4 overflow-y-auto">
        <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: selectedMail.message }} />
      </div>
      <footer className="p-4 border-t border-white/10">
          <button onClick={() => handleDeleteMail(selectedMail.id)} className="flex items-center bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"> <Trash2 className="mr-2" size={16}/> Delete </button>
      </footer>
    </div>
  );

  const renderComposeMail = () => (
    <div className="flex flex-col h-full">
        <header className="flex items-center p-4 border-b border-white/10">
            <button onClick={() => { setCurrentView('inbox'); resetComposeForm(); }} className="p-2 rounded-full hover:bg-white/10"><ArrowLeft size={20}/></button>
            <h2 className="text-xl font-bold ml-4">Compose New Mail</h2>
        </header>
        <form onSubmit={handleSendMail} className="flex-grow flex flex-col p-4 space-y-4">
            <input type="email" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="Recipient's Email Address" className="w-full p-2 bg-black/30 rounded-md border border-white/20 focus:outline-none focus:border-blue-500"/>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" className="w-full p-2 bg-black/30 rounded-md border border-white/20 focus:outline-none focus:border-blue-500"/>
            
            <div className="flex-grow relative quill-editor-container">
                <ReactQuill 
                    ref={quillRef}
                    theme="snow" 
                    value={message} 
                    onChange={setMessage} 
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Your message..."
                    className="h-full bg-black/30 text-white rounded-md focus:outline-none focus:border-blue-500"
                />
            </div>
            
            <div className="flex items-center justify-between pt-4">
                <button type="submit" className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"> <Send className="mr-2" size={16}/> Send Mail </button>
                {statusMessage.text && <p className={`text-sm ${statusMessage.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{statusMessage.text}</p>}
            </div>
        </form>
        <ImageUrlModal
            isOpen={isImageModalOpen}
            onClose={() => setIsImageModalOpen(false)}
            onConfirm={insertImageIntoEditor}
        />
    </div>
  );

  return (
    <>
      {currentView === 'inbox' && renderInbox()}
      {currentView === 'read' && selectedMail && renderReadMail()}
      {currentView === 'compose' && renderComposeMail()}
    </>
  );
};


// --- UI Components ---
const TaskbarPreview = ({ app }) => ( <div className="absolute bottom-full mb-3 w-48 h-28 p-2 bg-gray-900/50 backdrop-blur-lg border border-white/10 rounded-lg shadow-2xl flex flex-col items-center justify-center space-y-2 text-white transition-opacity duration-200"> <div className="scale-150"> {app.icon} </div> <span className="text-sm font-bold">{app.title}</span> </div> );

const Window = ({ app, onClose }) => {
  const position = { x: (1300 - app.width) / 2, y: (760 - app.height) / 2 };
  return (
    <div
      className="absolute bg-gray-900/50 backdrop-blur-lg rounded-lg shadow-2xl border border-white/10"
      style={{
        top: position.y,
        left: position.x,
        width: app.width,
        height: app.height,
      }}
    >
      <div className="h-8 bg-black/30 flex items-center justify-between px-3 rounded-t-lg">
        <div className="flex items-center space-x-2"> {React.cloneElement(app.icon, { size: 16 })} <span className="text-white text-xs font-bold">{app.title}</span> </div>
        <div className="flex items-center space-x-2">
          <button className="h-4 w-4 rounded-full bg-yellow-500 hover:bg-yellow-600 focus:outline-none"></button>
          <button className="h-4 w-4 rounded-full bg-green-500 hover:bg-green-600 focus:outline-none"></button>
          <button onClick={() => onClose()} className="h-4 w-4 rounded-full bg-red-500 hover:bg-red-600 focus:outline-none"></button>
        </div>
      </div>
      <div className="h-[calc(100%-2rem)] w-full rounded-b-lg overflow-hidden"> {app.component} </div>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [time, setTime] = useState(new Date());
  const [openApp, setOpenApp] = useState(null);
  const [previewAppId, setPreviewAppId] = useState(null);
  const [isUiVisible, setIsUiVisible] = useState(!isFiveM); // for testing
  const [mailDomain, setMailDomain] = useState('@pandamail.com');

  // --- NEW STATE ---
  const [playerData, setPlayerData] = useState({ job: 'unemployed', hasVpn: isFiveM ? false : true }); // Default VPN to true for browser testing
  const [jobRestrictions, setJobRestrictions] = useState(isFiveM ? {} : { police: ['market', 'terminal'] }); // Mock restrictions for browser testing
  // --- END NEW STATE ---


  useEffect(() => {
    if (isFiveM) {
        const handleMessage = (event) => {
          if (event.data.action === 'setVisible') {
            setIsUiVisible(event.data.status);
            if (event.data.domain) {
                setMailDomain(event.data.domain);
            }
            if (event.data.playerData) {
                setPlayerData(event.data.playerData);
            }
            if (event.data.jobRestrictions) {
                setJobRestrictions(event.data.jobRestrictions);
            }
          } 
          else if (event.data.action === 'updateData') {
            if (event.data.playerData) {
                setPlayerData(event.data.playerData);
            }
          }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => { if (event.key === 'Escape') { setIsUiVisible(false); closeNui(); } };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // --- RENAMED to allApps ---
  const allApps = [
    { id: 'mail',     title: 'Mail',     icon: <Mail size={24} />,     component: <MailApp mailDomain={mailDomain} />,     width: 1000, height: 600 },
    { id: 'terminal', title: 'Terminal', icon: <Terminal size={24} />, component: <TerminalApp />, width: 700, height: 450 },
    { id: 'settings', title: 'Settings', icon: <Settings size={24} />, component: <SettingsApp />, width: 500, height: 400 },
    { id: 'browser',  title: 'Browser',  icon: <Globe size={24} />,    component: <BrowserApp />,  width: 900, height: 650 },
    { id: 'market',   title: 'Black Market', icon: <Store size={24} />, component: <BlackMarketApp />, width: 1200, height: 650, requiresVpn: true }, // --- ADDED requiresVpn flag ---
  ];

  const handleOpenApp = (appId) => {
    const appToOpen = allApps.find(app => app.id === appId); // Search allApps
    if (openApp && openApp.id === appId) {
        setOpenApp(null);
    } else {
        setOpenApp(appToOpen);
    }
  };
  const handleCloseApp = () => setOpenApp(null);
  const getAppFromId = (id) => allApps.find(app => app.id === id); // --- MODIFIED: Search allApps ---

  // --- NEW: Filter apps based on job and VPN status ---
  const restrictedAppsForJob = jobRestrictions[playerData.job] || [];

  const visibleApps = allApps.filter(app => {
      // 1. Check Job Restriction
      if (restrictedAppsForJob.includes(app.id)) {
          return false; // App is restricted for this job
      }

      // 2. Check VPN Requirement
      if (app.requiresVpn && !playerData.hasVpn) {
          return false; // App requires VPN, but player doesn't have it
      }

      // 3. If no restrictions, show it
      return true;
  });
  // --- END NEW ---

  if (!isUiVisible) return null;

  return (
    <div className="min-h-screen w-screen p-4 sm:p-8 flex items-center justify-center">
        <div className="bg-black p-4 rounded-2xl shadow-2xl border-4 border-gray-800">
            <div className="w-[1440px] h-[790px] overflow-hidden font-sans relative rounded-lg">
                <div className="absolute inset-0 w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=2070&auto=format&fit=crop)` }} ></div>
                <div className="absolute inset-0 w-full h-full bg-black/30"></div>
                <div className="relative z-10 h-full w-full flex">
                  <nav className="w-20 h-full flex flex-col items-center space-y-2 p-4"> 
                    {/* --- MODIFIED: Use visibleApps --- */}
                    {visibleApps.map(app => (
                      <button key={app.id} onClick={() => handleOpenApp(app.id)} className={`w-full flex justify-center p-3 rounded-lg transition-colors duration-200 ${openApp?.id === app.id ? ' text-white' : 'text-white/80 hover:bg-white/20 hover:text-white'}`} title={app.title} >
                        {app.icon}
                      </button>
                    ))}
                  </nav>
                  
                  <main className="flex-grow h-full relative">
                    {openApp && <Window key={openApp.id} app={openApp} onClose={handleCloseApp} />}
                  </main>
                  
                  <footer className="absolute bottom-4 left-1/2 -translate-x-1/2">
                      <div className="h-12 bg-gray-900/50 backdrop-blur-lg border border-white/10 rounded-xl flex items-center px-4 space-x-4 shadow-2xl">
                        {openApp && (
                            <div className="relative" onMouseEnter={() => setPreviewAppId(openApp.id)} onMouseLeave={() => setPreviewAppId(null)} >
                                <button className="relative p-2 rounded-md text-white"> {getAppFromId(openApp.id).icon} <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-1 bg-blue-500 rounded-full"></span> </button>
                                {previewAppId === openApp.id && <TaskbarPreview app={getAppFromId(openApp.id)} />}
                            </div>
                        )}
                        <div className="w-px h-6 bg-white/20"></div>
                        <div className="flex items-center space-x-4 text-white text-xs">
                            <Wifi size={16} /> <BatteryFull size={16} />
                            <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>{time.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                  </footer>
                </div>
            </div>
        </div>
    </div>
  );
}
