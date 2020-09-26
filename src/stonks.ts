import { DateTime } from "luxon";

type DailyPrices = <T = unknown>(
  symbol: string,
  outputsize?: string,
  datatype?: string,
  interval?: string
) => Promise<T>;

export interface AlphaVantageClient {
  data: {
    daily: DailyPrices;
  };
}

type ClosePrice = { "4. close": string };

type DailyData = {
  "Time Series (Daily)": Record<string, ClosePrice>;
};

export class Stonks {
  readonly alphavantageClient: AlphaVantageClient;

  constructor(alphavantageClient: AlphaVantageClient) {
    this.alphavantageClient = alphavantageClient;
  }

  async getLatestClosePrice(symbol: string): Promise<number | null> {
    const today = DateTime.local();
    const yesterday = today.minus({ days: 1 });
    const data = (await this.alphavantageClient.data.daily(
      symbol
    )) as DailyData;
    const closePrices = data["Time Series (Daily)"];
    let latestPrice: ClosePrice;
    if (today.toISODate() in closePrices) {
      latestPrice = closePrices[today.toISODate()];
    } else {
      latestPrice = closePrices[yesterday.toISODate()];
    }
    return parseFloat(latestPrice["4. close"] as string);
  }
}
