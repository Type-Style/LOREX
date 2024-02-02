import axios from 'axios';

describe('Server Status', () => {
  it('The server is running', async () => {
    let serverStatus;
    try {
      const response = await axios.get('http://localhost:80/');
      serverStatus = response.status;
    } catch (error) {
      console.error(error);
    }

    expect(serverStatus).toBe(200);
  })
})