export interface IExpense {
  id: number;
  expenseDate: string;
  description: string;
  category: string;
  amount: string;
  paymentMethod: string;
  referenceCode: string;
  user: string;
  userId: number;
}
export class Expense {
  id: number;
  expenseDate: string;
  description: string;
  category: string;
  amount: string;
  paymentMethod: string;
  referenceCode: string;
  user: string;
  userId: number;

  constructor(expense: IExpense) {
    this.id = expense.id;
    this.expenseDate = expense.expenseDate;
    this.description = expense.description;
    this.category = expense.category;
    this.amount = expense.amount;
    this.paymentMethod = expense.paymentMethod;
    this.referenceCode = expense.referenceCode;
    this.userId = expense.userId;
    this.user = expense.user;
  }
}

export interface Paginate {
  total: number;
  pages: number;
}

export interface ExpenseListResponse {
  data: Expense[];
  paginate: Paginate;
}

export interface ExpenseResponse {
  data: Expense;
}
