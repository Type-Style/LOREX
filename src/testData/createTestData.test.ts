import axios, { AxiosError } from 'axios';
import dotenv from "dotenv";

dotenv.config();

const MODE = process.env.MODE;
const SERVER = MODE == "PROD" ? process.env.ROOT : 'http://localhost:80';
const environmentKey =  process.env.KEY as string ;
const key = MODE == "PROD" ?  Buffer.from(environmentKey, 'base64').toString('utf-8') : "test";
console.log("Sending Test Data to: " + SERVER);

async function callServer(timestamp = new Date().getTime(), query: string, expectStatus: number = 200, method: string = "HEAD") {
  const url = new URL(`${SERVER}/write?`);
  url.search = "?" + query;
  const params = new URLSearchParams(url.search);
  params.set("timestamp", timestamp.toString());
  url.search = params.toString();

  let response;
  if (expectStatus == 200) {
    if (method == "GET") {
      response = await axios.get(url.toString());
    } else {
      response = await axios.head(url.toString());
    }
    expect(response.status).toBe(expectStatus);
  } else {
    try {
      await axios.head(url.toString());
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        expect(axiosError.response.status).toBe(expectStatus);
      } else {
        console.error(axiosError);
      }
    }
  }
}




describe('test Data', () => {
  const entries = 7;
  const start = { lat: 52.51625, lon: 13.37661 };
  const end = { lat: 52.50960, lon: 13.27457 };
  const diff = {lat: end.lat - start.lat, lon: end.lon - start.lon};
  const bonusEntry = {lat: 52.516097, lon: 13.261351};
  const eta = Date.now() + 151 * 1000;

  // eslint-disable-next-line
  it('create ' + entries + ' entries', () => {
    return new Promise<void>(done => {

      for (let i = 0; i < entries -1; i++) {
        const lat = (start.lat + (diff.lat / (entries - 2) * i)).toFixed(8);
        const lon = (start.lon + (diff.lon / (entries - 2) * i)).toFixed(8);
        setTimeout(async () => {
          console.log("calling server? " + (i + 1) + "/" + entries);
          await callServer(undefined, `user=xx&lat=${lat}&lon=${lon}&timestamp=R3Pl4C3&hdop=${Math.floor(Math.random() * 8.5)}&altitude=${i+1}&speed=${39 + i*2.5}&heading=${262 + Math.floor(Math.random() * 25) - 10}&eta=${eta}&eda=${(6.94*1000  * ((entries - 1 - i) / (entries - 1))  ).toFixed(1)}&key=${key}`, 200, "GET");
          console.log("called server! " + (i + 1) + "/" + entries);

        }, 1000 * 30 * i);
      }

      setTimeout(async () => {
        console.log("calling server? " + entries + "/" + entries);
        await callServer(undefined, `user=xx&lat=${bonusEntry.lat}&lon=${bonusEntry.lon}&timestamp=R3Pl4C3&hdop=${Math.floor(Math.random() * 11) + 1}&altitude=${entries}&speed=${18.5}&heading=${315}&eta=0&eda=0&key=${key}`, 200, "GET");
        console.log("called server! " + entries + "/" + entries);
        done();
      }, 1000 * 30 * entries);
    })
  }, 1000 * 30 * (entries + 1.25));

});







