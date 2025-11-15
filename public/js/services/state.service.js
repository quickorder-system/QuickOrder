// Attempt to load state from sessionStorage, defaulting to null/empty.
const getInitialState = (key, defaultValue = []) => {
  try {
    const savedState = sessionStorage.getItem(key);
    return savedState ? JSON.parse(savedState) : defaultValue;
  } catch (e) {
    console.error(`Failed to parse ${key} from sessionStorage`, e);
    return defaultValue;
  }
};

const state = {
  cart: getInitialState('cart', []),
  user: null,
  orders: [],
  currentOrder: getInitialState('currentOrder', null),
};

const listeners = new Map();

function subscribe(key, callback) {
  if (!listeners.has(key)) {
    listeners.set(key, new Set());
  }
  listeners.get(key).add(callback);
  return () => listeners.get(key).delete(callback);
}

function notifyListeners(key) {
  if (listeners.has(key)) {
    listeners.get(key).forEach(callback => {
      callback(state[key]);
    });
  }
}

// --- Cart Functions (with sessionStorage) ---

function addToCart(item) {
  state.cart.push(item);
  sessionStorage.setItem('cart', JSON.stringify(state.cart));
  notifyListeners('cart');
}

function removeFromCart(itemId) {
  state.cart = state.cart.filter(item => item.id !== itemId);
  sessionStorage.setItem('cart', JSON.stringify(state.cart));
  notifyListeners('cart');
}

function clearCart() {
  state.cart = [];
  state.currentOrder = null;
  sessionStorage.removeItem('cart');
  sessionStorage.removeItem('currentOrder');
  notifyListeners('cart');
  notifyListeners('currentOrder');
}

// --- Order Functions (with sessionStorage) ---

function setCurrentOrder(order) {
  // If the order is null or undefined, remove it from storage
  if (order === null || typeof order === 'undefined') {
    state.currentOrder = null;
    sessionStorage.removeItem('currentOrder');
  } else {
    state.currentOrder = { ...state.currentOrder, ...order };
    sessionStorage.setItem('currentOrder', JSON.stringify(state.currentOrder));
  }
  notifyListeners('currentOrder');
}

// --- Other State Functions (in-memory) ---

function setUser(user) {
  state.user = user;
  notifyListeners('user');
}

function logout() {
  state.user = null;
  notifyListeners('user');
}

function setOrders(orders) {
  state.orders = orders;
  notifyListeners('orders');
}

function addOrder(order) {
  state.orders.push(order);
  notifyListeners('orders');
}

export const stateService = {
  get cart() {
    return [...state.cart];
  },
  get user() {
    return state.user;
  },
  get orders() {
    return [...state.orders];
  },
  get currentOrder() {
    return state.currentOrder;
  },
  subscribe,
  addToCart,
  removeFromCart,
  clearCart,
  setUser,
  logout,
  setOrders,
  addOrder,
  setCurrentOrder,
};