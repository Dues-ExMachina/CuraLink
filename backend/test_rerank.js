const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const test = async () => {
  try {
    const res = await axios.post('https://api-inference.huggingface.co/models/cross-encoder/ms-marco-MiniLM-L-6-v2', {
      inputs: {
        "text": "What is the capital of France?",
        "text_pair": "Paris is the capital of France."
      }
    }, {
      headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` }
    });
    console.log("Response:", res.data);
  } catch (err) {
    if (err.response) {
      console.error("HTTP Error:", err.response.status, err.response.data);
    } else {
      console.error("Error:", err.message);
    }
  }
};
test();
