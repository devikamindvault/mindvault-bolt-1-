// Simple in-memory storage for static app
export class SimpleStorage {
  private quotes = [
    { id: 1, text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { id: 2, text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
    { id: 3, text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
    { id: 4, text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { id: 5, text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" }
  ];

  async getAllQuotes() {
    return this.quotes;
  }

  async getDailyQuote() {
    const today = new Date();
    const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const quoteIndex = dateSeed % this.quotes.length;
    return this.quotes[quoteIndex];
  }
}

export const storage = new SimpleStorage();