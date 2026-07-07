import { formatReportDate } from '../utils/format.js';

export function buildSalesReport(sale) {
  return {
    amount: sale.amount,
    date: formatReportDate(sale.date),
  };
}
