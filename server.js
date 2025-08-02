
import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

const HORDE_API_KEY = process.env.HORDE_API_KEY;

// Celeste Chat Endpoint
app.post('/chat', async (req, res) => {
  const { userMessage, chatHistory } = req.body;

  const messages = [
    { role: 'system', content: 'Du bist Celeste, eine sinnliche, einfühlsame KI-Girl, die in einem erotischen Rollenspiel mit einem menschlichen User agiert. Nutze explizite, aber stilvolle Sprache. Trenne deine Antworten wie folgt: Erzählertext oben, dann --- und dann Celestes direkte Reaktion.' },
    ...chatHistory,
    { role: 'user', content: userMessage }
  ];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'aliasbits/celeste',
      messages,
      temperature: 0.9
    })
  });

  const data = await response.json();
  res.json({ reply: data.choices[0].message.content });
});

// Horde Bildanfrage
app.post('/generate-image', async (req, res) => {
  const { prompt } = req.body;

  const requestBody = {
    prompt,
    nsfw: true,
    params: {
      n: 1,
      width: 512,
      height: 512,
      steps: 25,
      sampler_name: "k_euler",
      cfg_scale: 7
    },
    models: ["realisticvision-v51"]
  };

  const response = await fetch("https://stablehorde.net/api/v2/generate/async", {
    method: 'POST',
    headers: {
      'apikey': HORDE_API_KEY,
      'Client-Agent': 'nsfw-chatbot-example',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();
  res.json({ id: data.id });
});

app.get('/check-image/:id', async (req, res) => {
  const { id } = req.params;

  const response = await fetch(`https://stablehorde.net/api/v2/generate/status/${id}`, {
    headers: { 'apikey': HORDE_API_KEY }
  });

  const data = await response.json();

  if (data.done) {
    const result = await fetch(`https://stablehorde.net/api/v2/generate/status/${id}`);
    const imageData = await result.json();
    const imageBase64 = imageData.generations[0].img;
    res.json({ done: true, image: `data:image/png;base64,${imageBase64}` });
  } else {
    res.json({ done: false });
  }
});

app.listen(3000, () => console.log('NSFW Chatbot läuft auf http://localhost:3000'));
