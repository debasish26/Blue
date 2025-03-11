const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
require('dotenv').config();
const app = express();


app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

app.use(express.json());


mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
    fullName: String,
    email: { type: String, unique: true },
    phone: String,
    password: String,
    isVerified: { type: Boolean, default: false },
    location: {
        coordinates: {
            lat: Number,
            lon: Number
        },
        placeName: String,
        lastUpdated: { type: Date, default: Date.now }
    }
});

const User = mongoose.model('User', userSchema);

const notificationSchema = new mongoose.Schema({
    userEmail: { type: String, required: true },
    type: { type: String, enum: ['weather', 'flood', 'earthquake', 'cyclone', 'other'], required: true },
    title: String,
    severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
    source: String,
    isRead: { type: Boolean, default: false },
    sentAt: { type: Date, default: Date.now },
    triggerTime: { type: Date, required: false }
});

const Notification = mongoose.model('Notification', notificationSchema);

const taskSchema = new mongoose.Schema({
    userEmail: { type: String, required: true },
    task: { type: String, required: true },
    time: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', taskSchema);

const mailSchema = new mongoose.Schema({
    userEmail: { type: String, required: true },
    subject: String,
    content: String,
    sentAt: { type: Date, default: Date.now },
    type: { type: String, enum: ['weather', 'task', 'system'], default: 'system' }
});

const Mail = mongoose.model('Mail', mailSchema);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Load environment variables


// Fast2SMS SMS sending function
async function sendSMS(phone, message) {
    try {
        const response = await axios.post(
            'https://www.fast2sms.com/dev/bulkV2',
            {
                route: 'q', // Quick Transactional route
                sender_id: process.env.FAST2SMS_SENDER_ID || 'WTHAPP', // Use approved sender ID
                numbers: phone, // Recipient phone number
                message: message, // SMS content
                flash: 0, // Non-flash SMS
                language: 'english',
            },
            {
                headers: {
                    'Authorization': process.env.FAST2SMS_API_KEY, // Use environment variable
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log(`SMS sent to ${phone}:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error sending SMS to ${phone}:`, error.response?.data || error.message);
        // Do not throw error, just log it
    }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHERMAP_API_KEY;
const DEFAULT_LOCATION = { lat: 37.7749, lon: -122.4194 }; // San Francisco coordinates
const AI_SERVER_URL = 'http://localhost:5001';

// Weather data fetching function
async function getWeatherData(lat = DEFAULT_LOCATION.lat, lon = DEFAULT_LOCATION.lon) {
    try {
        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`;
        const response = await axios.get(url);
        return response.data.list;
    } catch (error) {
        console.error(`Error fetching OpenWeatherMap data: ${error.message}`);
        return null;
    }
}

// Enhance the weather analysis function
async function analyzeWeatherAndStoreAlert(taskTime, task, userEmail) {
    try {
        const user = await User.findOne({ email: userEmail });
        const lat = user?.location?.coordinates?.lat || DEFAULT_LOCATION.lat;
        const lon = user?.location?.coordinates?.lon || DEFAULT_LOCATION.lon;

        const weatherData = await getWeatherData(lat, lon);
        if (!weatherData) {
            console.error('No weather data available');
            return false;
        }

        const taskTimestamp = Math.floor(taskTime.getTime() / 1000);
        const twoHoursBefore = taskTimestamp - 2 * 3600;
        const oneHourAfter = taskTimestamp + 3600;

        const alertForecast = weatherData.reduce((prev, curr) =>
            Math.abs(curr.dt - twoHoursBefore) < Math.abs(prev.dt - twoHoursBefore) ? curr : prev
        );
        const taskForecast = weatherData.reduce((prev, curr) =>
            Math.abs(curr.dt - taskTimestamp) < Math.abs(prev.dt - taskTimestamp) ? curr : prev
        );

        const weatherCondition = taskForecast.weather[0].main;
        const temperature = taskForecast.main.temp;
        const humidity = taskForecast.main.humidity;
        const windSpeed = taskForecast.wind.speed;
        const rain = taskForecast.rain ? taskForecast.rain['3h'] : 0;

        let severity = 'low';
        let recommendations = [];

        if (temperature > 35) {
            severity = 'high';
            recommendations.push('Extreme heat conditions. Consider rescheduling outdoor activities.');
        } else if (temperature > 30) {
            severity = 'medium';
            recommendations.push('High temperature. Stay hydrated and avoid prolonged sun exposure.');
        } else if (temperature < 5) {
            severity = 'medium';
            recommendations.push('Cold conditions. Dress warmly and be cautious of icy surfaces.');
        }

        if (rain > 10) {
            severity = 'high';
            recommendations.push('Heavy rain expected. Consider indoor alternatives.');
        } else if (rain > 5) {
            severity = 'medium';
            recommendations.push('Moderate rain expected. Carry an umbrella.');
        }

        if (windSpeed > 20) {
            severity = 'high';
            recommendations.push('Strong winds expected. Be cautious of outdoor activities.');
        } else if (windSpeed > 10) {
            severity = 'medium';
            recommendations.push('Moderate winds. Secure loose objects.');
        }

        const weatherRecommendations = {
            'Rain': 'Bring rain gear and waterproof clothing.',
            'Snow': 'Snow expected. Check road conditions before traveling.',
            'Thunderstorm': 'Thunderstorms expected. Stay indoors if possible.',
            'Clear': 'Clear weather conditions. Good for outdoor activities.',
            'Clouds': 'Cloudy conditions. Good for most activities.',
            'Fog': 'Foggy conditions. Be cautious while traveling.'
        };

        if (weatherRecommendations[weatherCondition]) {
            recommendations.push(weatherRecommendations[weatherCondition]);
        }

        const alertMessage = `
Weather forecast for your task "${task}":
Temperature: ${temperature}°C
Conditions: ${weatherCondition}
${rain > 0 ? `Expected Rainfall: ${rain}mm\n` : ''}
Wind Speed: ${windSpeed} km/h
Humidity: ${humidity}%

Recommendations:
${recommendations.join('\n')}

${severity === 'high' ? 'Consider rescheduling if the activity is weather-sensitive.' :
  severity === 'medium' ? 'Take necessary precautions before proceeding.' :
  'Weather conditions are favorable for your planned activity.'}
`;

        const alertTime = new Date(taskTime.getTime() - 2 * 60 * 60 * 1000);
        console.log(`Scheduling weather alert for ${alertTime}`);

        const notificationData = {
            userEmail,
            type: "weather",
            title: `Weather Alert for: ${task}`,
            severity,
            location: user?.location?.placeName || 'Your Location',
            description: alertMessage,
            source: "OpenWeatherMap",
            triggerTime: alertTime,
            isRead: false
        };

        const notification = new Notification(notificationData);
        await notification.save();
        console.log(`Weather alert scheduled: ${notification._id}`);
        return true;
    } catch (error) {
        console.error('Error in analyzeWeatherAndStoreAlert:', error);
        return false;
    }
}

// Existing weather fetching function
const getCurrentWeather = async (lat, lon) => {
    try {
        console.log(`📡 Fetching weather for: Lat ${lat}, Lon ${lon}`);
        const weatherResponse = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`
        );
        const airQualityResponse = await axios.get(
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}`
        );
        const forecastResponse = await axios.get(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`
        );

        const aiResponse = await axios.post(`${AI_SERVER_URL}/extreme_weather`, {
            forecast: forecastResponse.data.list,
            location: weatherResponse.data.name
        });

        const weather = weatherResponse.data;
        const aiData = aiResponse.data.today;
        const aqiLevels = ["Good", "Fair", "Moderate", "Poor", "Very Poor"];
        const airQualityIndex = airQualityResponse.data.list[0].main.aqi;
        const airQuality = aqiLevels[airQualityIndex - 1] || "Unknown";

        return {
            status: weather.weather[0].main,
            temperature: weather.main.temp,
            humidity: weather.main.humidity,
            windSpeed: weather.wind.speed,
            rainfall: weather.rain ? weather.rain['1h'] || 0 : 0,
            visibility: weather.visibility / 1000,
            airQuality,
            recommendations: aiData.recommendations || [],
            location: weather.name || "Unknown",
            coordinates: { lat, lon }
        };
    } catch (error) {
        console.error('Error fetching weather data:', error);
        throw error;
    }
};

// Format weather data for email
const formatWeatherEmail = (weatherData, user) => {
    const date = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const getWeatherIcon = (status) => {
        const icons = {
            'Clear': '☀️',
            'Clouds': '☁️',
            'Rain': '🌧️',
            'Drizzle': '🌦️',
            'Thunderstorm': '⛈️',
            'Snow': '❄️',
            'Mist': '🌫️',
            'default': '🌤️'
        };
        return icons[status] || icons.default;
    };

    const getTempColor = (temp) => {
        if (temp >= 30) return '#FF4444';
        if (temp >= 20) return '#FF8C00';
        if (temp >= 10) return '#32CD32';
        return '#00BFFF';
    };

    const getRecommendationIcon = (rec) => {
        if (rec.toLowerCase().includes('umbrella')) return '☔';
        if (rec.toLowerCase().includes('sun') || rec.toLowerCase().includes('hat')) return '🧢';
        if (rec.toLowerCase().includes('wind')) return '💨';
        if (rec.toLowerCase().includes('rain')) return '🌧️';
        return '💡';
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 20px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .weather-icon { font-size: 48px; margin: 10px 0; }
        .temperature { font-size: 36px; font-weight: bold; color: ${getTempColor(weatherData.temperature)}; margin: 10px 0; }
        .weather-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .weather-item { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
        .recommendations { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; }
        .recommendation-item { margin: 10px 0; padding: 10px; background: white; border-radius: 5px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .footer { margin-top: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Daily Weather Update</h1>
          <p>${user.location.placeName || 'Your Location'}</p>
          <p>${date}, ${time}</p>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <div class="weather-icon">${getWeatherIcon(weatherData.status)}</div>
            <div class="temperature">${weatherData.temperature}°C</div>
            <p style="font-size: 18px; color: #666;">${weatherData.status}</p>
          </div>
          <div class="weather-grid">
            <div class="weather-item"><p>💧 Humidity</p><strong>${weatherData.humidity}%</strong></div>
            <div class="weather-item"><p>💨 Wind Speed</p><strong>${weatherData.windSpeed} km/h</strong></div>
            <div class="weather-item"><p>🌧️ Rainfall</p><strong>${weatherData.rainfall} mm</strong></div>
            <div class="weather-item"><p>👁️ Visibility</p><strong>${weatherData.visibility} km</strong></div>
          </div>
          <div class="recommendations">
            <h2>Today's Recommendations</h2>
            ${weatherData.recommendations.map(rec => `
              <div class="recommendation-item">${getRecommendationIcon(rec)} ${rec}</div>
            `).join('')}
          </div>
          <div class="footer">
            <p>Stay safe and have a great day!</p>
            <p>Weather App Team</p>
            <p style="color: #999;">This is an automated weather report. Please do not reply to this email.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
};

// Send daily weather emails at 7 AM
async function sendDailyWeatherEmails() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (currentHour === 7 && currentMinute === 34) {
        try {
            console.log('Sending daily weather emails and SMS...');
            const users = await User.find({ isVerified: true });

            for (const user of users) {
                if (!user.location.coordinates.lat || !user.location.coordinates.lon) {
                    console.log(`Skipping user ${user.email}: No coordinates available`);
                    continue;
                }

                const weatherData = await getCurrentWeather(
                    user.location.coordinates.lat,
                    user.location.coordinates.lon
                );

                // Send Email
                const emailContent = formatWeatherEmail(weatherData, user);
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: user.email,
                    subject: `Daily Weather Update for ${user.location.placeName || 'Your Location'}`,
                    html: emailContent,
                });
                console.log(`Weather email sent to ${user.email}`);

                // Send SMS
                const smsMessage = `🌞 Weather Update for ${user.location.placeName || 'Your Location'} 🌞
Temp: ${weatherData.temperature}°C | ${weatherData.status}
💧 Humidity: ${weatherData.humidity}% | 💨 Wind: ${weatherData.windSpeed} km/h
${weatherData.recommendations.length > 0 ? 'Tip: ' + weatherData.recommendations[0] : 'Have a great day!'}`;
                await sendSMS(user.phone, smsMessage);
                console.log(`Weather SMS sent to ${user.phone}`);
            }
        } catch (error) {
            console.error('Error sending daily weather emails/SMS:', error);
        }
    }
}

// Modify the sendPendingNotifications function to store emails
async function sendPendingNotifications() {
    try {
        const now = new Date();
        const notifications = await Notification.find({
            triggerTime: { $lte: now },
            isRead: false,
        });

        for (const notification of notifications) {
            const user = await User.findOne({ email: notification.userEmail });
            if (!user || !user.email) continue;

            // Send Email
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: notification.title,
                text: `${notification.description}\n\nLocation: ${notification.location}\nSource: ${notification.source}`,
            });

            // Store the sent email
            const mail = new Mail({
                userEmail: user.email,
                subject: notification.title,
                content: `${notification.description}\n\nLocation: ${notification.location}\nSource: ${notification.source}`,
                type: notification.type,
            });
            await mail.save();

            // Send SMS
            try {
                const smsMessage = `⚠️ ${notification.title} ⚠️\n${notification.description.split('\n')[0]}...\nLocation: ${notification.location}\nSeverity: ${notification.severity.toUpperCase()}`;
                await sendSMS(user.phone, smsMessage);
                console.log(`Notification SMS sent to ${user.phone}`);
            } catch (smsError) {
                console.error(`Failed to send SMS for notification ${notification._id}:`, smsError);
            }

            notification.isRead = true;
            await notification.save();
            console.log(`Notification processed for ${user.email}: ${notification.title}`);
        }
    } catch (error) {
        console.error('Error sending notifications:', error);
    }
}

// Helper function to generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Registration endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, phone, password, coordinates } = req.body;
        const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email or phone already exists' });
        }

        let locationData = {};
        if (coordinates?.lat && coordinates?.lon) {
            const placeName = await axios.get(
                `https://api.openweathermap.org/geo/1.0/reverse?lat=${coordinates.lat}&lon=${coordinates.lon}&limit=1&appid=${OPENWEATHERMAP_API_KEY}`
            ).then(res => res.data[0]?.name || 'Unknown Location');
            locationData = {
                coordinates: { lat: coordinates.lat, lon: coordinates.lon },
                placeName,
                lastUpdated: new Date(),
            };
        }

        const verificationCode = generateOTP();

        // Send Email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify Your Email',
            text: `Your verification code is: ${verificationCode}`,
        });

        // Send SMS
        const smsMessage = `🌟 Welcome to Weather App, ${name}! 🌟
Your verification code is: ${verificationCode}
Please verify within 10 minutes!`;
        await sendSMS(phone, smsMessage);

        res.status(200).json({
            message: 'Registration initiated. Check your email and SMS for verification code.',
            tempUser: { name, email, phone, password, verificationCode, location: locationData },
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Verification endpoint
app.post('/api/verify', async (req, res) => {
    try {
        const { email, emailCode, tempUser } = req.body;
        if (tempUser.verificationCode !== emailCode) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        const user = new User({
            fullName: tempUser.name,
            email: tempUser.email,
            phone: tempUser.phone,
            password: tempUser.password,
            isVerified: true,
            location: tempUser.location
        });

        await user.save();

        const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        res.json({
            message: 'Email verified successfully',
            token,
            email: user.email,
            user: { id: user._id, name: user.fullName, email: user.email, phone: user.phone, location: user.location },
        });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ message: 'Server error during verification' });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { identifier, password, coordinates } = req.body;
        const user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] });
        if (!user || !user.isVerified || password !== user.password) {
            return res.status(401).json({ message: 'Invalid credentials or unverified account' });
        }

        if (coordinates?.lat && coordinates?.lon) {
            const placeName = await axios.get(
                `https://api.openweathermap.org/geo/1.0/reverse?lat=${coordinates.lat}&lon=${coordinates.lon}&limit=1&appid=${OPENWEATHERMAP_API_KEY}`
            ).then(res => res.data[0]?.name || 'Unknown Location');
            user.location = {
                coordinates: { lat: coordinates.lat, lon: coordinates.lon },
                placeName,
                lastUpdated: new Date()
            };
            await user.save();
        }

        const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        res.json({
            message: 'User logged in successfully',
            token,
            email: user.email,
            user: { id: user._id, name: user.fullName, email: user.email, phone: user.phone, location: user.location },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Notification endpoint
app.post('/api/notifications', async (req, res) => {
    try {
        const { userEmail, type, title, severity, location, description, source } = req.body;

        if (!userEmail || !type || !title || !description) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const notification = new Notification({
            userEmail,
            type,
            title,
            severity: severity || 'medium',
            location: location || 'Your Location',
            description,
            source: source || 'System',
            isRead: false,
            triggerTime: new Date(),
        });
        await notification.save();

        const mail = new Mail({
            userEmail,
            subject: title,
            content: description,
            type: 'weather',
            sentAt: new Date(),
        });
        await mail.save();

        // Send Email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: title,
            text: description,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #ff6b6b;">${title}</h2>
                    <p style="white-space: pre-line;">${description}</p>
                    <p style="color: #666; font-size: 0.9em;">
                        Location: ${location || 'Your Location'}<br>
                        Severity: ${severity || 'medium'}<br>
                        Source: ${source || 'System'}
                    </p>
                    <hr>
                    <p style="color: #999; font-size: 0.8em;">
                        This is an automated alert. Please do not reply to this email.
                    </p>
                </div>
            `,
        });

        // Send SMS
        const user = await User.findOne({ email: userEmail });
        const smsMessage = `🚨 ${title} 🚨
${description.split('\n')[0]}...
Location: ${location || 'Your Location'}
Severity: ${severity.toUpperCase()}`;
        await sendSMS(user.phone, smsMessage);

        res.status(201).json({
            message: 'Notification created successfully',
            notificationId: notification._id,
            mailId: mail._id,
        });
    } catch (error) {
        console.error('Error in /api/notifications:', error);
        res.status(500).json({
            error: 'Failed to create notification',
            details: error.message,
        });
    }
});

// Get tasks for a user
app.get('/api/tasks', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const tasks = await Task.find({ userEmail: decoded.email });

        console.log('Fetched tasks for user:', decoded.email, tasks);

        res.json({
            tasks: tasks.map(task => ({
                id: task._id.toString(),
                time: task.time,
                task: task.task
            }))
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        if (task.userEmail !== decoded.email) {
            return res.status(403).json({ error: 'Unauthorized to delete this task' });
        }

        await Task.findByIdAndDelete(req.params.id);
        console.log('Task deleted:', req.params.id);
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid task ID' });
        }
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

app.post('/api/add_task', async (req, res) => {
    try {
        const { task, time, userEmail } = req.body;

        if (!task || !time || !userEmail) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newTask = new Task({
            userEmail,
            task,
            time,
        });
        await newTask.save();
        console.log('New task created:', newTask);

        const taskTime = new Date();
        const [hours, minutes] = time.split(':');
        taskTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        await analyzeWeatherAndStoreAlert(taskTime, task, userEmail);

        const user = await User.findOne({ email: userEmail });
        const smsMessage = `✅ Task Added Successfully! ✅
Task: ${task}
Time: ${time}
We'll notify you 2 hours before with weather updates!`;
        await sendSMS(user.phone, smsMessage);

        res.json({
            task: {
                id: newTask._id.toString(),
                time,
                task,
            },
        });
    } catch (error) {
        console.error('Error adding task:', error);
        res.status(500).json({ error: 'Failed to add task' });
    }
});

// Run both tasks every minute
setInterval(() => {
    sendPendingNotifications();
    sendDailyWeatherEmails();
}, 60 * 1000);

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
