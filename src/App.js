import React, { useState, useEffect } from "react";
import axios from "axios";
import { Pie } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import { FaMicrophone } from "react-icons/fa";
import Penny from './Penny.png';
import ParimiMonishImage from './Parimi_Monish_Passport_Image_Main.jpg';
import Mehenaaz from './Mehenaaz.jpg';
import Yaswanth from './Yaswanth.jpg';
import Venu from './Venu.jpg';

Chart.register(ArcElement, Tooltip, Legend);

export default function App() {
  const [selectedPage, setSelectedPage] = useState("Add Income / Expenses");
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
            "#6A5ACD",
            "#00CED1",
            "#FF6347",
            "#40E0D0",
            "#7FFFD4",
            "#8A2BE2",
            "#FF4500",
            "#DDA0DD",
            "#00FA9A",
            "#FFDAB9",
            "#FF7F50",
            "#4682B4",
            "#BA55D3",
            "#708090",
            "#FFE4B5"
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
      alert("Added successfully!");
      fetchExpensesByDate(date);
    } catch (error) {
      console.error(
        "Error adding items:",
        error.response ? error.response.data : error.message
      );
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/delete-expense/${id}/`);
      alert("Successfully Deleted!");
      fetchExpensesByDate(selectedDate);
    } catch (error) {
      console.error(
        "Error deleting items:",
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
        <img src={Penny} style={{ height: '80px', width: '200px' }}></img>
        <nav>
          {["Add Income / Expenses", "analytics", "prediction", "Meet The Team"].map((page) => (
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

      <main style={{ ...mainContentStyles, overflowY: "auto" }}>
        {selectedPage === "Add Income / Expenses" && (
          <div style={{ ...cardStyles, padding: "20px" }}>
            <h2 style={{ ...cardHeaderStyles, textAlign: "center", marginBottom: "20px" }}>
              Add Income / Expenses
            </h2>
            <div style={cardContentStyles}>
              <form onSubmit={handleAddExpense} style={formStyles}>
                <select
                  value={category_type}
                  onChange={(e) => setCategoryType(e.target.value)}
                  style={{ ...inputStyles, marginBottom: "15px" }}
                >
                  <option value="Expenses">Expenses</option>
                  <option value="Income">Income</option>
                </select>

                <input
                  type="text"
                  placeholder="Enter Category (e.g., Groceries or Salary)"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ ...inputStyles, marginBottom: "15px" }}
                />

                <input
                  type="number"
                  placeholder="Enter Amount (e.g., 100 or 3000)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ ...inputStyles, marginBottom: "15px" }}
                />

                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{ ...inputStyles, marginBottom: "15px" }}
                />

                <button type="submit" style={submitButtonStyles}>
                  Add {category_type}
                </button>
              </form>

              <div style={micButtonContainer}>
                <div style={waveStyles}></div>
                <button onClick={handleVoiceInput} style={micButtonStyles}>
                  <FaMicrophone />
                </button>
              </div>

              <p style={{ textAlign: "center", color: "#555", marginTop: "10px" }}>
                Try Saying "Income Salary 5000" or "Expenses Groceries 400"
              </p>
            </div>
          </div>
        )}

        {selectedPage === "analytics" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "20px" }}>
            <div style={{ display: "flex", flexDirection: "row", gap: "20px", justifyContent: "space-between" }}>

              <div style={{ ...cardStyles, flex: "1", display: "flex", flexDirection: "column", padding: "20px" }}>
                <h2 style={cardHeaderStyles}>Expense Analytics</h2>
                <div style={{ ...cardContentStyles, textAlign: "center", flex: 1 }}>
                  {chartData.labels ? (
                    <div style={{ width: "100%", height: "300px", margin: "0 auto" }}>
                      <Pie data={chartData} options={{ maintainAspectRatio: false }} />
                    </div>
                  ) : (
                    <p style={{ color: "#888" }}>No data available for analytics.</p>
                  )}
                </div>
              </div>

              <div style={{ ...cardStyles, flex: "1", display: "flex", flexDirection: "column", padding: "20px", overflowY: "auto" }}>
                <h2 style={cardHeaderStyles}>View Expenses</h2>
                <div style={cardContentStyles}>
                  <label htmlFor="dateInput" style={{ marginRight: "10px", fontWeight: "bold" }}>
                    Select Date:
                  </label>
                  <input
                    id="dateInput"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={inputStyles}
                  />
                  <h3 style={{ marginTop: "20px" }}>Expenses on {selectedDate}</h3>

                  <ul
                    style={{
                      maxHeight: "calc(5 * 3em)",
                      overflowY: "auto",
                      padding: "0",
                      margin: "20px 0",
                      listStyleType: "none",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    {expenses.length === 0 ? (
                      <p style={{ color: "#888" }}>No expenses recorded for this date.</p>
                    ) : (
                      expenses.map((expense) => (
                        <li key={expense.id} style={{ padding: "0.5em 0", borderBottom: "1px solid #ddd" }}>
                          <span>{expense.category} - ₹{parseFloat(expense.amount).toFixed(2)} - </span>
                          <span>{new Date(expense.date).toLocaleDateString()}</span>
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            style={{
                              ...button,
                              marginLeft: "10px",
                              backgroundColor: "#e74c3c",
                              color: "#fff",
                            }}
                          >
                            Delete
                          </button>
                        </li>
                      ))
                    )}
                  </ul>

                  <div style={{ marginTop: "20px" }}>
                    <p>
                      Total Expenses for {selectedDate}: ₹
                      {parseFloat(totalDayExpense || 0).toFixed(2)}
                    </p>
                    <p>
                      Total Expenses for {selectedDate.slice(0, 7)}: ₹
                      {parseFloat(totalMonthExpense || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedPage === "prediction" && (
          <div style={{ ...cardStyles, padding: "20px" }}>
            <h2 style={{ ...cardHeaderStyles, textAlign: "center", marginBottom: "20px" }}>Expense Prediction</h2>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <div style={predictionCardStyles}>
                <h3 style={{ color: "#4CAF50" }}>Next Month's Prediction</h3>
                <button style={{ ...submitButtonStyles, margin: "10px 0" }} onClick={handlePredictExpenses}>
                  Predict Next Month's Expenses
                </button>
                {prediction !== null ? (
                  <p style={{ fontSize: "1.5rem", fontWeight: "bold", margin: "10px 0" }}>
                    ₹ {parseFloat(prediction).toFixed(2)}
                  </p>
                ) : (
                  <p style={{ color: "#888" }}>Click the button to get a prediction!</p>
                )}
              </div>

              <div style={{ flex: 1, marginLeft: "20px" }}>
                <img
                  src="https://cdn.pixabay.com/photo/2013/07/12/14/28/chart-line-148256_1280.png"
                  alt="Monthly Expense Trends Line Graph"
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </div>
            </div>

            <div style={insightsCardStyles}>
              <h3 style={{ color: "#4A5568" }}>Insights</h3>
              <ul style={{ paddingLeft: "20px" }}>
                <li>
                  Monitor your spending trends to make informed financial decisions.
                </li>
                <li>
                  Your predicted expense is based on past spending patterns. Plan accordingly.
                </li>
              </ul>
            </div>
          </div>
        )}

        {selectedPage === "Meet The Team" && (
          <>
            <div style={{ ...cardStyles, width: '600px' }}>
              <h1 style={{ textAlign: 'center', fontWeight: 'bold', fontFamily: 'Poppins, sans-serif' }}>MEET THE TEAM</h1>
            </div>

            <br></br>

            <div style={{ ...cardStyles, display: 'flex', alignItems: 'center', height: '160px', width: '500px' }}>

              <img
                src={Mehenaaz}
                alt="Mehenaaz"
                style={{ width: '100px', height: '100px', borderRadius: '50%', marginRight: '90px', marginLeft: '30px', marginTop: '10px', marginBottom: '10px' }}
              />
              <div>
                <h2 style={{ textAlign: 'center', fontWeight: 'bold', fontFamily: 'Poppins, sans-serif' }}>
                  Shaik Mehenaaz
                </h2>
                <p style={{ textAlign: 'center', fontFamily: 'Poppins, sans-serif' }}>Backend Developer</p>
                <p style={{ textAlign: 'center', fontFamily: 'Poppins, sans-serif' }}>MySQL Database Engineer</p>
              </div>
            </div>

            <br></br>

            <div style={{ ...cardStyles, display: 'flex', alignItems: 'center', height: '160px', width: '500px' }}>

              <img
                src={Venu}
                alt="Venu Charan"
                style={{ width: '100px', height: '100px', borderRadius: '50%', marginRight: '90px', marginLeft: '30px', marginTop: '10px', marginBottom: '10px' }}
              />
              <div>
                <h2 style={{ textAlign: 'center', fontWeight: 'bold', fontFamily: 'Poppins, sans-serif' }}>
                  Guntaka Venu Charan Reddy
                </h2>
                <p style={{ textAlign: 'center', fontFamily: 'Poppins, sans-serif' }}>Full Stack Developer</p>
                <p style={{ textAlign: 'center', fontFamily: 'Poppins, sans-serif' }}>AI/ML Engineer</p>
              </div>
            </div>

            <br></br>

            <div style={{ ...cardStyles, display: 'flex', alignItems: 'center', height: '160px', width: '500px' }}>

              <img
                src={Yaswanth}
                alt="Yaswanth"
                style={{ width: '100px', height: '100px', borderRadius: '50%', marginRight: '90px', marginLeft: '30px', marginTop: '10px', marginBottom: '10px' }}
              />
              <div>
                <h2 style={{ textAlign: 'center', fontWeight: 'bold', fontFamily: 'Poppins, sans-serif' }}>
                  Chinthala Yaswanth
                </h2>
                <p style={{ textAlign: 'center', fontFamily: 'Poppins, sans-serif' }}>Frontend Developer</p>
                <p style={{ textAlign: 'center', fontFamily: 'Poppins, sans-serif' }}>ML Engineer</p>
              </div>
            </div>

            <br></br>

            <div style={{ ...cardStyles, display: 'flex', alignItems: 'center', height: '160px', width: '500px' }}>

              <img
                src={ParimiMonishImage}
                alt="Parimi Monish"
                style={{ width: '100px', height: '100px', borderRadius: '50%', marginRight: '90px', marginLeft: '30px', marginTop: '10px', marginBottom: '10px' }}
              />
              <div >
                <h2 style={{ textAlign: 'center', fontWeight: 'bold', fontFamily: 'Poppins, sans-serif' }}>
                  Parimi Monish
                </h2>
                <p style={{ textAlign: 'center', fontFamily: 'Poppins, sans-serif' }}>Frontend Developer</p>
                <p style={{ textAlign: 'center', fontFamily: 'Poppins, sans-serif' }}>MySQL Database Engineer</p>
              </div>
            </div>
          </>
        )}

      </main>
    </div>
  );
}

const predictionCardStyles = {
  flex: "0 0 250px",
  padding: "20px",
  border: "1px solid #ddd",
  borderRadius: "10px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  textAlign: "center",
};

const insightsCardStyles = {
  marginTop: "30px",
  padding: "20px",
  border: "1px solid #ddd",
  borderRadius: "10px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  backgroundColor: "#f9f9f9",
};

const layoutStyles = {
  display: "flex",
  height: "100vh",
  overflow: "hidden",
};

const sidebarStyles = {
  width: "14rem",
  height: "100vh",
  backgroundColor: "#2d3748",
  color: "#fff",
  padding: "1.5rem",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  position: "fixed",
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
  width: "20%",
  textAlign: "center",
  padding: "0.75rem",
  margin: "1rem",
  borderRadius: "0.5rem",
  border: "none",
  color: "#FF0000",
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

const submitButtonHoverStyles = {
  backgroundColor: "#45a049",
};