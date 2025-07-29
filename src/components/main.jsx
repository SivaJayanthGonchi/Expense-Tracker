
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

export default function ExpenseTracker(props) {
  const [transactions, setTransactions] = useState([]);
  const [inputText, setInputText] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [date, setDate] = useState('');
  const [data, setData] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const API_URL = 'http://localhost:3001/transactions'; // JSON server endpoint

  useEffect(() => {
    // Fetch transactions on component mount
    const fetchTransactions = async () => {
      const response = await axios.get(API_URL);
      setTransactions(response.data);
      calculateTotals(response.data);
    };
    fetchTransactions();
  }, []);

  const calculateTotals = (updatedTransactions) => {
    const newData = [];
    updatedTransactions.forEach(transaction => {
      const month = new Date(transaction.date).toLocaleString('default', { month: 'long' });
      const existingDataIndex = newData.findIndex(item => item.month === month);

      if (existingDataIndex !== -1) {
        if (transaction.type === 'Income') {
          newData[existingDataIndex].income += transaction.amount;
        } else {
          newData[existingDataIndex].expense += transaction.amount;
        }
      } else {
        newData.push({
          month: month,
          income: transaction.type === 'Income' ? transaction.amount : 0,
          expense: transaction.type === 'Expense' ? transaction.amount : 0,
        });
      }
    });

    setData(newData);
    setTotalIncome(newData.reduce((acc, curr) => acc + curr.income, 0));
    setTotalExpense(newData.reduce((acc, curr) => acc + curr.expense, 0));
  };

  const handleAddTransaction = async () => {
    if (amount.trim() === '' || transactionType === '' || date.trim() === '') return;

    if (editId) {
      // Update existing transaction
      const updatedTransaction = {
        id: editId,
        text: inputText,
        amount: +amount,
        type: transactionType,
        date: date,
      };

      await axios.put(`${API_URL}/${editId}`, updatedTransaction);

      const updatedTransactions = transactions.map(transaction =>
        transaction.id === editId ? updatedTransaction : transaction
      );
      setTransactions(updatedTransactions);
      calculateTotals(updatedTransactions);
      setEditId(null); // Exit edit mode
    } else {
      // Add new transaction
      const newTransaction = {
        id: Math.random().toString(36).substring(7),
        text: inputText,
        amount: +amount,
        type: transactionType,
        date: date,
      };

      const response = await axios.post(API_URL, newTransaction);

      const updatedTransactions = [...transactions, response.data];
      setTransactions(updatedTransactions);
      calculateTotals(updatedTransactions);
    }

    setInputText('');
    setAmount('');
    setTransactionType('');
    setDate('');
  };

  const handleDeleteTransaction = async (id) => {
    await axios.delete(`${API_URL}/${id}`);
    const updatedTransactions = transactions.filter(transaction => transaction.id !== id);
    setTransactions(updatedTransactions);
    calculateTotals(updatedTransactions);
  };

  const handleEditTransaction = (transaction) => {
    setEditId(transaction.id);
    setInputText(transaction.text);
    setAmount(transaction.amount.toString());
    setTransactionType(transaction.type);
    setDate(transaction.date);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredTransactions = transactions.filter((transaction) => {
    return (
      transaction.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.amount.toString().includes(searchTerm) ||
      transaction.date.includes(searchTerm)
    );
  });

  const balance = totalIncome - totalExpense;

  return (
    <div style={{ display: 'flex', height: '93vh', flexDirection: 'column' }}>
      <div style={{ backgroundColor: props.mode === 'dark' ? '#023e8a' : '#f2f2f2', padding: '20px', borderRadius: '8px', margin: '10px', display: 'flex', justifyContent: 'space-between', flexDirection: 'column' }}>
        
        {/* Edit or Add Transaction Section */}
        <div style={{ padding: '10px', marginBottom: '20px' }}>
          <h2>{editId ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <input type="text" placeholder="Description" value={inputText} onChange={e => setInputText(e.target.value)} style={{ marginBottom: '15px', marginRight: '5px', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
          <input type="number" placeholder="Enter amount" value={amount} onChange={e => setAmount(e.target.value)} style={{ marginBottom: '15px', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
          <input type="date" placeholder="Date" value={date} onChange={e => setDate(e.target.value)} style={{ marginBottom: '10px', padding: '8px', marginRight: '5px', borderRadius: '4px', border: '1px solid #ddd' }} />
          <select value={transactionType} onChange={e => setTransactionType(e.target.value)} style={{ marginBottom: '15px', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
            <option value="">Select Transaction Type</option>
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
          </select>
          <br />
          <button onClick={handleAddTransaction} className='btn btn-success'>{editId ? 'Save Changes' : 'Add Transaction'}</button>
        </div>

        {/* Search Bar for Transactions */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search Transactions..."
            value={searchTerm}
            onChange={handleSearch}
            style={{ padding: '6px', width: '50%', borderRadius: '4px', border: '1px solid #ddd' }} // Reduced width and padding
          />
        </div>

        {/* Transaction Table */}
        <div style={{ overflowY: 'scroll', height: '60vh' }}>
          <h2>Transactions</h2>
          {filteredTransactions.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'red' }}>No transactions found</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Description</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Amount</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Date</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction, index) => (
                  <tr key={index}>
                    <td style={{ border: '1px solid #ddd', padding: '8px', color: transaction.type === 'Income' ? 'green' : 'red' }}>{transaction.text}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', color: transaction.type === 'Income' ? 'green' : 'red' }}>Rs.{transaction.amount}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', color: transaction.type === 'Income' ? 'green' : 'red' }}>{transaction.date}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      <button onClick={() => handleEditTransaction(transaction)} style={{ border: 'none', borderRadius: '4px', padding: '5px 10px',backgroundColor:'blue',color:'white', cursor: 'pointer', marginRight: '5px' }}>Edit</button>
                      <button onClick={() => handleDeleteTransaction(transaction.id)} style={{ border: 'none', borderRadius: '4px', padding: '5px 10px',backgroundColor:'red',color:'white', cursor: 'pointer' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div>
          <p>Balance: Rs.{balance}</p>
          <p>Total Income: Rs.{totalIncome}</p>
          <p>Total Expense: Rs.{totalExpense}</p>
        </div>
      </div>

      {/* Bar Chart Section */}
      <div style={{ flex: 1, padding: '20px' }}>
        <h2>Monthly Transactions</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="income" fill="green" />
            <Bar dataKey="expense" fill="red" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


