
export interface TravelData {
  weather: string;
  utcOffset: string;
  itineraryTable: {
    morning: string;
    afternoon: string;
    evening: string;
  };
  hotelInfo: string;
  todoList: string[];
  shoppingList: string[];
}

export type ActiveTab = 'overview' | 'itinerary' | 'hotel' | 'expenses' | 'lists';

export interface Expense {
  id: string;
  item: string;
  amount: number;
  currency: string;
  method: 'Cash' | 'Credit Card';
  payer: string;
  date: string;
}

export interface CustomActivity {
  id: string;
  time: string;
  event: string;
  location: string;
  remarks: string;
}

export interface TimedListItem {
  id: string;
  text: string;
  time: string;
  completed: boolean;
}
