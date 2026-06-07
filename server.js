const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/gacha', async (req, res) => {
    const { lat, lng, distance, category, freeword } = req.body;
    const apiKey = process.env.GOOGLE_API_KEY;
    const radius = distance || 1000;

    let keyword = category;
    if (freeword) keyword += ` ${freeword}`;

    try {
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&opennow=true&language=ja&key=${apiKey}`;

        const response = await axios.get(url);
        const places = response.data.results;

        if (places.length === 0) {
            return res.status(404).json({ message: '現在営業中のお店が見つかりませんでした。条件を緩めてください。' });
        }

        const randomIndex = Math.floor(Math.random() * places.length);
        const selectedPlace = places[randomIndex];

        const reasons = [
            `「${category}」を求めるあなたに、ここの雰囲気が今宵のベストアンサーだからです。`,
            `今のあなたの気分に最も同調している空間が、ここ以外に見当たらないからです。`,
            `情報過多で疲れたあなたの脳が、無意識にこの場所を求めていたからです。`,
            `もはや説明は不要です。行けばわかります。運命とはそういうものです。`
        ];
        const randomReason = reasons[Math.floor(Math.random() * reasons.length)];

        // 写真URLの生成
        let photoUrl = null;
        if (selectedPlace.photos && selectedPlace.photos.length > 0) {
            const photoRef = selectedPlace.photos[0].photo_reference;
            photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${apiKey}`;
        }

        res.json({
            name: selectedPlace.name,
            address: selectedPlace.vicinity,
            rating: selectedPlace.rating || '評価なし',
            reason: randomReason,
            photoUrl: photoUrl
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'サーバーエラーが発生しました。' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});