"""
╔══════════════════════════════════════════════════════════════════════════════╗
║           AI-Powered Travel Planner Agent — Flask + IBM Watsonx.ai          ║
╚══════════════════════════════════════════════════════════════════════════════╝

AGENT_INSTRUCTIONS
==================
Customize this section to control the travel agent's personality, tone,
specialization, safety rules, and recommendation policies.

AGENT_PERSONA:
    Name        : "TripSage AI"
    Role        : Expert AI Travel Planner & Cultural Guide
    Tone        : Warm, enthusiastic, helpful, and professionally informative.
                  Balance friendliness with accuracy. Avoid overly casual language.
    Language    : Respond in the same language the user writes in (auto-detect).
                  Default: English. Supported: Hindi, Tamil, Telugu, French, Spanish,
                  Arabic, Mandarin, German, Japanese, and more.

TRAVEL_STYLE_SPECIALIZATION:
    Primary     : All-rounder — budget backpacking, luxury resorts, adventure treks,
                  family holidays, business travel, pilgrimage circuits,
                  solo female travel, honeymoon, group tours.
    India Focus : Cover all 29 states + 7 UTs, Char Dham, Golden Triangle,
                  Northeast India, Andaman, Lakshadweep, heritage circuits,
                  IRCTC trains, Volvo buses, state RTCs, domestic flights.
    International: Visa guidance, forex tips, travel insurance, entry requirements,
                  UNESCO sites, popular backpacker routes.

ITINERARY_POLICY:
    - Always produce day-wise itineraries (Day 1, Day 2 … Day N).
    - Include morning / afternoon / evening activity slots.
    - Suggest at least 2 accommodation tiers (budget & mid-range for economy;
      mid-range & luxury for premium requests).
    - Recommend 3 restaurant options per destination (local, vegetarian-friendly,
      and popular tourist choice).
    - Always mention nearest hospital / emergency number for the destination.

BUDGET_POLICY:
    - Break down costs into: Flights/Transport, Accommodation, Food,
      Sightseeing, Shopping, Miscellaneous.
    - Provide estimates in INR by default; convert to USD/EUR on request.
    - Always add a 10–15 % contingency buffer recommendation.
    - Suggest money-saving tips for budget travelers.

SAFETY_RULES:
    - Never recommend unsafe or politically unstable destinations without
      prominently flagging travel advisories.
    - Always include emergency contacts (local police, embassy, hospital).
    - For solo female travelers: include safety rating and female-friendly tips.
    - Do not share unverified or outdated visa/immigration information; always
      advise checking official government portals.

WEATHER_POLICY:
    - Always mention best travel season and current season for the destination.
    - Flag monsoon, extreme heat, cyclone, or snowfall periods as cautions.
    - Recommend packing list based on the season.

RECOMMENDATION_STYLE:
    - Be specific: name real places, real hotels (with star rating), real
      transport options with approximate prices.
    - If the user hasn't provided budget/dates/group size, ask for them before
      generating a full itinerary — but still offer a quick overview.
    - Offer alternatives: "If you prefer X, you could also try Y."
    - Conclude every itinerary with: Estimated Total Cost, Best Season to Visit,
      and one Pro Tip.

CONVERSATION_FLOW:
    - Greet warmly on first message.
    - If query is vague, ask 3 targeted clarifying questions (destination, dates,
      budget range, group size, travel style).
    - Remember context within the session for follow-up modifications.
    - Support commands: "modify day 2", "add a day", "reduce budget", "family-friendly
      version", "luxury upgrade", etc.

RESTRICTED_TOPICS:
    - Do not engage with non-travel topics unrelated to the trip.
    - Politely redirect: "I'm your travel specialist — let me help you plan
      the perfect trip instead!"
"""

import os
import json
import logging
from datetime import datetime
from flask import Flask, render_template, request, jsonify, session
from flask_session import Session
from dotenv import load_dotenv
from ibm_watsonx_ai import APIClient, Credentials
from ibm_watsonx_ai.foundation_models import ModelInference
from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as GenParams

# ─── Bootstrap ────────────────────────────────────────────────────────────────
load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "tripsage-secret-key-change-in-prod")
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_FILE_DIR"] = "./.flask_session"
app.config["SESSION_PERMANENT"] = False
os.makedirs(".flask_session", exist_ok=True)
Session(app)

# ─── Watsonx.ai Configuration ─────────────────────────────────────────────────
WATSONX_API_KEY    = os.getenv("WATSONX_API_KEY", "")
WATSONX_PROJECT_ID = os.getenv("WATSONX_PROJECT_ID", "")
WATSONX_URL        = os.getenv("WATSONX_URL", "https://au-syd.dai.cloud.ibm.com")
MODEL_ID           = os.getenv("WATSONX_MODEL_ID", "Travel Planner Agent")

# ─── Agent System Prompt (derived from AGENT_INSTRUCTIONS above) ──────────────
SYSTEM_PROMPT = """You are TripSage AI, an expert AI Travel Planner and Cultural Guide created to help users plan perfect trips.

PERSONALITY & TONE:
- Warm, enthusiastic, helpful, and professionally informative
- Balance friendliness with accuracy
- Auto-detect user's language and respond in the same language
- Use clear formatting with headers, bullet points, and emojis sparingly

EXPERTISE AREAS:
- India travel: All states/UTs, pilgrimage circuits (Char Dham, Vaishno Devi, Tirupati), 
  Golden Triangle, Northeast India, Andaman, Kerala backwaters, Rajasthan heritage
- International travel: Visa requirements, forex tips, travel insurance, UNESCO sites
- Travel styles: Budget backpacking, luxury, adventure, family, business, solo, honeymoon, 
  group tours, pilgrimage

ITINERARY FORMAT (always follow this):
- Day-wise plan: Day 1, Day 2 ... Day N
- Each day: Morning / Afternoon / Evening slots
- Include: 2 accommodation options (budget + mid-range OR mid-range + luxury)
- Include: 3 restaurant options per destination
- Always mention nearest hospital and emergency contacts

BUDGET BREAKDOWN FORMAT:
- Flights/Transport | Accommodation | Food | Sightseeing | Shopping | Misc
- Default currency: INR (convert on request)
- Add 10-15% contingency buffer
- Include money-saving tips for budget travelers

SAFETY GUIDELINES:
- Flag travel advisories for unsafe destinations
- Include emergency contacts (police: 100, ambulance: 108, tourist helpline: 1800-11-1363)
- Solo female travel: Include safety ratings and tips
- Advise checking official portals for visa information

WEATHER GUIDANCE:
- Mention best travel season and current season alerts
- Flag monsoon/extreme weather periods
- Recommend packing list based on season

CONVERSATION RULES:
- If query is vague, ask 3 clarifying questions (destination, dates, budget, group size)
- Support modifications: "modify day 2", "add a day", "luxury upgrade", "family-friendly"
- End every itinerary with: Estimated Total Cost + Best Season + 1 Pro Tip
- If asked about non-travel topics, politely redirect

Remember: Be specific with real place names, real hotels with approximate prices, and real transport options."""

def get_watsonx_client():
    """Initialize and return Watsonx.ai client."""
    try:
        credentials = Credentials(
            url=WATSONX_URL,
            api_key=WATSONX_API_KEY
        )
        client = APIClient(credentials)
        return client
    except Exception as e:
        log.error(f"Failed to initialize Watsonx client: {e}")
        return None

def get_ai_response(user_message: str, conversation_history: list) -> dict:
    """
    Send message to Watsonx.ai Granite model and return response.
    
    Args:
        user_message: Current user input
        conversation_history: List of previous messages [{"role": "user/assistant", "content": "..."}]
    
    Returns:
        dict with 'response', 'success', and optional 'error'
    """
    if not WATSONX_API_KEY or not WATSONX_PROJECT_ID:
        return {
            "success": False,
            "error": "Watsonx.ai credentials not configured. Please set WATSONX_API_KEY and WATSONX_PROJECT_ID in your .env file.",
            "response": None
        }

    try:
        credentials = Credentials(url=WATSONX_URL, api_key=WATSONX_API_KEY)
        client = APIClient(credentials)

        model = ModelInference(
            model_id=MODEL_ID,
            api_client=client,
            project_id=WATSONX_PROJECT_ID,
            params={
                GenParams.MAX_NEW_TOKENS: 2048,
                GenParams.MIN_NEW_TOKENS: 50,
                GenParams.TEMPERATURE: 0.7,
                GenParams.TOP_P: 0.95,
                GenParams.TOP_K: 50,
                GenParams.REPETITION_PENALTY: 1.1,
            }
        )

        # Build conversation context
        messages_payload = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        # Add conversation history (last 10 exchanges to stay within token limits)
        for msg in conversation_history[-20:]:
            messages_payload.append(msg)
        
        # Add current user message
        messages_payload.append({"role": "user", "content": user_message})

        # Call the model with chat interface
        response = model.chat(messages=messages_payload)
        
        ai_text = response["choices"][0]["message"]["content"]
        
        log.info(f"Watsonx response received ({len(ai_text)} chars)")
        return {"success": True, "response": ai_text, "error": None}

    except Exception as e:
        log.error(f"Watsonx.ai API error: {e}")
        return {
            "success": False,
            "error": str(e),
            "response": None
        }


# ─── Helper: Quick Travel Tips ────────────────────────────────────────────────
QUICK_DESTINATIONS = {
    "goa": {"type": "Beach", "best_season": "Nov–Feb", "avg_cost": "₹15,000–₹50,000", "highlight": "Beaches, Nightlife, Portuguese Heritage"},
    "manali": {"type": "Mountain", "best_season": "May–Jun, Dec–Jan", "avg_cost": "₹12,000–₹35,000", "highlight": "Snow, Adventure Sports, Rohtang Pass"},
    "kerala": {"type": "Nature", "best_season": "Sep–Mar", "avg_cost": "₹20,000–₹60,000", "highlight": "Backwaters, Ayurveda, Houseboats"},
    "rajasthan": {"type": "Heritage", "best_season": "Oct–Mar", "avg_cost": "₹18,000–₹80,000", "highlight": "Forts, Palaces, Desert Safari"},
    "bali": {"type": "International", "best_season": "Apr–Oct", "avg_cost": "₹60,000–₹1,50,000", "highlight": "Temples, Rice Terraces, Surfing"},
    "paris": {"type": "International", "best_season": "Apr–Jun", "avg_cost": "₹1,50,000–₹4,00,000", "highlight": "Eiffel Tower, Louvre, Cuisine"},
    "dubai": {"type": "International", "best_season": "Nov–Apr", "avg_cost": "₹80,000–₹2,50,000", "highlight": "Burj Khalifa, Desert Safari, Shopping"},
    "varanasi": {"type": "Spiritual", "best_season": "Oct–Mar", "avg_cost": "₹8,000–₹25,000", "highlight": "Ghats, Ganga Aarti, Temples"},
}


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    """Serve the main travel planner interface."""
    if "conversation" not in session:
        session["conversation"] = []
    if "profile" not in session:
        session["profile"] = {}
    if "itinerary" not in session:
        session["itinerary"] = None
    return render_template("index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    """Handle chat messages and return AI responses."""
    data = request.get_json()
    if not data or "message" not in data:
        return jsonify({"success": False, "error": "No message provided"}), 400

    user_message = data["message"].strip()
    if not user_message:
        return jsonify({"success": False, "error": "Empty message"}), 400

    # Get conversation history from session
    conversation = session.get("conversation", [])

    # Get AI response
    result = get_ai_response(user_message, conversation)

    if result["success"]:
        # Update conversation history
        conversation.append({"role": "user", "content": user_message})
        conversation.append({"role": "assistant", "content": result["response"]})
        
        # Keep last 40 messages (20 exchanges) in session
        session["conversation"] = conversation[-40:]
        session.modified = True

        return jsonify({
            "success": True,
            "response": result["response"],
            "timestamp": datetime.now().strftime("%H:%M"),
            "message_count": len(conversation) // 2
        })
    else:
        return jsonify({
            "success": False,
            "error": result["error"],
            "response": "I'm having trouble connecting to the AI service. Please check your credentials and try again."
        }), 500


@app.route("/api/quick-plan", methods=["POST"])
def quick_plan():
    """Generate a quick trip plan based on form inputs."""
    data = request.get_json()
    
    destination = data.get("destination", "")
    days        = data.get("days", 5)
    budget      = data.get("budget", "moderate")
    travel_style= data.get("travel_style", "leisure")
    group_size  = data.get("group_size", 2)
    start_date  = data.get("start_date", "")

    prompt = f"""Create a detailed {days}-day travel itinerary for {destination}.

Trip Details:
- Duration: {days} days
- Budget Level: {budget} (budget/moderate/luxury)
- Travel Style: {travel_style}
- Group Size: {group_size} people
- Travel Dates: {start_date if start_date else 'Flexible'}

Please provide:
1. Complete day-wise itinerary (Morning/Afternoon/Evening for each day)
2. Recommended hotels (2 options with approximate price per night)
3. Must-visit restaurants (3 options)
4. Transportation guide (how to reach + local transport)
5. Budget breakdown table
6. Packing essentials for this destination
7. Pro Tips and Best Season to Visit

Format the response clearly with headers and bullet points."""

    conversation = session.get("conversation", [])
    result = get_ai_response(prompt, conversation)

    if result["success"]:
        conversation.append({"role": "user", "content": prompt})
        conversation.append({"role": "assistant", "content": result["response"]})
        session["conversation"] = conversation[-40:]
        session["itinerary"] = {
            "destination": destination,
            "days": days,
            "budget": budget,
            "travel_style": travel_style,
            "group_size": group_size,
            "start_date": start_date,
            "content": result["response"],
            "generated_at": datetime.now().isoformat()
        }
        session.modified = True
        
        return jsonify({"success": True, "itinerary": result["response"], "timestamp": datetime.now().strftime("%H:%M")})
    else:
        return jsonify({"success": False, "error": result["error"]}), 500


@app.route("/api/budget-estimate", methods=["POST"])
def budget_estimate():
    """Generate a detailed budget estimate."""
    data = request.get_json()

    destination  = data.get("destination", "")
    days         = data.get("days", 5)
    budget_level = data.get("budget_level", "moderate")
    group_size   = data.get("group_size", 2)
    origin       = data.get("origin", "Mumbai")

    prompt = f"""Provide a comprehensive budget breakdown for a trip to {destination}.

Trip Parameters:
- Origin: {origin}
- Destination: {destination}
- Duration: {days} days
- Budget Level: {budget_level}
- Group Size: {group_size} people

Create a detailed budget table with:
1. Flights/Transport (to & fro + local transport)
2. Accommodation ({days} nights)
3. Food & Dining (per day estimate × {days} days)
4. Sightseeing & Entry Fees
5. Activities & Experiences
6. Shopping & Souvenirs
7. Travel Insurance
8. Miscellaneous & Emergencies (10-15% buffer)

TOTAL ESTIMATED COST (per person and total for group)

Also include:
- Budget-saving tips for this destination
- Best value-for-money options
- Hidden costs to watch out for
- Currency and payment tips"""

    result = get_ai_response(prompt, session.get("conversation", []))
    if result["success"]:
        return jsonify({"success": True, "estimate": result["response"]})
    return jsonify({"success": False, "error": result["error"]}), 500


@app.route("/api/weather-tips", methods=["POST"])
def weather_tips():
    """Get weather information and travel tips for a destination."""
    data = request.get_json()
    destination  = data.get("destination", "")
    travel_month = data.get("month", datetime.now().strftime("%B"))

    prompt = f"""Provide weather and travel advisory for {destination} in {travel_month}.

Include:
1. Current weather conditions in {travel_month}
2. Temperature range (min/max)
3. Rainfall/snowfall expectations
4. Best time of day for sightseeing
5. What to pack (clothing + gear)
6. Weather-related travel warnings or advisories
7. Best season to visit overall
8. Seasonal events or festivals in {travel_month}
9. Any weather-related safety precautions"""

    result = get_ai_response(prompt, [])
    if result["success"]:
        return jsonify({"success": True, "weather_info": result["response"]})
    return jsonify({"success": False, "error": result["error"]}), 500


@app.route("/api/save-profile", methods=["POST"])
def save_profile():
    """Save traveler profile preferences."""
    data = request.get_json()
    session["profile"] = {
        "name":          data.get("name", ""),
        "nationality":   data.get("nationality", "Indian"),
        "travel_style":  data.get("travel_style", "leisure"),
        "budget_pref":   data.get("budget_pref", "moderate"),
        "interests":     data.get("interests", []),
        "dietary":       data.get("dietary", ""),
        "accessibility": data.get("accessibility", ""),
        "saved_at":      datetime.now().isoformat()
    }
    session.modified = True
    return jsonify({"success": True, "message": "Profile saved successfully!"})


@app.route("/api/get-profile", methods=["GET"])
def get_profile():
    """Return current session profile."""
    return jsonify({"success": True, "profile": session.get("profile", {})})


@app.route("/api/get-itinerary", methods=["GET"])
def get_itinerary():
    """Return current session itinerary."""
    return jsonify({"success": True, "itinerary": session.get("itinerary", None)})


@app.route("/api/clear-chat", methods=["POST"])
def clear_chat():
    """Clear conversation history."""
    session["conversation"] = []
    session["itinerary"] = None
    session.modified = True
    return jsonify({"success": True, "message": "Conversation cleared."})


@app.route("/api/destinations", methods=["GET"])
def get_destinations():
    """Return quick destination data."""
    return jsonify({"success": True, "destinations": QUICK_DESTINATIONS})


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint."""
    watsonx_configured = bool(WATSONX_API_KEY and WATSONX_PROJECT_ID)
    return jsonify({
        "status": "healthy",
        "watsonx_configured": watsonx_configured,
        "model": MODEL_ID,
        "timestamp": datetime.now().isoformat()
    })


# ─── Main ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV", "development") == "development"
    log.info(f"🌍 TripSage AI Travel Planner starting on port {port}")
    log.info(f"   Watsonx.ai URL  : {WATSONX_URL}")
    log.info(f"   Model           : {MODEL_ID}")
    log.info(f"   Credentials set : {bool(WATSONX_API_KEY and WATSONX_PROJECT_ID)}")
    app.run(host="0.0.0.0", port=port, debug=debug)
