# 🏗 Mirascope- Feedback summarizer
**“Mira” comes from mirari — to wonder; “Scope” is a lens into detail. Together, they suggest a tool that turns scattered responses into patterns worth noticing.**

## 📖Description
A tool that ingests Google Form results (via pasted form link or uploaded CSV) and produces an automated summary: sentiment distribution, top themes, representative quotes, simple charts (bar/pie), and recommended action items. Provide a downloadable summary report (PDF/HTML).
My understanding: In this project i have to make a website in which when a user uploads a csv file or google file link based on some human sentiment such as rating of hotel, customer feedback,etc then it provides  themes  of important keywords and 3-4 recommendation for improvement, also it gives charts to understand sentiments.

## ⚙️setup and installation
### 1 Clone the Repository: 
git clone https://github.com/RohitSinghDhakad/Webproject.git
- cd Webproject
### 2 Backend:<br>
**create virtual environment**:
- python -m venv venv
- source venv/bin/activate   # On Mac/Linux
- venv\Scripts\activate      # On Windows
**install required libraries**: 
- pip install django djangorestframework pandas scikit-learn nltk vaderSentiment google-generativeai<br>
**Run migrations**: 
- python backend/manage.py migrate<br>
**Start the Django server**: 
- python backend/manage.py runserver
### 3 Frontend Setup (React + Vite + Tailwind)
**Navigate to the frontend folder**: 
- cd frontend<br>
**install dependencies**: 
- npm install<br>
**Start the React dev server**: 
- npm run dev

## usage guide:
- Open your browser at http://localhost:5173
- Upload a CSV in Feedspace (Left Panel)
- Click Analyze → see recommendations and sentiment charts in Magic Area (Right Panel)

## Features:
- It provides trending themes and representative quotes for columns with text sentiments.
- It gives recommendation for improvement based on text sentiments.
- It displays charts to easily interpret sentiments

## credits and attributions
Youtube: videos of different channels and copilot, gemini to learn Django, react, NLP, chart.js, jsPDF, tf-idf, axios, etc

## demo link:
https://drive.google.com/file/d/1SCyM3nOYQOMltpKJgfElAvm_1JoTm9lZ/view?usp=drivesdk