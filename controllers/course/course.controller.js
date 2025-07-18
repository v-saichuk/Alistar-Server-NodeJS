import axios from 'axios';

export const getCourse = async (req, res) => {
    try {
        const { code } = req.params;
        const normalizeCode = code.toLowerCase();

        // Отримуємо сьогоднішню дату
        const today = new Date().toISOString().split('T')[0]; // формат YYYY-MM-DD

        const response = await axios.get(`https://minfin.com.ua/api/coin/day/usd/${normalizeCode}/${today}`);
        const course = response.data.data[0];

        res.json(course);
    } catch (error) {
        res.status(500).json({ success: false, error });
    }
};
