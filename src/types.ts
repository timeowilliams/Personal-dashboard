interface Account {
  accountId: string;
  name: string;
  balances: {
    available: number;
    current: number;
    iso_currency_code: string;
  };
  type: string;
  subtype: string;
}

interface BankAccount {
  _id: string;
  accessToken: string;
  institutionName: string;
}

interface DeepWorkData {
  totalDeepWorkHours: number;
  activities: {
    _id: string;
    username: string;
    date: string;
    url: string;
    title: string;
    timeSpent: number;
    createdAt: string;
    updatedAt: string;
  }[];
}
interface ActivityData {
  sleep?: number;
  activity?: number; // In hours, converted from minutes
  waterIntake?: number;
  calories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
  steps?: number;
  weight?: number;
  bodyFat?: number;
  waistCircumference?: number;
  waistDate?: string;
  weightDate?: string;
  bodyFatDate?: string;
}

interface PostureData {
  posture: string;
  grade: string;
  score: number;
  feedback?: string;
}

interface Transaction {
  amount: number;
  date: string;
}

interface HealthData {
  timestamp: string;
  sleep?: number;
  activity?: number;
  waterIntake?: number;
  calories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
  steps?: number;
  weight?: number;
  bodyFat?: number;
  waistCircumference?: number;
  waistDate?: string;
  weightDate?: string;
  bodyFatDate?: string;
}

export type {
  Account,
  BankAccount,
  DeepWorkData,
  ActivityData,
  PostureData,
  Transaction,
  HealthData,
};