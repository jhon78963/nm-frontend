export interface IExpense {
  id: number;
  expenseDate: string;
  description: string;
  category: string;
  amount: string;
  paymentMethod: string;
  referenceCode: string;
  user: string;
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

  constructor(expense: IExpense) {
    this.id = expense.id;
    this.expenseDate = expense.expenseDate;
    this.description = expense.description;
    this.category = expense.category;
    this.amount = expense.amount;
    this.paymentMethod = expense.paymentMethod;
    this.referenceCode = expense.referenceCode;
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
