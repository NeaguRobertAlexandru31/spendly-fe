export interface CategorySpent {
  categoryId: string | null;
  categoryName: string | null;
  total: number;
}

export interface DailyPoint {
  day: number;
  cumulative: number;
}

export interface RecentTransaction {
  id: string;
  description: string | null;
  amount: number;
  date: string;
  type: string;
  isRecurring: boolean;
  category: { id: string; name: string } | null;
  subCategory: { id: string; name: string } | null;
}

export interface DashboardMetrics {
  totalSpent: number;
  totalIncome: number;
  netBalance: number;
  dailyAvg: number;
  projected: number;
  recurringTotal: number;
  recurringCount: number;
  spentByCategory: CategorySpent[];
  dailyData: DailyPoint[];
  recentTransactions: RecentTransaction[];
  monthName: string;
}
