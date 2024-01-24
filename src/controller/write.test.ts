import axios, { AxiosError } from 'axios';

describe('HEAD /write', () => {
  it('with all parameters correctly set it should succeed', async () => {
    const timestamp = new Date().getTime();
    const response = await axios.head(`http://localhost/write?user=xx&lat=45.000&lon=90.000&timestamp=${timestamp}&hdop=50.0&altitude=5000.000&speed=150.000&heading=180.0&key=test`);
    expect(response.status).toBe(200);
	});

  it('without key it sends 403', async () => {
    try {
			const timestamp = new Date().getTime();
			await axios.head(`http://localhost/write?user=xx&lat=45.000&lon=90.000&timestamp=${timestamp}&hdop=50.0&altitude=5000.000&speed=150.000&heading=180.0`);
		} catch (error) {
			const axiosError = error as AxiosError;
			expect(axiosError.response!.status).toBe(403);
		}
	});

	it('with user length not equal to 2 it sends 422', async () => {
		try {
			const timestamp = new Date().getTime();
			await axios.head(`http://localhost/write?user=x&lat=45.000&lon=90.000&timestamp=${timestamp}&hdop=50.0&altitude=5000.000&speed=150.000&heading=180.0&key=test`);
		} catch (error) {
			const axiosError = error as AxiosError;
			expect(axiosError.response!.status).toBe(422);
		}
	});


  it('with lat not between -90 and 90 it sends 422', async () => {
    try {
			const timestamp = new Date().getTime();
      await axios.head(`http://localhost/write?user=xx&lat=91.000&lon=90.000&timestamp=${timestamp}&hdop=50.0&altitude=5000.000&speed=150.000&heading=180.0&key=test`);
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError.response!.status).toBe(422);
    }
  });

  it('with lon not between -180 and 180 it sends 422', async () => {
    try {
			const timestamp = new Date().getTime();
      await axios.head(`http://localhost/write?user=xx&lat=45.000&lon=181.000&timestamp=${timestamp}&hdop=50.0&altitude=5000.000&speed=150.000&heading=180.0&key=test`);
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError.response!.status).toBe(422);
    }
  });

	it('with timestamp to old sends 422', async () => {
    try {
			const timestamp = new Date().getTime() - 24 * 60 * 60 * 1000 * 2; // two days ago
      await axios.head(`http://localhost/write?user=xx&lat=45.000&lon=90.000&timestamp=${timestamp}&hdop=101.0&altitude=5000.000&speed=150.000&heading=180.0&key=test`);
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError.response!.status).toBe(422);
    }
	})

  it('with hdop not between 0 and 100 it sends 422', async () => {
    try {
			const timestamp = new Date().getTime();
      await axios.head(`http://localhost/write?user=xx&lat=45.000&lon=90.000&timestamp=${timestamp}&hdop=101.0&altitude=5000.000&speed=150.000&heading=180.0&key=test`);
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError.response!.status).toBe(422);
    }
  });

  it('with altitude not between 0 and 10000 it sends 422', async () => {
    try {
			const timestamp = new Date().getTime();
      await axios.head(`http://localhost/write?user=xx&lat=45.000&lon=90.000&timestamp=${timestamp}&hdop=50.0&altitude=10001.000&speed=150.000&heading=180.0&key=test`);
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError.response!.status).toBe(422);
    }
  });

  it('with speed not between 0 and 300 it sends 422', async () => {
    try {
			const timestamp = new Date().getTime();
      await axios.head(`http://localhost/write?user=xx&lat=45.000&lon=90.000&timestamp=${timestamp}&hdop=50.0&altitude=5000.000&speed=301.000&heading=180.0&key=test`);
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError.response!.status).toBe(422);
    }
  });

  it('with heading not between 0 and 360 it sends 422', async () => {
    try {
			const timestamp = new Date().getTime();
      await axios.head(`http://localhost/write?user=xx&lat=45.000&lon=90.000&timestamp=${timestamp}&hdop=50.0&altitude=5000.000&speed=150.000&heading=361.0&key=test`);
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError.response!.status).toBe(422);
    }
  });
});
