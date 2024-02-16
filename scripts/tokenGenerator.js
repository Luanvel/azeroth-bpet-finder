const apiKey = "8c2f9aedab6a47e3a8c10555779ff737";
const apiSecret = "PTtm0U73cDB47tx3G6y5z21IrPKxiyre";
const region = "eu";

export function createAccessToken(apiKey, apiSecret, region = "eu") {
  return new Promise((resolve, reject) => {
    const credentials = `${apiKey}:${apiSecret}`;
    const base64Credentials = btoa(credentials);

    const requestOptions = {
      method: "POST",
      headers: {
        Authorization: `Basic ${base64Credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    };

    const requestBody = "grant_type=client_credentials";

    fetch(`https://${region}.battle.net/oauth/token`, {
      ...requestOptions,
      body: requestBody,
    })
      .then((response) => response.json())
      .then(resolve)
      .catch(reject);
  });
}

export { apiKey, apiSecret, region };
