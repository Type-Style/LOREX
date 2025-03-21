import axios, { AxiosError } from 'axios';
import fs from "fs";
import path from "path";
import qs from "qs";

const date = new Date();
const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const dirPath = path.resolve(__dirname, '../../dist/data/');
const filePath = path.resolve(dirPath, `data-${formattedDate}.json`);


async function callServer(timestamp = new Date().getTime(), query: string, expectStatus: number = 200, method: string = "HEAD", replaceETA: boolean = false,) {
  const url = new URL("http://localhost:80/write?");
  url.search = "?" + query;
  const params = new URLSearchParams(url.search);
  if (replaceETA) {
    const nowTimestamp = new Date().getTime(); // two days ago
    params.set("eta", timestamp.toString());
    params.set("timestamp", nowTimestamp.toString());
  } else {
    params.set("timestamp", timestamp.toString());
  }
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

async function verifiedRequest(url: string, token: string) {
  const response = await axios({
    method: 'get',
    url: url,
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });
  return response;
}



describe('/write', () => {
  // eslint-disable-next-line jest/expect-expect
  it('with all parameters correctly set it should succeed', async () => {
    await callServer(undefined, "user=xx&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=150.000&heading=180.0&key=test", 200);
  });

  // eslint-disable-next-line jest/expect-expect
  it('without key it sends 403', async () => {
    await callServer(undefined, "user=xx&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=150.000&heading=180.0", 403);
  });

  // eslint-disable-next-line jest/expect-expect
  it('with user length not equal to 2 it sends 422', async () => {
    await callServer(undefined, "user=x&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=150.000&heading=180.0&key=test", 422);
  });

  // eslint-disable-next-line jest/expect-expect
  it('with lat not between -90 and 90 it sends 422', async () => {
    await callServer(undefined, "user=xx&lat=91.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=150.000&heading=180.0&key=test", 422);
  });

  // eslint-disable-next-line jest/expect-expect
  it('with lon not between -180 and 180 it sends 422', async () => {
    await callServer(undefined, "user=xx&lat=45.000&lon=181.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=150.000&heading=180.0&key=test", 422);
  });

  // eslint-disable-next-line jest/expect-expect
  it('with timestamp to old sends 422', async () => {
    const timestamp = new Date().getTime() - 24 * 60 * 60 * 1000 * 2; // two days ago
    await callServer(timestamp, "user=xx&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=150.000&heading=180.0&key=test", 422);
  })

  // eslint-disable-next-line jest/expect-expect
  it('with hdop not between 0 and 100 it sends 422', async () => {
    await callServer(undefined, "user=xx&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=101.0&altitude=5000.000&speed=150.000&heading=180.0&key=test", 422);
  });

  // eslint-disable-next-line jest/expect-expect
  it('with altitude higher 10000 it sends 422', async () => {
    await callServer(undefined, "user=xx&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=10001.000&speed=150.000&heading=180.0&key=test", 422);
  });

  // eslint-disable-next-line jest/expect-expect
  it('altitude can be below 0 it sends 200', async () => {
    await callServer(undefined, "user=xx&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=-99&speed=150.000&heading=180.0&key=test", 422);
  });

  // eslint-disable-next-line jest/expect-expect
  it('with speed not between 0 and 300 it sends 422', async () => {
    await callServer(undefined, "user=xx&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=301.000&heading=180.0&key=test", 422);
  });

  // eslint-disable-next-line jest/expect-expect
  it('with heading not between 0 and 360 it sends 422', async () => {
    await callServer(undefined, "user=xx&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=150.000&heading=361.0&key=test", 422);
  });

  // eslint-disable-next-line jest/expect-expect
  it('with eta not a number it sends 422', async () => {
    await callServer(undefined, "user=xx&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=150.000&heading=361.0&eta=abc&key=test", 422);
  });

  // eslint-disable-next-line jest/expect-expect
  it('with eda not a number it sends 422', async () => {
    await callServer(undefined, "user=xx&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=150.000&heading=361.0&eta=abc&key=test", 422);
  });

  // eslint-disable-next-line jest/expect-expect
  it('with eda to big it sends 422', async () => {
    await callServer(undefined, "user=xx&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=150.000&heading=361.0&eta=100000001&key=test", 422);
  });

  // eslint-disable-next-line jest/expect-expect
  it('with eda to old it sends 422', async () => {
    const timestamp = new Date().getTime() - 24 * 60 * 60 * 1000 * 2; // two days ago
    await callServer(timestamp, "user=xx&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=150.000&heading=180.0&eda=R3Pl4C3&key=test", 422, undefined, true);
  });

  // eslint-disable-next-line jest/expect-expect
  it('with eta correct it sends 200', async () => {
    await callServer(undefined, "user=xx&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=150.000&heading=180.0&eta=R3Pl4C3&key=test", 200, undefined, true);
  });

  // eslint-disable-next-line jest/expect-expect
  it('eda & eta can be 0 it sends 200', async () => {
    await callServer(undefined, "user=xx&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=150.000&heading=180.0&eta=0&eda=0&key=test", 200, undefined);
  });

  // eslint-disable-next-line jest/expect-expect
  it('with eda correct it sends 200', async () => {
    await callServer(undefined, "user=xx&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=150.000&heading=180.0&eta=R3Pl4C3&eda=1000&key=test", 200, undefined, true);
  });
});


describe("GET /write", () => {
  const date = new Date();
	const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;


  it('there should a file of the current date', async () => {
    await callServer(undefined, "user=xx&lat=52.51451&lon=13.35105&timestamp=R3Pl4C3&hdop=20.0&altitude=5000&speed=150.000&heading=180.0&key=test", 200, "GET");

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
        await callServer(undefined, "user=xx&lat=52.51627&lon=13.37770&timestamp=R3Pl4C3&hdop=50&altitude=4000&speed=150.000&heading=180.0&key=test", 200, "GET");
        const jsonData = getData(filePath);
        const entry = jsonData.entries.at(-1)

        expect(jsonData.entries.length).toBe(2);
        expect(entry.index).toBe(1);

        done();
      }, 3500);
    })
  });

  it('the time is correct', () => {
    const jsonData = getData(filePath);
    const entry = jsonData.entries.at(-1)

    expect(entry.index).toBe(1);
    expect(entry.time.created).toBeGreaterThan(date.getTime());
    expect(entry.time.diff).toBeGreaterThan(3.5);
    expect(entry.time.diff).toBeLessThan(5.25);


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

    expect(isInRange(entry.speed.horizontal, 414.42, 118.41)).toBe(true);
    expect(isInRange(entry.speed.vertical, -228.57, 65.31)).toBe(true);
    expect(isInRange(entry.speed.total, 473, 135)).toBe(true);
  });

  it('the heading is correct', () => {
    const jsonData = getData(filePath);
    const entry = jsonData.entries.at(-1)

    expect(entry.heading).toBe(180);
  })

  it('the altitude is correct', () => {
    const jsonData = getData(filePath);
    const entry = jsonData.entries.at(-1)

    expect(entry.altitude).toBe(4000);
  })

  it('the address is correct', () => {
    const jsonData = getData(filePath);
    const entry = jsonData.entries.at(-1)

    expect(entry.address.toLowerCase()).toContain("berlin");
  })


  it('check ignore', async () => {
    let jsonData = getData(filePath);
    let entry = jsonData.entries.at(-1);
    let firstEntry = jsonData.entries[0];
    let previousEntry = null;

    expect(entry.ignore).toBe(false); // current one to be false always

    await callServer(undefined, "user=xx&lat=52.51627&lon=13.37770&timestamp=R3Pl4C3&hdop=50&altitude=2&speed=150.000&heading=180.0&key=test", 200, "GET");

    jsonData = getData(filePath);
    entry = jsonData.entries.at(-1);
    previousEntry = jsonData.entries.at(-2);
    firstEntry = jsonData.entries[0];

    expect(entry.ignore).toBe(false); // current one to be false always
    expect(previousEntry.ignore).toBe(true); // now since there is 3 entries the previous can be ignored
  });
});

describe('Race Condtion Check', () => {
  test(`check most recent wins`, async () => {
    const start = { lat: 52.50960, lon: 13.27457 };
    const end = { lat: 52.51625, lon: 13.37661 };
    const url1 = `http://localhost:80/write?user=xx&lat=${start.lat}&lon=${start.lon}&timestamp=${new Date().getTime()}&hdop=3&altitude=3&speed=3&heading=3&key=test`
    const url2 = `http://localhost:80/write?user=xx&lat=${end.lat}&lon=${end.lon}&timestamp=${new Date().getTime()}&hdop=4&altitude=4&speed=4&heading=4&key=test`

    return new Promise<void>(done => {
      setTimeout(async () => {
        fetch(url1);
        const response = await fetch(url2);
  
        expect(response.status).toBe(200);
        const jsonData = getData(filePath);
        const entry = jsonData.entries.at(-1);
        const previousEntry = jsonData.entries.at(-2);
  
        expect(entry.altitude).toBe(4);
        expect(previousEntry.altitude).not.toBe(3);
  
        expect(entry.address).toBe(""); // third party call shall be cancelt in race condition
        expect(entry.speed.maxSpeed).toBe(undefined);
  
        done();
      }, 10000);
    })

  });
});


describe('API calls', () => {
  test(`1000 api calls`, async () => {
    for (let i = 0; i < 1000; i++) {
      const url = `http://localhost:80/write?user=xx&lat=${(52 + Math.random()).toFixed(3)}&lon=${(13 + Math.random()).toFixed(3)}&timestamp=${new Date().getTime()}&hdop=${(10 * Math.random()).toFixed(3)}&altitude=${i}&speed=88.888&heading=${(360 * Math.random()).toFixed(3)}&key=test`;
      const response = await axios.get(url);
      expect(response.status).toBe(200);
    }
  }, 50000); // adjust this to to fit your setup

  test(`length of json should not exceed 1000`, async () => {
    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dirPath = path.resolve(__dirname, '../../dist/data/');
    const filePath = path.resolve(dirPath, `data-${formattedDate}.json`);
    const jsonData = getData(filePath);
    expect(jsonData.entries.length).toBeLessThanOrEqual(1000);
  });
});


describe('read and login', () => {
  let token = "";
  const testData = {
    user: "TEST",
    password: "test",
    csrfToken: ""
  }

  it('get csrfToken', async () => {
    let response = { data: "" };
    try {
      response = await axios({
        method: "post",
        url: "http://localhost/login/csrf",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "x-requested-with": "XMLHttpRequest"
        }
      })
    } catch (error) {
      console.error(error);
    }

    testData.csrfToken = response.data;
    expect(testData.csrfToken).toBeTruthy();
  })

  test(`redirect without logged in`, async () => {
    try {
      await axios.get("http://localhost:80/read/");
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        expect(axiosError.response.status).toBe(401);
      } else {
        console.error(axiosError);
      }
    }
  });

  it('test user can login', async () => {
    const response = await axios.post('http://localhost:80/login', qs.stringify(testData));

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toEqual(expect.stringContaining('application/json'));
    expect(response).toHaveProperty('data.token');
    expect(response.data.token).not.toBeNull();
    token = response.data.token;
  })

  test('wrong token get error', async () => {
    try {
      await verifiedRequest("http://localhost:80/read?index=0", "justWrongValue");
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        expect([401, 403]).toContain(axiosError.response.status);
      } else {
        console.error(axiosError);
      }
    }
  });

  test('verified request returns json', async () => {
    const response = await verifiedRequest("http://localhost:80/read?index=0", token);
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toEqual(expect.stringContaining('application/json'));
  });

  test(`index parameter to long`, async () => {
    try {
      await verifiedRequest("http://localhost:80/read?index=1234", token);
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
      await verifiedRequest("http://localhost:80/read?index=a9", token);
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
    const response = await verifiedRequest("http://localhost:80/read?index=999", token);
    expect(response.status).toBe(200);
    expect(response.data.entries.length).toBe(1);
  });


  test(`unable to get maptoken without logged in`, async () => {
    try {
      await axios.get("http://localhost:80/read/maptoken");
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        expect(axiosError.response.status).toBe(401);
      } else {
        console.error(axiosError);
      }
    }
  });

  test(`get maptoken with login`, async () => {
    const response = await verifiedRequest("http://localhost:80/read/maptoken", token);
    expect(response.status).toBe(200);
    expect(response.data).toBeTruthy();
    expect(response.data.token).toBeTruthy();
    expect(typeof response.data.token).toBe('string');
  });

  test(`unable to get traffictoken without logged in`, async () => {
    try {
      await axios.get("http://localhost:80/read/traffictoken");
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        expect(axiosError.response.status).toBe(401);
      } else {
        console.error(axiosError);
      }
    }
  });

  test(`get traffictoken with login`, async () => {
    const response = await verifiedRequest("http://localhost:80/read/traffictoken", token);
    expect(response.status).toBe(200);
    expect(response.data).toBeTruthy();
    expect(response.data.token).toBeTruthy();
    expect(typeof response.data.token).toBe('string');
  }); 
});

