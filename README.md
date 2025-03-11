# Blue - Real-Time Weather Alert System

![Blue Banner](https://via.placeholder.com/1200x400?text=Blue+Weather+Alert+System)

## 🌟 Introduction
**Blue** is a real-time weather alert system designed to provide instant notifications about critical weather conditions. It integrates with multiple APIs to deliver accurate forecasts and warnings, ensuring users stay informed about upcoming weather events.

## 🚀 Features
- Real-time weather alerts
- User authentication system
- Interactive disaster map
- Community help system
- Multi-language support (coming soon)

## 📸 Screenshots / Demo
### 📷 Screenshots
![image](https://github.com/user-attachments/assets/12ff3a8b-55d8-4a76-9da0-f6e6e560e928)

![image](https://github.com/user-attachments/assets/4197ea54-be8b-4f84-b027-dac9388dfd62)

![image](https://github.com/user-attachments/assets/4504f52a-513f-4a38-9558-c78f1cdcc124)

![image](https://github.com/user-attachments/assets/11445eac-62b2-4e8f-9faf-563b84ef53ea)


![image](https://github.com/user-attachments/assets/c086b1ee-c8e2-45e5-852c-f51e2d4fe27b)


### 🎥 Demo Video
```
Coming Soon...
```

## 📂 Folder Structure
```
Blue/
│-- Frontend/   # React-based frontend
│-- Backend/    # Express.js-based backend
```

## 🛠️ Prerequisites
Before setting up **Blue**, ensure you have the following installed:
- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Python 3](https://www.python.org/)
- [Git](https://git-scm.com/)

## 🔥 Installation Guide
Follow these steps to set up **Blue** on your local machine.

### 1️⃣ Clone the Required Repositories
```sh
git clone https://github.com/debasish26/Blue-AI_Integration
git clone https://github.com/debasish26/Blue-AI-MODEL
git clone https://github.com/debasish26/Blue
```

### 2️⃣ Set Up Blue-AI_Integration
```sh
cd Blue-AI_Integration
python3 flood_api.py &
python3 server.py &
```

### 3️⃣ Set Up Blue-AI-MODEL
```sh
cd ../Blue-AI-MODEL
python -m uvicorn main:app --reload &
```

### 4️⃣ Backend Setup
```sh
cd ../backend
npm install
cp .env.example .env  # Update the .env file with necessary values
node server.js
```

### 5️⃣ Frontend Setup
```sh
cd ../frontend
npm install
cp .env.example .env  # Update the .env file with necessary values
npm run dev
```

## ⚙️ Environment Variables
Create a `.env` file in both `frontend` and `backend` directories and update them with the required credentials.

**Backend `.env` Example:**
```
PORT=your_backend_port
WEATHER_API_KEY=your_weather_api_key
USER_PHONE_NUMBER=your_phone_number
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email
EMAIL_PASSWORD=your_email_password
GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key
OPENWEATHERMAP_API_KEY=your_openweathermap_api_key
```

**Frontend `.env` Example:**
```
REACT_APP_WEATHER_API_KEY=your_weather_api_key
REACT_APP_WEATHERBIT_API_KEY=your_weatherbit_api_key
```

## 🎯 Usage
Once all services are running, access the application at:
```
http://localhost:5173
```
Login or sign up to start receiving weather alerts!

## 👥 Contributing
We welcome contributions! Feel free to fork this repository, make changes, and submit a pull request.

## 📝 License
This project is licensed under the MIT License.

---
✨ **Stay safe with Blue – Your real-time weather alert companion!** ✨
