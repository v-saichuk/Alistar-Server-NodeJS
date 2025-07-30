import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js'; // Заміна на вашу модель користувача
import dotenv from 'dotenv';
dotenv.config();

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: 'https://server.alistar.ltd/api/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Знайти користувача за Google ID
                let user = await User.findOne({ googleId: profile.id });

                if (!user) {
                    // Якщо користувач із таким Google ID не знайдений, шукаємо за email
                    user = await User.findOne({ email: profile.emails[0].value });

                    if (user) {
                        // Якщо користувач знайдений за email, додаємо йому Google ID
                        user.googleId = profile.id;
                        user.avatar = profile.photos[0].value;
                        await user.save();
                    } else {
                        // Якщо користувача немає взагалі, створюємо нового
                        user = new User({
                            googleId: profile.id,
                            email: profile.emails[0].value,
                            firstName: profile.name.givenName || 'Google',
                            lastName: profile.name.familyName || 'User',
                            avatar: profile.photos[0].value,
                            role: '66b38f55c8d6ddcd0c7180d3', // ID ролі за замовчуванням (заміна на реальний ID вашої ролі)
                        });
                        await user.save();
                    }
                }

                done(null, user);
            } catch (error) {
                done(error, null);
            }
        },
    ),
);

// Сериалізація/десериалізація
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

export default passport;
