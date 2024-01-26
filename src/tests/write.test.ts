import axios, { AxiosError } from 'axios';
import fs from "fs";
import path from "path";

async function callServer(timestamp = new Date().getTime(), query: string, expectStatus: number = 200, method:string = "HEAD") {
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
      expect(axiosError.response!.status).toBe(expectStatus);
    }
  }
}

describe('HEAD /write', () => {
  it('with all parameters correctly set it should succeed', async () => {
    callServer(undefined, "user=xx&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=150.000&heading=180.0&key=test", 200);
  });  

  it('without key it sends 403', async () => {
    callServer(undefined, "user=xx&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=150.000&heading=180.0", 403);
  });

  it('with user length not equal to 2 it sends 422', async () => {
    callServer(undefined, "user=x&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=150.000&heading=180.0&key=test", 422);
  });

  it('with lat not between -90 and 90 it sends 422', async () => {
    callServer(undefined, "user=xx&lat=91.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=150.000&heading=180.0&key=test", 422);
  });

  it('with lon not between -180 and 180 it sends 422', async () => {
    callServer(undefined, "user=xx&lat=45.000&lon=181.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=150.000&heading=180.0&key=test", 422);
  });

  it('with timestamp to old sends 422', async () => {
    const timestamp = new Date().getTime() - 24 * 60 * 60 * 1000 * 2; // two days ago
    callServer(timestamp, "user=xx&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=150.000&heading=180.0&key=test", 422);
  })

  it('with hdop not between 0 and 100 it sends 422', async () => {
    callServer(undefined, "user=xx&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=101.0&altitude=5000.000&speed=150.000&heading=180.0&key=test", 422);
  });

  it('with altitude not between 0 and 10000 it sends 422', async () => {
    callServer(undefined, "user=xx&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=10001.000&speed=150.000&heading=180.0&key=test", 422);
  });

  it('with speed not between 0 and 300 it sends 422', async () => {
    callServer(undefined, "user=xx&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=301.000&heading=180.0&key=test", 422);
  });

  it('with heading not between 0 and 360 it sends 422', async () => {
    callServer(undefined, "user=xx&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=150.000&heading=361.0&key=test", 422);
  });
});


describe("GET /write", () => {
  it('there should a file of the current date', async () => {
    await callServer(undefined, "user=xx&lat=45.000&lon=90.000&timestamp=R3Pl4C3&hdop=50.0&altitude=5000.000&speed=150.000&heading=180.0&key=test", 200, "GET");

    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const dirPath = path.resolve(__dirname, '../../dist/data/');
    const filePath = path.resolve(dirPath, `data-${formattedDate}.json`);
    console.log(filePath);
    fs.access(filePath, fs.constants.F_OK, (err) => {
      expect(err).toBeFalsy();
    });
  });
});