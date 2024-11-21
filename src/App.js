import React, { useState, useEffect } from "react";
import axios from "axios";
import { Pie } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import { FaMicrophone } from "react-icons/fa";

Chart.register(ArcElement, Tooltip, Legend);

export default function App() {
  const [selectedPage, setSelectedPage] = useState("dashboard");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [category_type, setCategoryType] = useState("Expenses");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [expenses, setExpenses] = useState([]);
  const [totalDayExpense, setTotalDayExpense] = useState(0);
  const [totalMonthExpense, setTotalMonthExpense] = useState(0);
  const [chartData, setChartData] = useState({});
  const [isListening, setIsListening] = useState(false);
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    if (selectedDate) {
      fetchExpensesByDate(selectedDate);
    }
  }, [selectedDate]);

  const fetchExpensesByDate = async (date) => {
    try {
      const response = await axios.get("http://localhost:8000/get-expenses/", {
        params: { date },
      });
      setExpenses(response.data.expenses);
      setTotalDayExpense(response.data.total_expense_day || 0);
      setTotalMonthExpense(response.data.total_expense_month || 0);
      generateChartData(response.data.expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  };

  const generateChartData = (expenses) => {
    const categories = expenses.reduce((acc, expense) => {
      acc[expense.category] =
        (acc[expense.category] || 0) + parseFloat(expense.amount);
      return acc;
    }, {});

    setChartData({
      labels: Object.keys(categories),
      datasets: [
        {
          label: "Expenses by Category",
          data: Object.values(categories),
          backgroundColor: [
            "#FFB6C1",
            "#F08080",
            "#87CEEB",
            "#98FB98",
            "#FFD700",
            "#FF69B4",
          ],
        },
      ],
    });
  };

  const handleAddExpense = async () => {
    if (!category || !amount || isNaN(amount) || amount <= 0) {
      alert("Please enter a valid category and amount.");
      return;
    }

    try {
      await axios.post("http://localhost:8000/add-expense/", {
        category,
        amount: parseFloat(amount),
        date,
        category_type,
      });
      setCategory("");
      setAmount("");
      alert("Expense added successfully!");
      fetchExpensesByDate(date);
    } catch (error) {
      console.error(
        "Error adding expense:",
        error.response ? error.response.data : error.message
      );
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/delete-expense/${id}/`);
      alert("Expense deleted successfully!");
      fetchExpensesByDate(selectedDate);
    } catch (error) {
      console.error(
        "Error deleting expense:",
        error.response ? error.response.data : error.message
      );
    }
  };

  const handlePredictExpenses = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/predict-next-month/"
      );
      setPrediction(response.data.predicted_expense || null);
    } catch (error) {
      console.error("Error predicting expenses:", error);
    }
  };


  const handleVoiceInput = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.interimResults = false;
  
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
  
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const words = transcript.split(" ");
  
      if (words.length >= 3) {
        const categoryTypeInput = words.shift().toLowerCase();
        const lastWord = parseFloat(words.pop());
        const categoryInput = words.join(" ");
  
        const validCategoryTypes = ["income", "expenses"];
        if (validCategoryTypes.includes(categoryTypeInput)) {
          setCategoryType(categoryTypeInput === "income" ? "Income" : "Expenses");
          if (!isNaN(lastWord)) {
            setCategory(categoryInput);
            setAmount(lastWord);
            alert(
              `Detected: Category Type - ${categoryTypeInput}, Category - ${categoryInput}, Amount - ${lastWord}`
            );
          } else {
            alert("Failed to parse amount. Please try again.");
          }
        } else {
          alert(
            `Invalid category type: ${categoryTypeInput}. Please start with 'Income' or 'Expenses'.`
          );
        }
      } else {
        alert(
          "Invalid input. Please say a category type, category, and amount (e.g., 'Income Groceries 50')."
        );
      }
    };
    recognition.onerror = (err) => {
      console.error("Speech recognition error:", err);
      alert("Error with voice input, please try again.");
    };
    recognition.start();
  };

  const micButtonContainer = {
    margin: "20px auto",
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  };

  const micButtonStyles = {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: isListening ? "#ff4b5c" : "#4CAF50",
    color: "#fff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "36px",
    cursor: "pointer",
    transition: "background 0.3s ease",
    boxShadow: isListening ? "0 0 15px rgba(255,75,92,0.8)" : "none",
  };

  const waveStyles = {
    position: "absolute",
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    background: "rgba(255,75,92,0.3)",
    animation: "wave-animation 1.5s infinite",
    display: isListening ? "block" : "none",
  };

  return (
    <div style={layoutStyles}>
      <aside style={sidebarStyles}>
        <h1 style={headingStyles}>Penny - The Expense Manager</h1>
        <nav>
          {["dashboard", "analytics", "prediction"].map((page) => (
            <button
              key={page}
              onClick={() => setSelectedPage(page)}
              style={{
                ...buttonStyles,
                backgroundColor: selectedPage === page ? "#4a5568" : "transparent",
              }}
            >
              {page.charAt(0).toUpperCase() + page.slice(1)}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main style={mainContentStyles}>
  {selectedPage === "dashboard" && (
    <div style={cardStyles}>
      <h2 style={cardHeaderStyles}>Dashboard</h2>
      <div style={cardContentStyles}>
        <form style={formStyles}>
          <select
            value={category_type}
            onChange={(e) => setCategoryType(e.target.value)}
            style={inputStyles}
          >
            <option value="Expenses">Expenses</option>
            <option value="Income">Income</option>
          </select>
          <input
            type="text"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={inputStyles}
          />
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={inputStyles}
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={inputStyles}
          />
          <button style={submitButtonStyles} onClick={handleAddExpense}>
            Add {category_type}
          </button>
        </form>
        <div style={micButtonContainer}>
        <div style={waveStyles}></div>
        <button onClick={handleVoiceInput} style={micButtonStyles}>
          <FaMicrophone />
        </button>
      </div>
      </div>
    </div>
  )}

{selectedPage === "analytics" && (
  <>
    {/* Analytics and View Expenses/Income Cards Side by Side */}
    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: '1'}}>
      {/* Analytics Card */}
      <div style={{ ...cardStyles, flex: '1' }}>
        <h2 style={cardHeaderStyles}>Analytics</h2>
        <div style={{ ...cardContentStyles, textAlign: 'center' }}>
          {chartData.labels ? (
            <div style={{ width: '200px', height: '200px', margin: '0 auto' }}>
              <Pie data={chartData} options={{ maintainAspectRatio: false }} />
            </div>
          ) : (
            <p>No data available for analytics.</p>
          )}
        </div>
      </div>

      {/* View Expenses/Income Card */}
      <div style={{ ...cardStyles, flex: '1', overflowY: 'auto', maxHeight: '500px' }}>
        <h2 style={cardHeaderStyles}>VIEW INCOME / EXPENSES</h2>
        <div style={cardContentStyles}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={inputStyles}
          />
          <h3>Expenses on {selectedDate}</h3>
          <ul>
            {expenses.map((expense) => (
              <li key={expense.id}>
                {expense.category} - ${parseFloat(expense.amount).toFixed(2)} -{" "}
                {new Date(expense.date).toLocaleDateString()}
                <button onClick={() => handleDeleteExpense(expense.id)} style={button}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
          <p>
            Total Expenses for {selectedDate}: $
            {parseFloat(totalDayExpense || 0).toFixed(2)}
          </p>
          <p>
            Total Expenses for {selectedDate.slice(0, 7)}: $
            {parseFloat(totalMonthExpense || 0).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  </>
)}

        {selectedPage === "prediction" && (
          <div style={cardStyles}>
            <h2 style={cardHeaderStyles}>Prediction</h2>
            <div style={cardContentStyles}>
              <button style={submitButtonStyles} onClick={handlePredictExpenses}>
                Predict Next Month's Expenses
              </button>
              {prediction !== null && (
                <p>
                  Predicted Expense for next month: ₹
                  {parseFloat(prediction).toFixed(2)}
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const layoutStyles = {
  display: "flex",
  height: "100vh",
  overflow: "hidden",
};

const sidebarStyles = {
  width: "16rem",
  height: "100vh",
  backgroundColor: "#2d3748",
  color: "#fff",
  padding: "1.5rem",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  position: "fixed",
};

const headingStyles = {
  fontSize: "1.5rem",
  fontWeight: "bold",
};

const buttonStyles = {
  width: "100%",
  textAlign: "left",
  padding: "0.75rem",
  borderRadius: "0.5rem",
  border: "none",
  color: "#fff",
  cursor: "pointer",
};

const button = {
  width: "80%",
  textAlign: "left",
  padding: "0.75rem",
  borderRadius: "0.5rem",
  border: "none",
  color: "#fff",
  cursor: "pointer",
};

const mainContentStyles = {
  flex: 1,
  marginLeft: "16rem",
  padding: "2rem",
  backgroundColor: "#f7fafc",
};

const cardStyles = {
  maxWidth: "40rem",
  margin: "0 auto",
  backgroundColor: "#fff",
  borderRadius: "0.5rem",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  overflow: "hidden",
};

const cardHeaderStyles = {
  padding: "1rem",
  borderBottom: "1px solid #e2e8f0",
  fontSize: "1.25rem",
  fontWeight: "bold",
};

const cardContentStyles = {
  padding: "1rem",
};

const formStyles = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  marginTop: "1rem",
};

const inputStyles = {
  padding: "0.75rem",
  borderRadius: "0.5rem",
  border: "1px solid #e2e8f0",
  fontSize: "1rem",
};

const submitButtonStyles = {
  padding: "0.75rem",
  borderRadius: "0.5rem",
  border: "none",
  backgroundColor: "#4a5568",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};