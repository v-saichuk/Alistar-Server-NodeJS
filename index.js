import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import checkAuth from './utils/checkAuth.js';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import orderRoutes from './routes/orders.routes.js';
import productRoutes from './routes/products.routes.js';
import reviewsRoutes from './routes/reviews.routes.js';
import courseRoutes from './routes/course.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import userRoutes from './routes/user.routes.js';
import roleRoutes from './routes/roles.routes.js';
import languageRoutes from './routes/language.routes.js';
import informationRoutes from './routes/information.routes.js';
import categoryRoutes from './routes/categories.routes.js';
import templateRoutes from './routes/templates.routes.js';
import contactUsRoutes from './routes/contact.routes.js';
import seoRoutes from './routes/seo.routes.js';
import { uploadImage, handleImageUpload } from './utils/imageUploader.js';
import { deleteImage } from './utils/imageDelete.js';

const PORT = process.env.PORT || 8585;
mongoose.set('strictQuery', true);
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: process.env.LIMIT_UPLOAD_IMAGE }));
app.use('/upload', express.static('uploads'));

const server = app.listen(PORT, () => {
    console.log(`========== Server started on port ${PORT} ==========`);
});

// initWebSocket(server); // Ініціалізуємо WebSocket сервер

const start = async (req, res) => {
    try {
        await mongoose.connect(process.env.MONGO_URL).then(() => {
            console.log('========== ✅ DB CONNECTED! ==========');
        });
    } catch (err) {
        console.log('⛔️ Server error!', err.message);
        process.exit(1);
    }
};

app.post('/upload', uploadImage, handleImageUpload); // Завантаження зображень
app.post('/image/delete', checkAuth, deleteImage); // Видалення зображень

app.use(authRoutes);
app.use(orderRoutes);
app.use(productRoutes);
app.use(reviewsRoutes);
app.use(courseRoutes);
app.use(settingsRoutes);
app.use(userRoutes);
app.use(roleRoutes);
app.use(languageRoutes);
app.use(informationRoutes);
app.use(categoryRoutes);
app.use(templateRoutes);
app.use(contactUsRoutes);
app.use(seoRoutes);

start();
