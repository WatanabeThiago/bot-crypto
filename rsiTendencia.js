require("dotenv").config();
console.log(process.env);
const CHAT_ID = -627859570; //coloque o seu chat id aqui
let lastAction = "";
const strategy = "RSI Tendencia.";
let saldo = 100;
let saldoAplicado = 0;
let rsi = 0;
let variation = 0;

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

  for (let i = closes.length - 15; i < closesLenght; i++) {
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

function calcTendency(closes) {
  if (closes[490] > closes[499]) {
    // Tendencia de baixa, ou seja, comprar abaixo de 30 e vender acima de 50
    return "down";
  } else {
    // Tendencia de alta, ou seja, comprar abaixo de 50 e vender acima de 70
    return "up";
  }
}

async function bot() {
  const { Telegraf } = require("telegraf");
  const bot = new Telegraf(process.env.TELEGRAM_KEY);

  const axios = require("axios");

  const response = await axios.get(
    "https://api.binance.com/api/v3/klines?symbol=ETHBUSD&interval=1m"
  );
  const candle = response.data[499];
  const price = parseFloat(candle[4]);

  const candles = response.data.map((candle) => parseFloat(candle[4]));

  // Vender
  if (lastAction === "compra") {
    rsi = calcRSI(candles, false);
    variation = price / lastBuy;
    tendency = calcTendency(candles)
    console.table({ operation: "Venda.", rsi, variation, saldoAplicado }); 
    if (tendency === "down" && rsi > 50) {
      if (price > lastBuy) {
        saldo = saldoAplicado * variation;
        saldoAplicado = 0;
        lastAction = "venda";
        bot.telegram.sendMessage(
          CHAT_ID,
          `Estratégia: ${strategy}\n\nTendencia:${tendency}💰 Vender!\n\nPreço: U$**${price}**\n\nRSI: ${rsi}\n\nSaldo aplicado: ${saldoAplicado}\n\nSaldo disponível: ${saldo}\n\nMultiplicador: ${variation}`
        );
        // Comprar
      }
    }
    if (tendency === "up" && rsi > 65) {
      if (price > lastBuy) {
        saldo = saldoAplicado * variation;
        saldoAplicado = 0;
        lastAction = "venda";
        bot.telegram.sendMessage(
          CHAT_ID,
          `Estratégia: ${strategy}\n\nTendencia:${tendency}💰 Vender!\n\nPreço: U$**${price}**\n\nRSI: ${rsi}\n\nSaldo aplicado: ${saldoAplicado}\n\nSaldo disponível: ${saldo}\n\nMultiplicador: ${variation}`
        );
        // Comprar
      }
    }
  }
  if (lastAction !== `compra`) {
    rsi = calcRSI(candles, true);
    tendency = calcTendency(candles)
    console.table({ operation: "Compra.", rsi, saldo, tendency });
    if (tendency === "down" && rsi < 30 && rsi > 23) {
      lastBuy = price;
      saldoAplicado = saldo;
      saldo = 0;
      lastAction = `compra`;
      bot.telegram.sendMessage(
        CHAT_ID,
        `Estratégia: ${strategy}\n\nTendencia:${tendency}🛒 Comprar!\n\nPreço: U$**${price}**\n\nRSI: ${rsi}\n\nSaldo aplicado: ${saldoAplicado}\n\nSaldo disponível: ${saldo}`
      );
    }
    if (tendency === "up" && rsi < 50 && rsi > 40) {
      lastBuy = price;
      saldoAplicado = saldo;
      saldo = 0;
      lastAction = `compra`;
      bot.telegram.sendMessage(
        CHAT_ID,
        `Estratégia: ${strategy}\n\nTendencia:${tendency}🛒 Comprar!\n\nPreço: U$**${price}**\n\nRSI: ${rsi}\n\nSaldo aplicado: ${saldoAplicado}\n\nSaldo disponível: ${saldo}`
      );
    }
  }
}

setInterval(bot, 1000);

bot();
