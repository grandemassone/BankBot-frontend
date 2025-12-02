# 🏦 BankBot - Frontend Client

A modern, responsive web interface for the BankBot AI Assistant.
Built with performance and type-safety in mind, simulating a premium digital banking experience.

## 🚀 Tech Stack
* **Framework:** React 18
* **Language:** TypeScript (Strict typing for financial data reliability)
* **Build Tool:** Vite (Ultra-fast HMR)
* **Styling:** TailwindCSS
* **Routing:** React Router
* **Containerization:** Docker

## ✨ Key Features
* **Modern Chat UI:** Responsive chat interface optimized for mobile and desktop.
* **Real-time Feedback:** Typing indicators and dynamic message rendering.
* **Secure Architecture:** Clean separation of concerns with API integration layers.

## 🛠️ How to Run Locally

### Prerequisites
* Node.js (v18+)
* npm

### Installation
1. Clone the repository:
   ```bash
   git clone [https://github.com/grandemassone/bank-chatbot-frontend.git](https://github.com/grandemassone/bank-chatbot-frontend.git)
2. Install dependencies:
   ```bash
   npm install
3. Run the development server:
   ```bash
   npm run dev
The app will be available at http://localhost:5173.

### 🐳 Running with Docker
```bash
docker build -t bankbot-frontend .
docker run -p 5173:5173 bankbot-frontend
```
Developed by Salvador Davide Passarelli during internship at WeBeetle.
