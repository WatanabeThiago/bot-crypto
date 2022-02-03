require("dotenv").config();
console.log(process.env);
const CHAT_ID = -707426581; //coloque o seu chat id aqui
let lastAction = "";

let saldo = 100;
let saldoAplicado = 0;

let lastBuy = 0;
function calcRSI(closes) {
  let high = 0;
  let down = 0;

  for (let i = closes.length - 15; i < closes.length - 1; i++) {
    const difference = closes[i] - closes[i - 1];
    if (difference >= 0) {
      high += difference;
    } else {
      down -= difference;
    }
  }
  const relativeForce = high / down;
  return 100 - 100 / (1 + relativeForce);
}

async function bot() {
  const { Telegraf } = require("telegraf");
  const bot = new Telegraf(process.env.TELEGRAM_KEY);

  const axios = require("axios");

  const response = await axios.get(
    "https://api.binance.com/api/v3/klines?symbol=BTCBUSD&interval=1m"
  );
  const candle = response.data[499];
  const price = parseFloat(candle[4]);

  const candles = response.data.map((candle) => parseFloat(candle[4]));

  const rsi = calcRSI(candles);
  console.table({ RSI: rsi, variation: price / lastBuy });

  // Vender
  if (price > lastBuy && rsi >= 55 && lastAction === "compra") {
    saldo = saldoAplicado * (price / lastBuy);
    saldoAplicado = 0;
    lastAction = "venda";
    bot.telegram.sendMessage(
      CHAT_ID,
      `💰 Vender!\n\nPreço: U$**${price}**\n\nRSI: ${rsi}\n\nSaldo aplicado: ${saldoAplicado}\n\nSaldo disponível: ${saldo}\n\nMultiplicador: ${price / lastBuy}`
    );
    // Comprar
  }
  if (rsi <= 33 && rsi > 25 && lastAction !== `compra`) {
    lastBuy = price;
    saldoAplicado = saldo;
    saldo = 0;
    lastAction = `compra`;
    bot.telegram.sendMessage(
      CHAT_ID,
      `🛒 Comprar!\n\nPreço: U$**${price}**\n\nRSI: ${rsi}\n\nSaldo aplicado: ${saldoAplicado}\n\nSaldo disponível: ${saldo}`
    );
  }
}

setInterval(bot, 1000);

bot();
