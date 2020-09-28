type QuoteResponse = {
  "Global Quote": GlobalQuote;
};

type GlobalQuote = {
  "05. price": string;
};

type AlphaVantageAPI = <T = unknown>(
  symbol: string,
  outputsize?: string,
  datatype?: string,
  interval?: string
) => Promise<T>;

export interface AlphaVantageClient {
  data: {
    quote: AlphaVantageAPI;
  };
}

export class Stonks {
  readonly alphavantageClient: AlphaVantageClient;

  constructor(alphavantageClient: AlphaVantageClient) {
    this.alphavantageClient = alphavantageClient;
  }

  async getLatestClosePrice(symbol: string): Promise<number | null> {
    const data = (await this.alphavantageClient.data.quote(
      symbol
    )) as QuoteResponse;
    return parseFloat(data["Global Quote"]["05. price"]);
  }
}
