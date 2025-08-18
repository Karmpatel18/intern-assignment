import dotenv from 'dotenv';

dotenv.config();

export const config = {
	port: parseInt(process.env.PORT || '4000', 10),
	jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',
	mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/assessments',
	geminiApiKey: process.env.GEMINI_API_KEY || '',
}; 