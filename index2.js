require("dotenv").config();
console.log(process.env);
const CHAT_ID = -627859570; //coloque o seu chat id aqui
let lastAction = "";

let saldo = 100;
let saldoAplicado = 0;
let rsi = 0
let variation = 0

let lastBuy = 0;
function chooseClosesLenght(closes, isBuy) {
  // Se for comprar, cautela.
  if (isBuy) {
    return closes.length - 1;
    // Se for vender, lucra a vontade
  } else {
    return closes.length;
  }
}
function calcRSI(closes, isBuy) {
  let high = 0;
  let down = 0;

  const closesLenght = chooseClosesLenght(closes, isBuy);

  for (let i = closes.length - 4; i < closesLenght; i++) {
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
  

  // Vender
  if (lastAction === "compra") {
    rsi = calcRSI(candles, false)
    variation = price / lastBuy
    console.table({operation: 'Venda.', rsi, variation, saldoAplicado })
    if (price > lastBuy && rsi >= 55) {
      saldo = saldoAplicado * variation;
      saldoAplicado = 0;
      lastAction = "venda";
      bot.telegram.sendMessage(
        CHAT_ID,
        `💰 Vender!\n\nPreço: U$**${price}**\n\nRSI: ${rsi}\n\nSaldo aplicado: ${saldoAplicado}\n\nSaldo disponível: ${saldo}\n\nMultiplicador: ${
          variation
        }`
      );
      // Comprar
    }
  }
  if (lastAction !== `compra`) {
    
    rsi = calcRSI(candles, true)
    console.table({operation: 'Compra.', rsi, saldo})
    if (rsi <= 33 && rsi > 25) {
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
}

setInterval(bot, 1000);

bot();
