
import React from 'react';
import Header from '@/components/Header';
import { Wallet, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WalletPage = () => {
  const transactions = [
    { id: 1, type: 'credit', amount: 50, description: 'Tournament Prize', date: '2024-01-15' },
    { id: 2, type: 'debit', amount: 20, description: 'Tournament Entry', date: '2024-01-14' },
    { id: 3, type: 'credit', amount: 100, description: 'Account Bonus', date: '2024-01-10' }
  ];

  return (
    <div className="bg-[#141414] text-white min-h-screen">
      <Header title="Wallet" showBack />
      
      <div className="p-4">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Wallet size={24} className="text-white" />
              <span className="text-lg font-semibold">Current Balance</span>
            </div>
            <span className="text-sm opacity-80">KES</span>
          </div>
          
          <div className="text-4xl font-bold mb-2">200.00</div>
          <div className="text-sm opacity-80">Available for withdrawal</div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button className="bg-green-600 hover:bg-green-700 flex items-center justify-center space-x-2 py-6">
            <Plus size={20} />
            <span>Add Funds</span>
          </Button>
          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 flex items-center justify-center space-x-2 py-6">
            <TrendingUp size={20} />
            <span>Withdraw</span>
          </Button>
        </div>

        {/* Transaction History */}
        <div className="bg-[#1a1a1a] rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
          
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'credit' ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                      {transaction.type === 'credit' ? 
                        <TrendingUp size={16} /> : 
                        <TrendingDown size={16} />
                      }
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-400">{transaction.date}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`font-semibold ${
                      transaction.type === 'credit' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.type === 'credit' ? '+' : '-'}KES {transaction.amount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Wallet size={48} className="mx-auto mb-2 opacity-50" />
              <p>No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
