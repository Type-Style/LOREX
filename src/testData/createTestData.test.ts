import axios, { AxiosError } from 'axios';


async function callServer(timestamp = new Date().getTime(), query: string, expectStatus: number = 200, method: string = "HEAD") {
  const url = new URL("http://localhost:80/write?");
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
  const entries = 6;
  const start = { lat: 52.51625, lon: 13.37661 };
  const end = { lat: 52.50960, lon: 13.27457 };
  const diff = {lat: end.lat - start.lat, lon: end.lon - start.lon};

  // eslint-disable-next-line jest/expect-expect
  it('create ' + entries + ' entries', () => {
    return new Promise<void>(done => {

      for (let i = 0; i < entries; i++) {
        const lat = (start.lat + (diff.lat / (entries - 1) * i)).toFixed(8);
        const lon = (start.lon + (diff.lon / (entries - 1) * i)).toFixed(8);
        setTimeout(async () => {
          await callServer(undefined, `user=xx&lat=${lat}&lon=${lon}&timestamp=R3Pl4C3&hdop=${Math.floor(Math.random() * 15) + 1}&altitude=${i+1}&speed=${38 + i*2.5}&heading=${262 + Math.floor(Math.random() * 20) - 10}&key=test`, 200, "GET");
          console.log("called server " + (i + 1) + "/" + entries);

        }, 1000 * 30 * i);
      }

      setTimeout(async () => {
        done();
      }, 1000 * 30 * entries);
    })
  }, 1000 * 30 * (entries + 1));

});







