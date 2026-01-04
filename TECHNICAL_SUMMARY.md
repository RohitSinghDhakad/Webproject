# Technical Summary

## 🏗 Architecture Overview & Design Decisions
- The application window is split into two main sections:
### **Feedspace (Left Panel)**:
- Upper half allows CSV file upload or Google Drive link input.
- Displays a preview of processed CSV data in a table format.
- Includes an Analyze button to generate recommendations and themes.
- Bottom section shows either recommendations or themes, with toggle functionality.
### **Magic Area (Right Panel)**:
- Initially displays brief details about Mirascope.
- After clicking Analyze, it defaults to bar chart visualization.
- Users can switch between bar, pie, and histogram charts for sentiment analysis.
- The split-window design provides intuitive control and easy navigation between data upload, analysis, and visualization.


## 🛠 Tech Stack Details
- **Frontend**: React
- **Backend**: Django
- **Visualization**: Chart.js (bar, histogram, pie charts)
- **Libraries**:
- **NLTK & Scikit-learn** → TF-IDF for themes and quotes
- **VADER** → Sentiment analysis
- **Pandas** → File manipulation and preprocessing
- **API Communication**: Axios (for sending/receiving data)
- **Styling**: Tailwind CSS
- **AI Model**: Gemini Flash 2.5 Pro → Extracts important columns, generates theme quotes, clusters keywords, and provides 3–4 recommendations based on text columns

## 🤖 AI/ML Features
- **TF-IDF Analysis**: Extracts key terms and themes from text data.
- **Sentiment Analysis**: Uses VADER to classify text sentiment and visualize results.
- **Gemini Flash 2.5 Pro**: For clustering and recommendations

## 🧩 AI Tools Used
- Copilot (for coding assistance and productivity).
- Gemini Flash 2.5 Pro (for advanced text analysis and recommendations).

## 🔌 Third-Party Integrations & APIs
- Axios (HTTP requests between frontend and backend)

## 👥 Mentor/Manager Guidance
- Mentors provided guidance on:
- Understanding project flow.
- Selecting appropriate tech stacks.
- Structuring the analysis and visualization pipeline.