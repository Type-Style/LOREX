import axios, { AxiosError } from 'axios';
import fs from "fs";
import path from "path";

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


function getData(filePath: string) {
  const data = fs.readFileSync(filePath);
  return JSON.parse(data.toString());
}

function isInRange(actual: string | number, expected: number, range: number) {
  return Math.abs(Number(actual) - expected) <= range;
}

describe('HEAD /write', () => {
  it('with all parameters correctly set it should succeed', async () => {
    await callServer(undefined, "user=xx&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=150.000&heading=180.0&key=test", 200);
  });

  it('without key it sends 403', async () => {
    await callServer(undefined, "user=xx&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=150.000&heading=180.0", 403);
  });

  it('with user length not equal to 2 it sends 422', async () => {
    await callServer(undefined, "user=x&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=150.000&heading=180.0&key=test", 422);
  });

  it('with lat not between -90 and 90 it sends 422', async () => {
    await callServer(undefined, "user=xx&lat=91.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=150.000&heading=180.0&key=test", 422);
  });

  it('with lon not between -180 and 180 it sends 422', async () => {
    await callServer(undefined, "user=xx&lat=45.000&lon=181.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=150.000&heading=180.0&key=test", 422);
  });

  it('with timestamp to old sends 422', async () => {
    const timestamp = new Date().getTime() - 24 * 60 * 60 * 1000 * 2; // two days ago
    await callServer(timestamp, "user=xx&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=150.000&heading=180.0&key=test", 422);
  })

  it('with hdop not between 0 and 100 it sends 422', async () => {
    await callServer(undefined, "user=xx&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=101.0&altitude=5000.000&speed=150.000&heading=180.0&key=test", 422);
  });

  it('with altitude not between 0 and 10000 it sends 422', async () => {
    await callServer(undefined, "user=xx&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=10001.000&speed=150.000&heading=180.0&key=test", 422);
  });

  it('with speed not between 0 and 300 it sends 422', async () => {
    await callServer(undefined, "user=xx&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=301.000&heading=180.0&key=test", 422);
  });

  it('with heading not between 0 and 360 it sends 422', async () => {
    await callServer(undefined, "user=xx&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=150.000&heading=361.0&key=test", 422);
  });
});


describe("GET /write", () => {
  const date = new Date();
  const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const dirPath = path.resolve(__dirname, '../../dist/data/');
  const filePath = path.resolve(dirPath, `data-${formattedDate}.json`);

  it('there should a file of the current date', async () => {
    await await callServer(undefined, "user=xx&lat=52.51451&lon=13.35105&timestamp=R3Pl4C3&hdop=20.0&altitude=5000.000&speed=150.000&heading=180.0&key=test", 200, "GET");

    fs.access(filePath, fs.constants.F_OK, (err) => {
      expect(err).toBeFalsy();
    });
  });

  it('the file contains valid JSON', async () => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      expect(err).toBeFalsy();
      try {
        JSON.parse(data);
      } catch (e) {
        expect(e).toBeFalsy();
      }
    });
  });

  it('after second call and the JSON entries length is 2', () => {
    return new Promise<void>(done => {
      setTimeout(async () => {
        await await callServer(undefined, "user=xx&lat=52.51627&lon=13.37770&timestamp=R3Pl4C3&hdop=50&altitude=4000.000&speed=150.000&heading=180.0&key=test", 200, "GET");
        const jsonData = getData(filePath);

        expect(jsonData.entries.length).toBe(2);

        done();
      }, 3500);
    })
  });

  it('the time is correct', () => {
    const jsonData = getData(filePath);
    const entry = jsonData.entries.at(-1)

    expect(entry.time.created).toBeGreaterThan(date.getTime());
    expect(entry.time.diff).toBeGreaterThan(3.5);
    expect(entry.time.diff).toBeLessThan(4);


    const germanDayPattern = "(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag)";
    const dayOfMonthPattern = "(0?[1-9]|[12][0-9]|3[01])";
    const germanMonthPattern = "(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)";
    const yearPattern = "(\\d{4})";
    const timePattern = "([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]";
    const pattern = new RegExp(`^${germanDayPattern}, ${dayOfMonthPattern}. ${germanMonthPattern} ${yearPattern} um ${timePattern}$`);
    const string = entry.time.createdString;
    expect(pattern.test(string)).toBeTruthy();

  });

  it('the distance is correct', () => {
    const jsonData = getData(filePath);
    const entry = jsonData.entries.at(-1)

    expect(entry.distance.horizontal).toBeCloseTo(1813.926);
    expect(entry.distance.vertical).toBe(-1000);
    expect(entry.distance.total).toBeCloseTo(2071.311);
  });

  it('the angle is correct', () => {
    const jsonData = getData(filePath);
    const entry = jsonData.entries.at(-1)

    expect(entry.angle).toBeCloseTo(83.795775);
  });

  it('the speed is correct', () => {
    const jsonData = getData(filePath);
    const entry = jsonData.entries.at(-1)

    expect(isInRange(entry.speed.horizontal, 515, 10)).toBe(true);
    expect(isInRange(entry.speed.vertical, -284, 10)).toBe(true);
    expect(isInRange(entry.speed.total, 588, 15)).toBe(true);
  });

  it('check ignore', async () => {
    let jsonData = getData(filePath);
    let entry = jsonData.entries[1];
    const lastEntry = jsonData.entries[0];

    expect(entry.ignore).toBe(false); // current one to be false allways
    expect(lastEntry.ignore).toBe(true); // last one to high hdop to be true

    await await callServer(undefined, "user=xx&lat=52.51627&lon=13.37770&timestamp=R3Pl4C3&hdop=50&altitude=4000.000&speed=150.000&heading=180.0&key=test", 200, "GET");
    jsonData = getData(filePath);
    entry = jsonData.entries[1]; // same data point, but not last now therefore ignore true
    expect(entry.ignore).toBe(true);
  });
});

describe('API calls', () => {
  test(`1000 api calls`, async () => {
    for (let i = 0; i < 1000; i++) {
      const url = `http://localhost:80/write?user=xx&lat=${(52 + Math.random()).toFixed(3)}&lon=${(13 + Math.random()).toFixed(3)}&timestamp=${new Date().getTime()}&hdop=${(25 * Math.random()).toFixed(3)}&altitude=${i}&speed=88.888&heading=${(360 * Math.random()).toFixed(3)}&key=test`;
      const response = await axios.get(url);
      expect(response.status).toBe(200);
    }
  }, 20000); // adjust this to to fit your setup

  test(`length of json should not exceed 1000`, async () => {
    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const dirPath = path.resolve(__dirname, '../../dist/data/');
    const filePath = path.resolve(dirPath, `data-${formattedDate}.json`);
    const jsonData = getData(filePath);
    expect(jsonData.entries.length).toBeLessThanOrEqual(1000);
  });
});


describe('/read', () => {
  test(`returns json`, async () => {
    const response = await axios.get("http://localhost:80/read?index=0");
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toEqual(expect.stringContaining('application/json'));
  });
  test(`index parameter to long`, async () => {
    try {
      await axios.get("http://localhost:80/read?index=1234");
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        expect(axiosError.response.status).toBe(400);
      } else {
        console.error(axiosError);
      }
    }
  });
  test(`index parameter to be a number`, async () => {
    try {
      await axios.get("http://localhost:80/read?index=a9");
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        expect(axiosError.response.status).toBe(400);
      } else {
        console.error(axiosError);
      }
    }
  });
  test(`index parameter reduces length of json`, async () => {
    const response = await axios.get("http://localhost:80/read?index=999");
    expect(response.data.entries.length).toBe(1);
  });
});