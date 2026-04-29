import type {
  Account,
  Category,
  Debt,
  RecurringTransaction,
  SavingsGoal,
  Tag,
  Transaction,
} from './types';

const today = new Date();
const iso = (d: Date) => d.toISOString();
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return iso(d);
};
const daysAhead = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return iso(d);
};

export const seedAccounts: Account[] = [
  {
    id: 'acc-1',
    name: 'MTN MoMo',
    currency: 'GHS',
    balance: 4820.5,
    type: 'mobile_money',
    color: '#F4B942',
    icon: 'phone-portrait',
  },
  {
    id: 'acc-2',
    name: 'GCB Current',
    currency: 'GHS',
    balance: 12750.0,
    type: 'bank',
    color: '#4DA6FF',
    icon: 'business',
  },
  {
    id: 'acc-3',
    name: 'Cash Wallet',
    currency: 'GHS',
    balance: 620.0,
    type: 'cash',
    color: '#2ECC71',
    icon: 'cash',
  },
  {
    id: 'acc-4',
    name: 'USD Savings',
    currency: 'USD',
    balance: 1450.0,
    type: 'savings',
    color: '#B24DFF',
    icon: 'shield-checkmark',
  },
];

export const seedCategories: Category[] = [
  // Expense parents
  { id: 'cat-food', name: 'Food & Drink', icon: 'fast-food', color: '#F4B942', type: 'expense', budget: 1200 },
  { id: 'cat-transport', name: 'Transport', icon: 'car', color: '#4DA6FF', type: 'expense', budget: 600 },
  { id: 'cat-utilities', name: 'Utilities', icon: 'flash', color: '#2EC4B6', type: 'expense', budget: 800 },
  { id: 'cat-shopping', name: 'Shopping', icon: 'bag', color: '#B24DFF', type: 'expense', budget: 500 },
  { id: 'cat-entertainment', name: 'Entertainment', icon: 'game-controller', color: '#FF8C42', type: 'expense', budget: 300 },
  { id: 'cat-health', name: 'Health', icon: 'medkit', color: '#E74C3C', type: 'expense', budget: 400 },
  { id: 'cat-education', name: 'Education', icon: 'school', color: '#FFD166', type: 'expense', budget: 250 },
  { id: 'cat-rent', name: 'Rent', icon: 'home', color: '#6C7E9B', type: 'expense', budget: 2500 },

  // Subcategories
  { id: 'sub-electricity', parentId: 'cat-utilities', name: 'Electricity', icon: 'bulb', color: '#FFD166', type: 'expense' },
  { id: 'sub-water', parentId: 'cat-utilities', name: 'Water', icon: 'water', color: '#4DA6FF', type: 'expense' },
  { id: 'sub-internet', parentId: 'cat-utilities', name: 'Internet', icon: 'wifi', color: '#2EC4B6', type: 'expense' },
  { id: 'sub-groceries', parentId: 'cat-food', name: 'Groceries', icon: 'basket', color: '#2ECC71', type: 'expense' },
  { id: 'sub-restaurant', parentId: 'cat-food', name: 'Restaurant', icon: 'restaurant', color: '#F4B942', type: 'expense' },
  { id: 'sub-fuel', parentId: 'cat-transport', name: 'Fuel', icon: 'flame', color: '#E74C3C', type: 'expense' },
  { id: 'sub-uber', parentId: 'cat-transport', name: 'Ride-hailing', icon: 'car-sport', color: '#4DA6FF', type: 'expense' },

  // Income
  { id: 'cat-salary', name: 'Salary', icon: 'briefcase', color: '#2ECC71', type: 'income' },
  { id: 'cat-freelance', name: 'Freelance', icon: 'laptop', color: '#4DA6FF', type: 'income' },
  { id: 'cat-gifts', name: 'Gifts', icon: 'gift', color: '#F4B942', type: 'income' },
  { id: 'cat-investment', name: 'Investment', icon: 'trending-up', color: '#B24DFF', type: 'income' },
];

export const seedTags: Tag[] = [
  { id: 'tag-work', name: 'work', color: '#4DA6FF' },
  { id: 'tag-family', name: 'family', color: '#F4B942' },
  { id: 'tag-essential', name: 'essential', color: '#E74C3C' },
  { id: 'tag-leisure', name: 'leisure', color: '#B24DFF' },
  { id: 'tag-subscription', name: 'subscription', color: '#2EC4B6' },
];

let txCounter = 0;
const tx = (
  amount: number,
  type: 'expense' | 'income',
  categoryId: string,
  accountId: string,
  dateOffset: number,
  notes?: string,
  tagIds: string[] = [],
  merchant?: string,
  subcategoryId?: string
): Transaction => ({
  id: `tx-${++txCounter}`,
  amount,
  currency: 'GHS',
  type,
  categoryId,
  subcategoryId,
  tagIds,
  date: daysAgo(dateOffset),
  notes,
  accountId,
  merchant,
});

export const seedTransactions: Transaction[] = [
  tx(8500, 'income', 'cat-salary', 'acc-2', 3, 'April salary', ['tag-work'], 'Acme Corp'),
  tx(1200, 'income', 'cat-freelance', 'acc-1', 7, 'Logo design', ['tag-work'], 'Client K'),
  tx(150, 'income', 'cat-gifts', 'acc-3', 12, 'Birthday gift', ['tag-family']),
  tx(2500, 'expense', 'cat-rent', 'acc-2', 2, 'Monthly rent', ['tag-essential'], 'Landlord'),
  tx(85, 'expense', 'cat-utilities', 'acc-1', 4, 'ECG credit', ['tag-essential'], 'ECG', 'sub-electricity'),
  tx(120, 'expense', 'cat-utilities', 'acc-1', 8, 'MTN fibre', ['tag-essential', 'tag-subscription'], 'MTN', 'sub-internet'),
  tx(45, 'expense', 'cat-utilities', 'acc-1', 15, 'GWCL', ['tag-essential'], 'GWCL', 'sub-water'),
  tx(320, 'expense', 'cat-food', 'acc-3', 1, 'Weekly groceries', ['tag-essential', 'tag-family'], 'Shoprite', 'sub-groceries'),
  tx(78, 'expense', 'cat-food', 'acc-1', 5, 'Lunch with team', ['tag-work'], 'Buka Restaurant', 'sub-restaurant'),
  tx(42, 'expense', 'cat-food', 'acc-1', 9, 'Jollof delivery', ['tag-leisure'], 'Bofrot Kitchen', 'sub-restaurant'),
  tx(180, 'expense', 'cat-transport', 'acc-1', 3, 'Fuel top-up', ['tag-essential'], 'Shell', 'sub-fuel'),
  tx(55, 'expense', 'cat-transport', 'acc-1', 6, 'Bolt to meeting', ['tag-work'], 'Bolt', 'sub-uber'),
  tx(35, 'expense', 'cat-transport', 'acc-1', 10, 'Uber home', [], 'Uber', 'sub-uber'),
  tx(280, 'expense', 'cat-shopping', 'acc-2', 11, 'New headphones', ['tag-leisure'], 'Jumia'),
  tx(95, 'expense', 'cat-entertainment', 'acc-1', 4, 'Silverbird cinema', ['tag-leisure'], 'Silverbird'),
  tx(29, 'expense', 'cat-entertainment', 'acc-2', 14, 'Netflix', ['tag-subscription'], 'Netflix'),
  tx(58, 'expense', 'cat-entertainment', 'acc-2', 16, 'Spotify', ['tag-subscription'], 'Spotify'),
  tx(220, 'expense', 'cat-health', 'acc-2', 6, 'Pharmacy', ['tag-essential'], 'HealthPlus'),
  tx(180, 'expense', 'cat-education', 'acc-2', 13, 'Coursera plan', ['tag-subscription'], 'Coursera'),
  // earlier month
  tx(8500, 'income', 'cat-salary', 'acc-2', 33, 'March salary', ['tag-work'], 'Acme Corp'),
  tx(2500, 'expense', 'cat-rent', 'acc-2', 32, 'Rent', ['tag-essential']),
  tx(340, 'expense', 'cat-food', 'acc-3', 34, 'Groceries', ['tag-essential'], 'Palace', 'sub-groceries'),
  tx(180, 'expense', 'cat-transport', 'acc-1', 35, 'Fuel', [], 'Shell', 'sub-fuel'),
  tx(85, 'expense', 'cat-utilities', 'acc-1', 40, 'ECG', [], 'ECG', 'sub-electricity'),
  // older (for archive demo)
  tx(450, 'expense', 'cat-shopping', 'acc-2', 400, 'Old laptop bag', [], 'Jumia'),
  tx(210, 'expense', 'cat-food', 'acc-1', 420, 'Old dinner', [], 'Buka', 'sub-restaurant'),
];

export const seedSavingsGoals: SavingsGoal[] = [
  {
    id: 'goal-1',
    name: 'Emergency Fund',
    targetAmount: 10000,
    currentAmount: 4200,
    deadline: daysAhead(180),
    accountId: 'acc-2',
    color: '#2ECC71',
    icon: 'shield-checkmark',
    createdAt: daysAgo(90),
    contributions: [
      { id: 'c1', amount: 1000, date: daysAgo(60) },
      { id: 'c2', amount: 1200, date: daysAgo(30) },
      { id: 'c3', amount: 2000, date: daysAgo(10) },
    ],
  },
  {
    id: 'goal-2',
    name: 'Dubai Trip',
    targetAmount: 8000,
    currentAmount: 2350,
    deadline: daysAhead(240),
    accountId: 'acc-4',
    color: '#F4B942',
    icon: 'airplane',
    createdAt: daysAgo(60),
    contributions: [
      { id: 'c4', amount: 1000, date: daysAgo(45) },
      { id: 'c5', amount: 1350, date: daysAgo(12) },
    ],
  },
  {
    id: 'goal-3',
    name: 'New MacBook',
    targetAmount: 15000,
    currentAmount: 3800,
    deadline: daysAhead(300),
    accountId: 'acc-4',
    color: '#4DA6FF',
    icon: 'laptop',
    createdAt: daysAgo(30),
    contributions: [
      { id: 'c6', amount: 2000, date: daysAgo(20) },
      { id: 'c7', amount: 1800, date: daysAgo(5) },
    ],
  },
];

export const seedRecurring: RecurringTransaction[] = [
  {
    id: 'rec-1',
    name: 'Netflix subscription',
    amount: 29,
    type: 'expense',
    categoryId: 'cat-entertainment',
    accountId: 'acc-2',
    frequency: 'monthly',
    nextDueDate: daysAhead(16),
    isActive: true,
    createdAt: daysAgo(180),
    notes: 'Standard plan',
  },
  {
    id: 'rec-2',
    name: 'Spotify Premium',
    amount: 58,
    type: 'expense',
    categoryId: 'cat-entertainment',
    accountId: 'acc-2',
    frequency: 'monthly',
    nextDueDate: daysAhead(9),
    isActive: true,
    createdAt: daysAgo(200),
  },
  {
    id: 'rec-3',
    name: 'Rent',
    amount: 2500,
    type: 'expense',
    categoryId: 'cat-rent',
    accountId: 'acc-2',
    frequency: 'monthly',
    nextDueDate: daysAhead(3),
    isActive: true,
    createdAt: daysAgo(365),
  },
  {
    id: 'rec-4',
    name: 'Salary',
    amount: 8500,
    type: 'income',
    categoryId: 'cat-salary',
    accountId: 'acc-2',
    frequency: 'monthly',
    nextDueDate: daysAhead(5),
    isActive: true,
    createdAt: daysAgo(700),
  },
  {
    id: 'rec-5',
    name: 'MTN Fibre',
    amount: 120,
    type: 'expense',
    categoryId: 'cat-utilities',
    accountId: 'acc-1',
    frequency: 'monthly',
    nextDueDate: daysAhead(22),
    isActive: false,
    createdAt: daysAgo(400),
  },
];

export const seedDebts: Debt[] = [
  {
    id: 'debt-1',
    name: 'Loan from Kofi',
    contactName: 'Kofi Mensah',
    amount: 1500,
    amountPaid: 500,
    type: 'owed',
    dueDate: daysAhead(14),
    isPaid: false,
    notes: 'Agreed 3-month repayment',
    createdAt: daysAgo(45),
  },
  {
    id: 'debt-2',
    name: 'Ama owes me',
    contactName: 'Ama Osei',
    amount: 800,
    amountPaid: 0,
    type: 'lent',
    dueDate: daysAhead(-2),
    isPaid: false,
    notes: 'Borrowed for car repairs',
    createdAt: daysAgo(30),
  },
  {
    id: 'debt-3',
    name: 'Credit union',
    contactName: 'Credit Union',
    amount: 4000,
    amountPaid: 2000,
    type: 'owed',
    dueDate: daysAhead(60),
    isPaid: false,
    createdAt: daysAgo(120),
  },
  {
    id: 'debt-4',
    name: 'Yaw settled loan',
    contactName: 'Yaw Asante',
    amount: 300,
    amountPaid: 300,
    type: 'lent',
    dueDate: daysAgo(5),
    isPaid: true,
    createdAt: daysAgo(60),
  },
];
