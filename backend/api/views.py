from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse, HttpResponseNotAllowed, JsonResponse
import json
import pandas as pd
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import google.generativeai as genai

# tf-ifd
import string
from sklearn.feature_extraction.text import TfidfVectorizer
import nltk
try:
    nltk.data.find("tokenizers/punkt")
    nltk.data.find("corpora/stopwords")
except LookupError:
    nltk.download("punkt")
    nltk.download("stopwords")
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from collections import Counter
# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response

prompt="""You are a data analysis assistant. I will provide a sample snippet of a CSV file containing user feedback.

Your task is to analyze the headers and values to identify:
        1. Which columns contain "Free Text Feedback" (sentences, comments, reviews) suitable for sentiment analysis.
        2. Which columns contain "Numerical Ratings" (scores, scales, 1-5, 0-10) suitable for statistical averaging.

        For every "Numerical Rating" column, you must estimate the logical Minimum and Maximum possible values based on the data context (e.g., if you see values like 4 and 5, the Max is likely 5. If you see 8 and 9, the Max is likely 10).

        Return ONLY a valid JSON object with no additional text or markdown formatting. Use this exact schema:

        {
        "text_columns": ["Exact Name of Column 1", "Exact Name of Column 2"],
        "rating_columns": {
            "Exact Name of Rating Column A": {"min": 0, "max": 5},
            "Exact Name of Rating Column B": {"min": 1, "max": 10}
        }
        }
        Also in text_columns you should give best sentiment analysis column for index 1 which can help in getting recommendations

        Here is the csv snippet:
        """
prompt2="""
Based on the below comments , provide 3 or 4 actionable recommendations for improvement in JSON format.
"""

prompt3="""
You are given a dictionary where each column (e.g., "feedback", "review") contains the top 10 extracted keywords with their occurrence counts, like:

{
  feedback: [("tasty",4), ("delicious",3), ("beautiful",2), ("scenic",1)],
  review: [("slow",5), ("service",4), ("friendly",3), ("staff",2)]
}

Your task:
1. Group related keywords into meaningful **themes** (e.g., Food, Ambience, Service).
2. For each theme, provide:
   - **quotes**: a list of representative keywords from the input that fit the theme.
   - **overall**: a short, natural-language summary sentence capturing the sentiment or insight of that theme.
3. Return the output as a in json format, preserving the column names.

Example output:

{
  feedback: [
    {
      "Food": {
        "quotes": ["tasty", "delicious"],
        "overall": ["Food was appreciated, no negative comments."]
      },
      "Ambience": {
        "quotes": ["beautiful", "scenic"],
        "overall": ["The environment was praised for its beauty."]
      }
    }
  ],
  review: [
    {
      "Service": {
        "quotes": ["slow", "service", "friendly", "staff"],
        "overall": ["Service was mixed: slow but staff were friendly."]
      }
    }
  ]
}
"""

class HelloView(APIView):
    def get(self, request):
        return Response({"message": "Hello from Django!"})
    
def vaderscore(text):
    # vader
    analyzer=SentimentIntensityAnalyzer()
    return analyzer.polarity_scores(text)['compound']

def sentiment(score):
    if score>=0.05:
        return "Positive"
    elif score<=-0.05:
        return "Negative"
    else:
        return "Neutral"

def preprocess(text):
    stop_words = set(stopwords.words("english"))
    extra=text.lower()
    extra=extra.translate(str.maketrans("","",string.punctuation))
    tokens=word_tokenize(extra)
    tokens=[w for w in tokens if w not in stop_words]
    return tokens

def top_words(extra_list):
    extra=Counter(extra_list)
    return extra.most_common(min(len(extra),10))

@csrf_exempt
def csvdat(request):
    if request.method == "POST":
        try:
            clean_text=""
            themes={}
            body = json.loads(request.body)
            rows = body.get("csvData", [])
            df = pd.DataFrame(rows)
            snippet = df.head(min(len(rows), 5)).to_csv(index=False)

            model = genai.GenerativeModel("models/gemini-2.5-flash")

            # Try to get AI response
            try:
                ai_response = model.generate_content(f"{prompt} '{snippet}'")
            except Exception:
                ai_response = None

            # Default recommended column
            recommended_column = None

            if not ai_response or not ai_response.text or ai_response.text.strip() in ["", "{}", "null"]:
                # Fallback: pick longest text column
                column_len = {col: df[col].astype(str).str.len().mean() for col in df.columns}
                longest_col = max(column_len, key=column_len.get)
                df[longest_col+"_score"] = df[longest_col].apply(vaderscore)
                df[longest_col+"_sent"] = df[longest_col+"_score"].apply(sentiment)
                recommended_column = longest_col
            else:
                clean_text = ai_response.text.replace("```json", "").replace("```", "").strip()
                try:
                    column_config = json.loads(clean_text)
                except Exception:
                    column_config = {"text_columns": [], "rating_columns": {}}

                # Handle text columns
                for idx, col in enumerate(column_config.get("text_columns", [])):
                    if idx == 0:
                        recommended_column = col
                    df[col+"_score"] = df[col].apply(vaderscore)
                    df[col+"_sent"] = df[col+"_score"].apply(sentiment)
                    # tf-idf
                    try:
                        combined_text = " ".join(df[col].tolist())
                        tokens = preprocess(combined_text)
                        tokens=top_words(tokens)
                        themes[col]=tokens
                    except Exception as e:
                        print(f"Yeah {e}")

                # Handle rating columns
                for col, bounds in column_config.get("rating_columns", {}).items():
                    a, b = bounds.get("min", 0), bounds.get("max", 10)
                    df[col] = pd.to_numeric(df[col], errors="coerce")
                    try:
                        df[col+"_score"] = 2 * ((df[col] - a) / (b - a)) - 1
                    except Exception as e:
                        print(f"error hai {e}")
                    try:
                        df[col+"_sent"] = df[col+"_score"].apply(sentiment)
                    except Exception as e:
                        print(f"golmaal {e}")
                        continue

            # Sort safely
            if recommended_column:
                df_sorted = df.sort_values(recommended_column+"_score")
            else:
                df_sorted = df

            some_negative_comments = df_sorted.head(5)[recommended_column].tolist() if recommended_column else []
            some_positive_comments = df_sorted.tail(5)[recommended_column].tolist() if recommended_column else []

            # Generate recommendations
            try:
                ai_recommendations = model.generate_content(
                    f"""{prompt2}
                Worst complaints: {some_negative_comments}.
                Best reviews: {some_positive_comments}.
                Return JSON with a list of recommendations.
                recommendations:[recommendaion1,recommendatin2]
                Do not include any other fields.
                
                """
                )
                rec_clean = ai_recommendations.text.replace("```json", "").replace("```", "").strip()
                try:
                    final_recommendations = json.loads(rec_clean)
                except Exception:
                    final_recommendations = {"recommendations": "No recommendations"}
            except Exception as e:
                # print("JSON parse error:", e) for debugging
                # for m in genai.list_models():
                #      print(m.name, m.supported_generation_methods)

                final_recommendations = {"recommendations": "No a recommendations"}
            
            try:
                ai_themes = model.generate_content(
                    f"""
                {json.dumps(themes, ensure_ascii=False)}  {prompt3}
                """
                )
                rec_clean2 = ai_themes.text.replace("```json", "").replace("```", "").strip()
                try:
                    final_themes = json.loads(rec_clean2)
                except Exception as e:
                    print("JSON parse error:", e) 
                    final_themes = {"themes": "No themes"}
            except Exception as e:
                print("JSON parse error:", e) 
                # for debugging
                # for m in genai.list_models():
                #      print(m.name, m.supported_generation_methods)

                final_themes = {"themes": "No a themes"}

            response_data = {
                "data": df_sorted.to_dict(orient="records"),
                "recommendations": final_recommendations.get("recommendations", []),
                "extra": clean_text,
                "extra2": 4,
                "themes": themes,
                "themes2": final_themes
            }
            return JsonResponse(response_data, safe=False)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return HttpResponseNotAllowed(['POST'])