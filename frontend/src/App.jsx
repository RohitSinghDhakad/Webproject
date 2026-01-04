import { useState } from 'react'
import Papa from 'papaparse'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
// import './App.css'
import axios from 'axios'
import { Line,Bar,Pie,Doughnut,Radar } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';
//
import {jsPDF} from "jspdf"

function App() {
  const [color, setColor] = useState("green") 

  const [charttype,setCharttype]=useState(1)

  const [hasresult,setHasresult]=useState(false) // magic area stmulator

  const [csvData,setCsvData]=useState([]) // csv file data

  const [returnData,setReturnData]=useState({}) // return response

  const [hasfile,setHasfile]=useState(0) // uploaded file state

  const textdisplay="text-xl font-light text-red-500" // css of error texts

  const [loading,setLoading]=useState(false)
  const [recommend,setRecommend]=useState(false)

  const [display,setDisplay]=useState(1)

  const [link,setLink]=useState("")

  const [anal,setAnal]=useState(0)

  const chartOptions = {
  responsive: true,
  maintainAspectRatio: false};

// pdf generation

const downloadThemesPDF = () => {
  const pdf = new jsPDF("p", "mm", "a4");
  let y = 20; // vertical position

  pdf.setFontSize(16);
  pdf.text("Themes & Recommendations Report", 10, y);
  y += 10;

  // Loop through columns (feedback, review, etc.)
  Object.entries(returnData["themes2"]).forEach(([column, themeList]) => {
    pdf.setFontSize(14);
    pdf.text(column.toUpperCase(), 10, y);
    y += 8;

    // Loop through each theme object
    themeList.forEach((themeObj) => {
      Object.entries(themeObj).forEach(([themeName, details]) => {
        pdf.setFontSize(12);
        pdf.text(`Theme: ${themeName}`, 12, y);
        y += 6;

        pdf.setFontSize(11);
        pdf.text(`Keywords: ${details.quotes.join(", ")}`, 14, y);
        y += 6;

        // Wrap long text into multiple lines
        const overallText = details.overall.join(" ");
        const splitText = pdf.splitTextToSize(overallText, 180);
        pdf.text(splitText, 14, y);
        y += splitText.length * 6 + 4;
      });
    });

    y += 6; // extra spacing between columns
  });
  pdf.text("RECOMMENDATIONS",10,y);
    y+=10;
  Object.entries(returnData["recommendations"]).forEach(([idx, rec]) => {
    pdf.setFontSize(12);
      const recommend=`${(Number)(idx)+1}: ${rec}`
      const splittext= pdf.splitTextToSize(recommend, 180)
      pdf.text(splittext, 14, y)
        y += splittext.length*6+4;
  });

  pdf.save("report.pdf");
};

const generate = () => {
  switch (anal) {
    case 1:
      return (
        <button
          className="bg-red-400 text-white px-4 pt-2 rounded mt-14 border border-gray-700"
          onClick={() => {
            setAnal(2);
            fetchdata();
          }}
        >
          Analyze
        </button>
      );

    case 2:
      return (
        <button
          className="bg-red-600 text-white px-4 pt-2 rounded mt-14 border border-gray-700"
          onClick={downloadThemesPDF}
        >
          Download
        </button>
      );

    default:
      return (
        <button className="bg-red-400 text-white px-4 pt-2 rounded mt-14 border border-gray-700">
          Analyze
        </button>
      );
  }
};

// Charts

 // Detect Sentiment Sources
const sources = Object.keys(returnData?.data?.[0] || {})
  .filter(key => key.endsWith("_score"))
  .map(key => key.replace("_score", ""));

const view=() => {
  switch(display){
    case 1:

    return <ul className="list-disc list-inside space-y-4">
                {returnData["recommendations"].map((rec, idx) => (
                         <li key={idx}>{rec}</li>
                ))}
              </ul>
    case 2:

    return <ul className="list-disc list-inside space-y-4">
  {Object.entries(returnData["themes2"]).map(([column, themeList]) => (
    <li key={column}>
      <h3 className="font-bold">{column}</h3>
      <ul className="list-disc list-inside ml-6 space-y-2">
        {themeList.map((themeObj, idx) =>
          Object.entries(themeObj).map(([themeName, details]) => (
            <li key={idx}>
              <strong>{themeName}</strong>
              <p>Keywords: {details.quotes.join(", ")}</p>
              <p>{details.overall.join(" ")}</p>
            </li>
          ))
        )}
      </ul>
    </li>
  ))}
</ul>
  }
}

const chartMessage=() => {
  switch(charttype){
    case 1:
     
  return sources.map((src, idx) => {
    const grouped = { Positive: [], Negative: [], Neutral: [] };

    returnData.data.forEach(item => {
      const lab = item[`${src}_sent`];   // e.g. "Positive"
      const sco = item[`${src}_score`];  // e.g. 0.75
      if (grouped[lab]) {
        grouped[lab].push(sco);
      }
    });

    const averages = {
      Positive: grouped.Positive.length
        ? grouped.Positive.reduce((a, b) => a + b, 0) / grouped.Positive.length
        : 0,
      Negative: grouped.Negative.length
        ? grouped.Negative.reduce((a, b) => a + b, 0) / grouped.Negative.length
        : 0,
      Neutral: grouped.Neutral.length
        ? grouped.Neutral.reduce((a, b) => a + b, 0) / grouped.Neutral.length
        : 0,
    };

    const chartData = {
      labels: ["Positive", "Negative", "Neutral"],
      datasets: [
        {
          label: `${src} Average Score`,
          data: [averages.Positive, averages.Negative, averages.Neutral],
          backgroundColor: [
            "rgba(75,192,192,0.6)",
            "rgba(255,99,132,0.6)",
            "rgba(255,206,86,0.6)",
          ],
        },
      ],
    };

    return (
      <div key={`${src}-${idx}`} className='bg-white shadow-md rounded-lg p-4 h-full w-[400px]'>
        <h3>{src} Compound Scores</h3>
        <Bar data={chartData} options={chartOptions}/>
      </div>
    );
  });

    case 2:
  return sources.map((src, idx) => {
    const grouped = { Positive: 0, Negative: 0, Neutral: 0 };
console.log(returnData)
    returnData.data.forEach(item => {
      const lab = item[`${src}_sent`];   // "Positive" / "Negative" / "Neutral"
      if (grouped[lab]!==undefined) {
        grouped[lab]+=1;
      }
    });

    const chartData = {
      labels: ["Positive", "Negative", "Neutral"],
      datasets: [
        {
          label: `${src} Sentiment Counts`,
          data: [grouped.Positive,grouped.Negative,grouped.Neutral],
          backgroundColor: [
            "rgba(75,192,192,0.6)",
            "rgba(255,99,132,0.6)",
            "rgba(255,206,86,0.6)",
          ],
          borderColor: [
              "rgba(75,192,192,1)",
              "rgba(255,99,132,1)",
              "rgba(255,206,86,1)"
              ],
              borderWidth: 1
        },
      ],
    };
    
        return (
      <div key={`${src}-${idx}`} className='bg-white shadow-md rounded-lg p-4 h-full w-[400px]'>
        <h3>{src} Compound Scores</h3>
        <Pie data={chartData} options={chartOptions}/>
      </div>
    );
  });

  case 3:

  return sources.map((src, idx) => {
    const scores = returnData.data.map(item => item[`${src}_score`]);

    // Define bins of width 0.2
    const bins = [];
    for (let i = -1; i < 1; i += 0.2) {
      bins.push({
        range: `${i.toFixed(1)} to ${(i + 0.2).toFixed(1)}`,
        min: i,
        max: i + 0.2,
        count: 0,
      });
    }

    // Count scores in each bin
    scores.forEach(score => {
      bins.forEach(bin => {
        if (score >= bin.min && score < bin.max) {
          bin.count += 1;
        }
      });
    });

    const chartData = {
      labels: bins.map(bin => bin.range),
      datasets: [
        {
          label: `${src} Score Frequency`,
          data: bins.map(bin => bin.count),
          backgroundColor: "rgba(153,102,255,0.6)",
          borderColor: "rgba(153,102,255,1)",
          borderWidth: 1,
        },
      ],
    };

    return (
      <div key={`${src}-${idx}`} className='bg-white shadow-md rounded-lg p-4 h-full w-[400px]'>
        <h3>Histogram of {src} Scores (0.2 bins)</h3>
        <Bar data={chartData} options={chartOptions}/>
      </div>
    );
  });
  default:
    return null;
  }
}

  const fetchdata=async()=>{
    setLoading(true); //show spinner
    try{

      // handling api's transferring csv and taking back response
  const  response= await axios.post("http://127.0.0.1:8000/api/data/",{csvData});
  setReturnData(response.data);
  setRecommend(true)
  setLoading(false);
  setDisplay(1);
  setAnal(2);
    }
    catch(error){
console.error("Error fetching:", error);
    }
    finally{
      setLoading(false)
    }
  }

  const renderMessage = () => {
  switch (hasfile) {
    case 0:
      return <h1 className='text-xl font-light'>Upload CSV file</h1>;
    case 1:
      return <h1 className={textdisplay}>Invalid file type. Please upload a CSV file.</h1>;
    case 2:
      return <h1 className={textdisplay}>File is empty</h1>;
    case 3:
      return <h1 className={textdisplay}>CSV has no data rows.</h1>;
    case 4:
      return <h1 className={textdisplay}>Error parsing file</h1>;
    case 5:
      return <div className="overflow-auto h-full w-full">
                <table>
                <thead>
                  <tr>{Object.keys(csvData[0]).slice(0,19).map((key)=>{
                   return ( <th className='font-normal'>{key}</th>)
                  })}</tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 5).map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).slice(0, 19).map((val, j) => (
                        <td key={j} className="font-light border border-gray-400 px-2 py-1">
                           {val}
                       </td>
                       ))}
                    </tr>
                  ))}
                </tbody>
            </table>
            </div>
    default:
      return <h1>/* CSV few data */</h1>
  }
}; 

  // handle link
   const handleLinkUpload = async () => {
    try {
      // Extract spreadsheet ID from the pasted link
      const match = link.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        alert("Invalid Google Sheet link");
        return;
      }
      const sheetId = match[1];
      console.log("done")
      // Construct CSV export URL
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

      // Fetch CSV using Axios
      const response = await axios.get(csvUrl);

      // Parse CSV with PapaParse
      Papa.parse(response.data, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setCsvData(results.data);
          setHasfile(5);
          setAnal(1);
        },
      });
    } catch (err) {
      console.error("Error fetching CSV:", err);
    }
  };

  const handleCsvUpload=(e)=>{
    const file=e.target.files[0];
    // check file type
    if((file.type !== "text/plain" && file.type !== "text/csv") || !file.name.endsWith(".csv")){
          console.error("Invalid file type. Please upload a CSV file.") //Error 2
          setHasfile(1)
          return
      }

      // check file is empty or not
    if(file){
      if(file.size==0){
        console.error("File is emty") //Error 3
        setHasfile(2)
        return
      }

      // parsing file
      Papa.parse(file,{
        header: true,
        skipEmptyLines: true,
        complete: (results)=>{
          // check row data after header row
          if(results.data.length==0){
            console.error("CSV has no data rows."); //Error 4
            setHasfile(3)
            return 
          }
          console.log("Parsed csv");
          setCsvData(results.data);
          setHasfile(5);
          setAnal(1);
        },
        error:(err)=>{
          console.error("Error parsing file",err.message); //Error 5
          setHasfile(4)
          return
        },
      });
    }
    else{
      console.error("No file selected."); //Error 1
      setHasfile(0)
    }
  };
  

  return (
    <div className='w-full h-screen  flex duration-200 px-0 py-0 mx-0 my-0' style={{ backgroundColor: color}}>
      <div className="w-1/3 bg-pink-200">
      {/* heading */}
        <div className='w-full h-1/16 flex justify-center items-center'><h1 className="text-xl font-bold ">Feedspace</h1></div>

        {/* display box to view 2-3 line of csv and error.*/}
        <div className='w-full h-1/8 flex justify-center items-center bg-pink-200'><div className='w-7/8 h-full  bg-white rounded text-center overflow-hidden'>
          {renderMessage()}
          </div></div>

        {/*upload buttons */}
        <div className='w-full h-1/16 flex justify-center items-center'>
          {/* CSV Upload */}
            <label className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer border border-gray-700">
           Upload CSV
           <input
            type="file"
            accept=".csv"
            onChange={handleCsvUpload}
            className="hidden"
           />
            </label>
            {/* Link Upload */}
            <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter link..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="border px-2 ml-2 mr-0 py-1 rounded"
          />
          <button
            onClick={handleLinkUpload}
            className="bg-green-500 text-white px-4 py-2 rounded border border-gray-700"
          >
            Upload Link
          </button>
          </div>
        </div>

        <div className='w-full flex  h-1/8 justify-center items-center'>
          { generate()}
        </div>
        {/* view buttons */}
        <div className='w-full flex  h-1/8 justify-center items-center'>
        <button className='bg-blue-500 text-white px-4 pt-2 rounded mt-14 border border-gray-700' onClick={()=>
        setDisplay(2)
        }>
          Themes
        </button> 
        <button className='bg-green-500 text-white px-4 pt-2  rounded mt-14 border border-gray-700' 
        onClick={()=> setDisplay(1)
        } >          Recommendations
        </button></div>

        {/* Recommendations and responses */}
        <div className='w-full h-1/2 bg-white flex justify-center items-center'>
        {loading && <p>Analyzing...</p>}
        {recommend && returnData ? (
          <div className='border w-full h-full overflow-y-auto'>
              <ul className="list-disc list-inside space-y-4">
                {/* {returnData["recommendations"].map((rec, idx) => (
                         <li key={idx}>{rec}</li>
                ))} */}
                {view()}
              </ul>
              {/* <p>{JSON.stringify(returnData)}</p> */}
              {/* using this to debug */}
          </div>
        ):<h3>Get Recommendations</h3>
        }
        </div>
      </div>

      {/* Right side - wider */}
      <div className="bg-pink-200 w-2/3 h-full">
        <div className='h-1/16 w-full bg-amber-400 flex justify-center items-center border border-gray-700'><h1 className="tracking-[1em] text-xl font-bold absolute top-0">Magic Area</h1>
        </div>
        <div className='h-1/16 w-full bg-green-700 flex justify-between items-end border'>
          <h1 className="text-xl font-extralight ">chart types</h1>
          <div className='flex items-end'>
            <button className= {`px-4 pt-2 rounded border border-gray-700 text-white 
               ${charttype === 1 ? "bg-orange-700" : "bg-orange-300"}`}
                onClick={() => setCharttype(1)}>Bar</button>
            <button className={`px-4 pt-2 rounded border border-gray-700 text-white 
               ${charttype === 2 ? "bg-orange-700" : "bg-gray-400"}`}
                onClick={() => setCharttype(2)}>Pie</button>
            <button className={`px-4 pt-2 rounded border border-gray-700 text-white 
               ${charttype === 3 ? "bg-orange-700" : "bg-green-500"}`} 
                onClick={() => setCharttype(3)}>His</button>
          </div>
        </div>
        <div className='w-full h-7/8 flex bg-green-700 justify-center items-center rounded-2xl border'>
          <div className='w-[95%] h-[95%] overflow-auto flex bg-white border'>
        {/* {!hasresult ?  */}
         {/* instructions  to use mirascope */}
          
            { recommend && returnData ?
             chartMessage() : 
            <div className='text-center'> 
            <h1 className='text-2xl font-normal'>Mirascope</h1>
            <p className='font-light'>
              “Mira” comes from mirari — to wonder; “Scope” is a lens into detail.
Together, they suggest a tool that turns scattered responses into
patterns worth noticing.
            </p>
            <h1 className='text-xl font-normal'>Description</h1>
            <p className='font-light'>A tool that ingests Google Form results (via pasted form link or uploaded CSV) and
produces an automated summary: sentiment distribution, top themes, representative quotes,
simple charts (bar/pie), and recommended action items. Provides a downloadable summary
report (PDF/HTML).
            </p>
          </div>
          }
          {/* //  : <p></p><MyChart data={data} />*/} 
            </div>
          </div>
      </div>
    </div>
  )
}

export default App
