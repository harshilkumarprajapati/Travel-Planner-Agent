# ✈️ TripSage AI — Intelligent Travel Planner

> An AI-powered travel planner built with **Python Flask** and **IBM Watsonx.ai (Granite)** models. Features a beautiful chat-based travel assistant UI, trip dashboard, itinerary planner, budget estimator, weather tips, destination explorer, and traveler profile support.

![TripSage AI](https://img.shields.io/badge/Powered%20by-IBM%20Granite%20AI-0062ff?style=flat-square&logo=ibm)
![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square&logo=python)
![Flask](https://img.shields.io/badge/Flask-3.0-green?style=flat-square&logo=flask)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-purple?style=flat-square&logo=bootstrap)

---

## 🌟 Features

| Feature | Description |
|---|---|
| 💬 **AI Chat Assistant** | Natural conversation with IBM Granite AI for trip planning |
| 🗺️ **Itinerary Generator** | Day-wise travel plans with Morning/Afternoon/Evening slots |
| 💰 **Budget Estimator** | Detailed cost breakdown with visual bar charts |
| 🌤️ **Weather Tips** | Season-aware travel advisories and packing recommendations |
| 🧭 **Destination Explorer** | 16+ India & international destinations with filters |
| 👤 **Traveler Profile** | Save travel style, dietary, accessibility, and interests |
| 🌙 **Dark / Light Mode** | Fully responsive with theme persistence |
| 🎙️ **Voice Input** | Speech-to-text chat input (browser supported) |
| 🧳 **7 Travel Styles** | Budget, Luxury, Adventure, Family, Pilgrimage, Honeymoon, Solo |
| 🌐 **Multilingual** | Responds in the user's language automatically |

---

## 🗂️ Project Structure

```
travel_planner/
├── app.py                  # Flask backend + Watsonx.ai integration
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variables template
├── .env                    # Your secrets (NOT committed)
├── templates/
│   └── index.html          # Full frontend (single page)
└── static/
    ├── css/
    │   └── style.css       # Master stylesheet (dark/light themes)
    └── js/
        └── app.js          # Frontend application logic
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Python 3.10 or higher
- IBM Cloud account (free tier works)
- IBM Watsonx.ai project

### Step 1 — Get IBM Watsonx.ai Credentials

1. Sign up / log in at [https://cloud.ibm.com](https://cloud.ibm.com)
2. Create an **API Key**: Go to **Manage → Access (IAM) → API Keys** → Create
3. Create a **Watsonx project**: Go to [https://dataplatform.cloud.ibm.com](https://dataplatform.cloud.ibm.com) → New Project
4. Copy your **Project ID** from Project → Manage → General tab

### Step 2 — Clone & Configure

```bash
# Navigate into the project folder
cd travel_planner

# Copy the environment template
cp .env.example .env
```

Edit `.env` and fill in your credentials:
```env
WATSONX_API_KEY=your_ibm_cloud_api_key
WATSONX_PROJECT_ID=your_project_id
WATSONX_URL=https://us-south.ml.cloud.ibm.com
WATSONX_MODEL_ID=ibm/granite-3-3-8b-instruct
FLASK_SECRET_KEY=your_secure_random_string
FLASK_ENV=development
PORT=5000
```

### Step 3 — Install Dependencies

```bash
# Create a virtual environment (recommended)
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install packages
pip install -r requirements.txt
```

### Step 4 — Run the App

```bash
python app.py
```

Visit: **http://localhost:5000** 🎉

---

## 🤖 Customizing the AI Agent

Open `app.py` and find the `AGENT_INSTRUCTIONS` block at the top and the `SYSTEM_PROMPT` variable.

You can customize:
- **`AGENT_PERSONA`** — Name, tone, language behavior
- **`TRAVEL_STYLE_SPECIALIZATION`** — Which travel styles to emphasize
- **`ITINERARY_POLICY`** — Format of day-wise plans
- **`BUDGET_POLICY`** — Default currency, breakdown format
- **`SAFETY_RULES`** — Emergency contacts, advisory rules
- **`WEATHER_POLICY`** — Season warnings, packing lists
- **`RECOMMENDATION_STYLE`** — How specific/general to be
- **`RESTRICTED_TOPICS`** — What the AI should not discuss

Example customization for **India-only pilgrimage specialist**:
```python
SYSTEM_PROMPT = """You are PilgrimSage, an expert guide for spiritual travel in India.
Focus exclusively on pilgrimage circuits: Char Dham, Vaishno Devi, Tirupati,
Sabarimala, Shirdi, Vrindavan, Mathura, Puri Jagannath, and other sacred sites.
Always mention darshan timings, prasad customs, dress codes, and nearest IRCTC trains."""
```

---

## 🚀 Deployment Instructions

### Local Machine (Development)

```bash
python app.py
# Access: http://localhost:5000
```

### Local Machine (Production-grade with Gunicorn)

```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

---

### ☁️ Render (Free Tier)

1. Push your code to GitHub (ensure `.env` is in `.gitignore`)
2. Go to [https://render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `gunicorn app:app`
6. Add Environment Variables in Render dashboard:
   - `WATSONX_API_KEY`
   - `WATSONX_PROJECT_ID`
   - `WATSONX_URL`
   - `WATSONX_MODEL_ID`
   - `FLASK_SECRET_KEY`
   - `FLASK_ENV=production`

7. Deploy! 🚀

---

### 🔵 IBM Cloud (Code Engine)

```bash
# 1. Install IBM Cloud CLI
# https://cloud.ibm.com/docs/cli

# 2. Login
ibmcloud login --sso

# 3. Target Code Engine project
ibmcloud ce project create --name tripsage-ai
ibmcloud ce project select --name tripsage-ai

# 4. Create a container registry secret (if using private images)
# OR deploy directly from source:
ibmcloud ce application create \
  --name tripsage-ai \
  --image icr.io/your-namespace/tripsage-ai:latest \
  --port 5000 \
  --env WATSONX_API_KEY=your_key \
  --env WATSONX_PROJECT_ID=your_project_id \
  --env FLASK_ENV=production \
  --min-scale 0 \
  --max-scale 3
```

**Or deploy using IBM Cloud Foundry:**
```bash
# Create manifest.yml
cat > manifest.yml << EOF
applications:
  - name: tripsage-ai
    command: gunicorn app:app
    memory: 512M
    env:
      WATSONX_API_KEY: your_key
      WATSONX_PROJECT_ID: your_project_id
      FLASK_ENV: production
EOF

ibmcloud cf push
```

---

### 🐳 Docker

```dockerfile
# Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "app:app"]
```

```bash
docker build -t tripsage-ai .
docker run -p 5000:5000 --env-file .env tripsage-ai
```

---

## 🔑 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Main application |
| `POST` | `/api/chat` | Send chat message |
| `POST` | `/api/quick-plan` | Generate quick itinerary |
| `POST` | `/api/budget-estimate` | Get budget breakdown |
| `POST` | `/api/weather-tips` | Get weather information |
| `POST` | `/api/save-profile` | Save traveler profile |
| `GET` | `/api/get-profile` | Retrieve saved profile |
| `GET` | `/api/get-itinerary` | Retrieve current itinerary |
| `POST` | `/api/clear-chat` | Clear conversation history |
| `GET` | `/api/destinations` | Get destination data |
| `GET` | `/api/health` | Health check |

---

## 🎨 UI Features

- **Responsive**: Works on mobile, tablet, and desktop
- **Dark / Light Mode**: Toggle with moon/sun button, persists in localStorage
- **Smooth Animations**: Chat messages, loading plane, card hover effects
- **Markdown Rendering**: AI responses rendered with proper formatting (headings, tables, lists, code)
- **Voice Input**: Browser-native speech recognition
- **Toast Notifications**: Non-intrusive feedback for all actions
- **Loading Overlay**: Full-screen animated loading for long AI requests

---

## 🔒 Security Notes

1. **Never commit `.env`** — add it to `.gitignore`
2. **FLASK_SECRET_KEY** — use a secure random value in production
3. **API Keys** — store only in environment variables, never in code
4. **Session storage** — uses filesystem sessions; use Redis for production scale

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

## 🙏 Built With

- [IBM Watsonx.ai](https://www.ibm.com/products/watsonx-ai) — Granite foundation models
- [Flask](https://flask.palletsprojects.com/) — Python web framework
- [Bootstrap 5](https://getbootstrap.com/) — Responsive UI
- [Bootstrap Icons](https://icons.getbootstrap.com/) — Icon library
- [Google Fonts](https://fonts.google.com/) — Inter + Playfair Display
