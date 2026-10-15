import { Account, Transaction, Budget, CurrencyCode } from '../types/finance';

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc_chase_main',
    name: 'Chase Premier Checking',
    institution: 'Chase Bank',
    type: 'checking',
    currency: 'USD',
    balance: 8450.25,
    initialBalance: 6200.0,
    color: '#3B82F6',
    accountNumberMask: '•••• 4182',
    isDefault: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'acc_revolut_eur',
    name: 'Revolut Multi-Currency EUR',
    institution: 'Revolut Europe',
    type: 'checking',
    currency: 'EUR',
    balance: 3120.4,
    initialBalance: 2500.0,
    color: '#10B981',
    accountNumberMask: '•••• 8901',
    isDefault: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'acc_barclays_gbp',
    name: 'Barclays Everyday GBP',
    institution: 'Barclays UK',
    type: 'savings',
    currency: 'GBP',
    balance: 4280.0,
    initialBalance: 4000.0,
    color: '#8B5CF6',
    accountNumberMask: '•••• 3320',
    isDefault: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'acc_cash_jpy',
    name: 'Tokyo Travel Wallet (JPY)',
    institution: 'Cash Wallet',
    type: 'cash',
    currency: 'JPY',
    balance: 145000,
    initialBalance: 145000,
    color: '#F59E0B',
    accountNumberMask: 'Cash',
    isDefault: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'acc_hdfc_inr',
    name: 'HDFC Salary & UPI (INR)',
    institution: 'HDFC Bank',
    type: 'checking',
    currency: 'INR',
    balance: 84500.0,
    initialBalance: 75000.0,
    color: '#06B6D4',
    accountNumberMask: '•••• 6619',
    isDefault: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'acc_inc_vault',
    name: 'INC Digital Liquidity Account',
    institution: 'INC Reserve Vault',
    type: 'investment',
    currency: 'INC',
    balance: 2400.0,
    initialBalance: 2000.0,
    color: '#EC4899',
    accountNumberMask: '•••• 1042',
    isDefault: false,
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_CARDS: import('../types/finance').LinkedCard[] = [
  {
    id: 'card_chase_sapphire',
    cardholderName: 'Deepanshu Dhar',
    last4: '4182',
    network: 'visa',
    bank: 'Chase Sapphire Reserve',
    expiry: '09/29',
    currency: 'USD',
    color: '#0F172A',
    accountId: 'acc_chase_main',
  },
  {
    id: 'card_hdfc_millennia',
    cardholderName: 'Deepanshu Dhar',
    last4: '6619',
    network: 'rupay',
    bank: 'HDFC Millennia RuPay',
    expiry: '11/28',
    currency: 'INR',
    color: '#1E1B4B',
    accountId: 'acc_hdfc_inr',
  },
  {
    id: 'card_revolut_metal',
    cardholderName: 'Deepanshu Dhar',
    last4: '8901',
    network: 'mastercard',
    bank: 'Revolut Metal Platinum',
    expiry: '04/27',
    currency: 'EUR',
    color: '#1E293B',
    accountId: 'acc_revolut_eur',
  },
];

export const INITIAL_UPIS: import('../types/finance').LinkedUPI[] = [
  {
    id: 'upi_gpay_hdfc',
    upiId: 'deepanshudhar@okhdfcbank',
    provider: 'Google Pay',
    linkedAccountName: 'HDFC Salary & UPI (INR)',
    accountId: 'acc_hdfc_inr',
    currency: 'INR',
  },
  {
    id: 'upi_phonepe',
    upiId: 'deepanshu@ybl',
    provider: 'PhonePe',
    linkedAccountName: 'HDFC Salary & UPI (INR)',
    accountId: 'acc_hdfc_inr',
    currency: 'INR',
  },
  {
    id: 'upi_inc_pay',
    upiId: 'deepanshu@incpay',
    provider: 'Bank UPI',
    linkedAccountName: 'INC Digital Liquidity Account',
    accountId: 'acc_inc_vault',
    currency: 'INC',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_01',
    accountId: 'acc_chase_main',
    date: '2026-10-12',
    merchant: 'Acme Corp Payroll',
    description: 'Direct Deposit ACME CORP PAYROLL',
    amount: 5400.0,
    currency: 'USD',
    type: 'income',
    category: 'Income',
    confidenceScore: 0.99,
    createdAt: '2026-10-12T08:00:00Z',
  },
  {
    id: 'tx_02',
    accountId: 'acc_chase_main',
    date: '2026-10-13',
    merchant: 'Avalon Bay Communities',
    description: 'AVALON APARTMENTS E-PAY RENT OCT',
    amount: 2150.0,
    currency: 'USD',
    type: 'expense',
    category: 'Housing',
    isRecurring: true,
    confidenceScore: 0.98,
    createdAt: '2026-10-13T09:15:00Z',
  },
  {
    id: 'tx_03',
    accountId: 'acc_chase_main',
    date: '2026-10-13',
    merchant: 'Whole Foods Market',
    description: 'WHOLE FOODS #1042 AUSTIN TX',
    amount: 142.85,
    currency: 'USD',
    type: 'expense',
    category: 'Groceries',
    confidenceScore: 0.96,
    createdAt: '2026-10-13T14:22:00Z',
  },
  {
    id: 'tx_04',
    accountId: 'acc_revolut_eur',
    date: '2026-10-14',
    merchant: 'Café de Flore Paris',
    description: 'CAFE DE FLORE RESTAURANT PARIS FR',
    amount: 68.5,
    currency: 'EUR',
    type: 'expense',
    category: 'Food & Dining',
    confidenceScore: 0.94,
    createdAt: '2026-10-14T11:45:00Z',
  },
  {
    id: 'tx_05',
    accountId: 'acc_revolut_eur',
    date: '2026-10-14',
    merchant: 'SNCF Voyageurs',
    description: 'SNCF TGV BILLET TRAIN PARIS-LYON',
    amount: 112.0,
    currency: 'EUR',
    type: 'expense',
    category: 'Travel',
    confidenceScore: 0.95,
    createdAt: '2026-10-14T16:10:00Z',
  },
  {
    id: 'tx_06',
    accountId: 'acc_barclays_gbp',
    date: '2026-10-11',
    merchant: 'TFL Travel Charge',
    description: 'TRANSPORT FOR LONDON UNDERGROUND',
    amount: 14.8,
    currency: 'GBP',
    type: 'expense',
    category: 'Transportation',
    confidenceScore: 0.97,
    createdAt: '2026-10-11T18:30:00Z',
  },
  {
    id: 'tx_07',
    accountId: 'acc_chase_main',
    date: '2026-10-10',
    merchant: 'Netflix',
    description: 'NETFLIX.COM PREMIUM 4K SUBSCRIPTION',
    amount: 22.99,
    currency: 'USD',
    type: 'expense',
    category: 'Subscriptions',
    isRecurring: true,
    confidenceScore: 0.99,
    createdAt: '2026-10-10T02:00:00Z',
  },
  {
    id: 'tx_08',
    accountId: 'acc_chase_main',
    date: '2026-10-09',
    merchant: 'Equinox Fitness Club',
    description: 'EQUINOX MONTHLY MEMBERSHIP DUES',
    amount: 280.0,
    currency: 'USD',
    type: 'expense',
    category: 'Health & Fitness',
    isRecurring: true,
    confidenceScore: 0.98,
    createdAt: '2026-10-09T06:00:00Z',
  },
  {
    id: 'tx_09',
    accountId: 'acc_cash_jpy',
    date: '2026-10-08',
    merchant: 'Ramen Ichiran Shibuya',
    description: 'ICHIRAN RAMEN TOKYO SHIBUYA',
    amount: 1850.0,
    currency: 'JPY',
    type: 'expense',
    category: 'Food & Dining',
    confidenceScore: 0.93,
    createdAt: '2026-10-08T19:20:00Z',
  },
  {
    id: 'tx_10',
    accountId: 'acc_chase_main',
    date: '2026-10-07',
    merchant: 'Apple Store Online',
    description: 'APPLE.COM/BILL 1TB ICLOUD & APP STORE',
    amount: 9.99,
    currency: 'USD',
    type: 'expense',
    category: 'Subscriptions',
    isRecurring: true,
    confidenceScore: 0.99,
    createdAt: '2026-10-07T12:00:00Z',
  },
  {
    id: 'tx_11',
    accountId: 'acc_chase_main',
    date: '2026-10-06',
    merchant: 'Uber Technologies',
    description: 'UBER *TRIP RIDE SAN FRANCISCO',
    amount: 34.6,
    currency: 'USD',
    type: 'expense',
    category: 'Transportation',
    confidenceScore: 0.96,
    createdAt: '2026-10-06T21:40:00Z',
  },
  {
    id: 'tx_12',
    accountId: 'acc_chase_main',
    date: '2026-10-05',
    merchant: 'Pacific Gas & Electric',
    description: 'PG&E RESIDENTIAL UTILITIES STATEMENT',
    amount: 145.2,
    currency: 'USD',
    type: 'expense',
    category: 'Utilities',
    isRecurring: true,
    confidenceScore: 0.97,
    createdAt: '2026-10-05T10:00:00Z',
  },
  {
    id: 'tx_13',
    accountId: 'acc_barclays_gbp',
    date: '2026-10-04',
    merchant: 'Marks & Spencer London',
    description: 'M&S FOOD OXFORD STREET LONDON',
    amount: 45.2,
    currency: 'GBP',
    type: 'expense',
    category: 'Groceries',
    confidenceScore: 0.95,
    createdAt: '2026-10-04T13:10:00Z',
  },
  {
    id: 'tx_14',
    accountId: 'acc_chase_main',
    date: '2026-10-03',
    merchant: 'Steam Games',
    description: 'STEAMGAMES.COM PURCHASE',
    amount: 59.99,
    currency: 'USD',
    type: 'expense',
    category: 'Entertainment',
    confidenceScore: 0.92,
    createdAt: '2026-10-03T20:15:00Z',
  },
  {
    id: 'tx_15',
    accountId: 'acc_revolut_eur',
    date: '2026-10-02',
    merchant: 'Zara Haussmann',
    description: 'ZARA RETAIL PARIS BD HAUSSMANN',
    amount: 129.9,
    currency: 'EUR',
    type: 'expense',
    category: 'Shopping',
    confidenceScore: 0.94,
    createdAt: '2026-10-02T15:40:00Z',
  },
];

export const INITIAL_BUDGETS: Budget[] = [
  {
    id: 'b_housing',
    category: 'Housing',
    monthlyLimit: 2200,
    warningPercent: 85,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'b_groceries',
    category: 'Groceries',
    monthlyLimit: 600,
    warningPercent: 80,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'b_food_dining',
    category: 'Food & Dining',
    monthlyLimit: 450,
    warningPercent: 75,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'b_transportation',
    category: 'Transportation',
    monthlyLimit: 250,
    warningPercent: 80,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'b_utilities',
    category: 'Utilities',
    monthlyLimit: 200,
    warningPercent: 90,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'b_subscriptions',
    category: 'Subscriptions',
    monthlyLimit: 80,
    warningPercent: 90,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'b_entertainment',
    category: 'Entertainment',
    monthlyLimit: 150,
    warningPercent: 80,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'b_shopping',
    category: 'Shopping',
    monthlyLimit: 300,
    warningPercent: 80,
    updatedAt: new Date().toISOString(),
  },
];

export const SAMPLE_STATEMENTS = {
  chase_usd: `CHASE PREMIER BANKING STATEMENT
Account: **** 4182 | Period: Sep 15 - Oct 14, 2026
----------------------------------------------------------------------
10/01/2026  PAYROLL DIRECT DEPOSIT TECH CORP           +$4,850.00
10/02/2026  AMZN Mktp US*2K48J92 SEATTLE WA              -$84.30
10/03/2026  TRADER JOE'S #521 NEW YORK NY                -$67.45
10/04/2026  UBER TRIP 0932 SF CA                         -$28.50
10/05/2026  CON EDISON ELECTRIC BILL                    -$115.20
10/06/2026  SPOTIFY USA MONTHLY SUB                       -$11.99
10/07/2026  SWEETGREEN SALAD NYC                         -$17.85
10/08/2026  CHEVRON GAS STATION 0412                     -$48.00
10/09/2026  EQUINOX GYM MEMBERSHIP                      -$280.00
10/10/2026  APPLE STORE ONLINE ICLOUD                     -$2.99
10/11/2026  AVALON APARTMENTS OCT RENT                -$2,150.00
10/12/2026  BLUE BOTTLE COFFEE MANHATTAN                  -$7.50
10/13/2026  TARGET STORE #1820 BROOKLYN NY               -$92.40
10/14/2026  WARBY PARKER OPTICAL EYEWEAR                -$145.00`,

  revolut_eur: `Date,Description,Amount,Fee,Currency,State,Balance
2026-10-01,Transfer from Main Account,1500.00,0.00,EUR,COMPLETED,2500.00
2026-10-02,Monoprix Saint-Germain,-48.60,0.00,EUR,COMPLETED,2451.40
2026-10-04,Uber BV Amsterdam,-24.10,0.00,EUR,COMPLETED,2427.30
2026-10-05,Le Petit Cler Bistro Paris,-62.00,0.00,EUR,COMPLETED,2365.30
2026-10-07,Air France Ticket Paris-Berlin,-185.00,0.00,EUR,COMPLETED,2180.30
2026-10-09,Decathlon Sports Gear,-74.50,0.00,EUR,COMPLETED,2105.80
2026-10-12,Orange Telecom Mobile Bill,-29.99,0.00,EUR,COMPLETED,2075.81`,

  amex_multi: `AMERICAN EXPRESS MONTHLY STATEMENT
Card ending in -92004 | Currency: USD
---------------------------------------------------------
OCT 02  DELTA AIR LINES ATLANTA GA           $385.20
OCT 03  MARRIOTT HOTEL SAN FRANCISCO         $420.00
OCT 05  NOBU RESTAURANT NYC                  $195.50
OCT 06  UBER EATS ORDERS SF                   $42.30
OCT 08  NETFLIX SUBSCRIPTION                  $22.99
OCT 10  WHOLE FOODS #1029                    $112.40
OCT 12  PATAGONIA RETAIL STORE               $219.00
OCT 14  PAYMENT RECEIVED - THANK YOU       -$1,400.00`,
};
